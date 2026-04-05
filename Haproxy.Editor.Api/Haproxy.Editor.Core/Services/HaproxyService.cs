using Elyspio.Utils.Telemetry.Tracing.Elements;
using Hangfire;
using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Repositories;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Haproxy.Editor.Core.Background;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Haproxy.Editor.Core.Services;

public class HaproxyService : TracingService, IHaproxyService
{
	private readonly IBackgroundJobClient _backgroundJobClient;
	private readonly IHaproxyClusterRepository _clusterRepository;
	private readonly IHttpContextAccessor _httpContextAccessor;
	private readonly IHaproxyNodeService _nodeService;
	private readonly IOptionsMonitor<AppConfig> _optionsMonitor;

	public HaproxyService(
		IHaproxyNodeService nodeService,
		IHaproxyClusterRepository clusterRepository,
		IBackgroundJobClient backgroundJobClient,
		IOptionsMonitor<AppConfig> optionsMonitor,
		IHttpContextAccessor httpContextAccessor,
		ILogger<HaproxyService> logger) : base(logger)
	{
		_nodeService = nodeService;
		_clusterRepository = clusterRepository;
		_backgroundJobClient = backgroundJobClient;
		_optionsMonitor = optionsMonitor;
		_httpContextAccessor = httpContextAccessor;
	}

	public async Task<HaproxyResourceSnapshot> GetConfig()
	{
		using var _ = LogService();
		var revision = await EnsureCurrentRevision();
		return revision.ToSnapshot();
	}

	public async Task SaveConfig(HaproxyResourceSnapshot config)
	{
		using var _ = LogService();

		var validationNodeId = _optionsMonitor.CurrentValue.Cluster.ValidationNodeId;
		var normalized = NormalizeSnapshot(config);
		var validation = await _nodeService.ValidateConfig(validationNodeId, normalized);
		if (!validation.IsValid)
		{
			throw new InvalidOperationException(validation.ErrorMessage ?? "Configuration validation failed.");
		}

		var validationVersion = (await _nodeService.GetConfig(validationNodeId)).Version;
		await _clusterRepository.CreateNewCurrentRevision(
			normalized,
			GetCurrentActor(),
			validationVersion,
			markValidationNodeSynced: false);

		_backgroundJobClient.Enqueue<IHaproxyClusterSyncJob>(job => job.Execute(CancellationToken.None));
	}

	public async Task<DashboardSnapshot> GetDashboardSnapshot()
	{
		using var _ = LogService();

		var revision = await EnsureCurrentRevision();
		var desiredConfig = revision.ToSnapshot();
		var nodeSnapshots = await LoadNodeSnapshots(revision, desiredConfig);
		var aggregatedBackends = AggregateBackends(nodeSnapshots.Where(x => x.Enabled && x.Runtime is not null).Select(x => x.Runtime!).ToList());
		var alerts = BuildAlerts(desiredConfig, revision, nodeSnapshots, aggregatedBackends);
		var clusterStatus = DetermineClusterStatus(revision, nodeSnapshots);

		return new DashboardSnapshot
		{
			Summary = BuildDashboardSummary(desiredConfig, alerts, aggregatedBackends, clusterStatus),
			Alerts = alerts,
			Backends = aggregatedBackends,
			Cluster = new ClusterDashboardSnapshot
			{
				ClusterId = revision.ClusterId,
				CurrentRevision = revision.RevisionNumber,
				Status = clusterStatus,
				TotalNodes = revision.Nodes.Count(x => x.Enabled),
				SyncedNodes = revision.Nodes.Count(x => x.Enabled && x.SyncStatus == ClusterSyncStatus.Synced),
				Nodes = nodeSnapshots.Select(x => new ClusterNodeDashboardSnapshot
				{
					NodeId = x.State.NodeId,
					DisplayName = x.State.DisplayName,
					Enabled = x.Enabled,
					RuntimeStatus = x.Runtime?.RuntimeStatus ?? RuntimeStatus.Unknown,
					SyncStatus = x.State.SyncStatus,
					LastAttemptAt = x.State.LastAttemptAt,
					LastSuccessAt = x.State.LastSuccessAt,
					LastError = x.State.LastError ?? x.RuntimeError,
				}).ToList(),
			},
		};
	}

	public async Task<IValidationResult> ValidateConfig(HaproxyResourceSnapshot config)
	{
		using var _ = LogService();
		return await _nodeService.ValidateConfig(_optionsMonitor.CurrentValue.Cluster.ValidationNodeId, NormalizeSnapshot(config));
	}

	private async Task<ClusterRevisionDocument> EnsureCurrentRevision()
	{
		var current = await _clusterRepository.GetCurrentRevision();
		if (current is not null)
		{
			return current;
		}

		var validationNodeId = _optionsMonitor.CurrentValue.Cluster.ValidationNodeId;
		var snapshot = NormalizeSnapshot(await _nodeService.GetConfig(validationNodeId));
		var created = await _clusterRepository.CreateNewCurrentRevision(
			snapshot,
			"bootstrap",
			snapshot.Version,
			markValidationNodeSynced: true);

		_backgroundJobClient.Enqueue<IHaproxyClusterSyncJob>(job => job.Execute(CancellationToken.None));
		return created;
	}

	private async Task<List<NodeDashboardState>> LoadNodeSnapshots(ClusterRevisionDocument revision, HaproxyResourceSnapshot desiredConfig)
	{
		var tasks = revision.Nodes.Select(async state =>
		{
			if (!state.Enabled)
			{
				return new NodeDashboardState(state, false, null, null);
			}

			try
			{
				var runtime = await _nodeService.GetRuntimeSnapshot(state.NodeId, desiredConfig);
				return new NodeDashboardState(state, true, runtime, runtime.RuntimeError);
			}
			catch (Exception ex)
			{
				return new NodeDashboardState(state, true, null, ex.Message);
			}
		});

		return (await Task.WhenAll(tasks)).OrderBy(x => x.State.NodeId, StringComparer.Ordinal).ToList();
	}

	private static HaproxyResourceSnapshot NormalizeSnapshot(HaproxyResourceSnapshot snapshot)
	{
		var frontends = snapshot.Frontends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList();
		var backends = snapshot.Backends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList();
		return snapshot with
		{
			Defaults = snapshot.Defaults.OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Frontends = frontends,
			Backends = backends,
			Summary = new HaproxySummary
			{
				FrontendCount = frontends.Count,
				BackendCount = backends.Count,
				ServerCount = backends.Sum(x => x.Servers.Count),
			},
		};
	}

	private List<DashboardAlert> BuildAlerts(
		HaproxyResourceSnapshot config,
		ClusterRevisionDocument revision,
		IReadOnlyCollection<NodeDashboardState> nodeSnapshots,
		IReadOnlyCollection<RuntimeBackendStatus> aggregatedBackends)
	{
		var alerts = NodeHaproxyService.BuildConfigurationAlerts(config).ToList();

		foreach (var node in nodeSnapshots.Where(x => x.Enabled && x.State.SyncStatus == ClusterSyncStatus.Failed))
		{
			alerts.Add(new DashboardAlert
			{
				Id = $"cluster-sync-{node.State.NodeId}",
				Severity = DashboardAlertSeverity.Critical,
				Message = $"Node {node.State.DisplayName} failed to apply revision {revision.RevisionNumber}.",
				ResourceType = DashboardResourceType.Node,
				ResourceName = node.State.DisplayName,
			});
		}

		foreach (var node in nodeSnapshots.Where(x => x.Enabled && x.RuntimeError is not null))
		{
			alerts.Add(new DashboardAlert
			{
				Id = $"cluster-runtime-{node.State.NodeId}",
				Severity = DashboardAlertSeverity.Warning,
				Message = $"Node {node.State.DisplayName} runtime is unavailable: {node.RuntimeError}",
				ResourceType = DashboardResourceType.Node,
				ResourceName = node.State.DisplayName,
			});
		}

		foreach (var node in nodeSnapshots.Where(x => x.Enabled && x.Runtime?.RuntimeStatus == RuntimeStatus.Down))
		{
			alerts.Add(new DashboardAlert
			{
				Id = $"cluster-health-{node.State.NodeId}",
				Severity = DashboardAlertSeverity.Critical,
				Message = $"HAProxy health is down on node {node.State.DisplayName}.",
				ResourceType = DashboardResourceType.Node,
				ResourceName = node.State.DisplayName,
			});
		}

		foreach (var backend in aggregatedBackends.Where(x => x.DownServers > 0))
		{
			alerts.Add(new DashboardAlert
			{
				Id = $"backend-runtime-{backend.Name}",
				Severity = backend.HealthyServers == 0 ? DashboardAlertSeverity.Critical : DashboardAlertSeverity.Warning,
				Message = backend.HealthyServers == 0
					? $"All services in backend {backend.Name} are unavailable across the cluster."
					: $"{backend.DownServers} services are down in backend {backend.Name} across the cluster.",
				ResourceType = DashboardResourceType.Backend,
				ResourceName = backend.Name,
			});
		}

		return alerts;
	}

	private static DashboardSummary BuildDashboardSummary(
		HaproxyResourceSnapshot config,
		IReadOnlyCollection<DashboardAlert> alerts,
		IReadOnlyCollection<RuntimeBackendStatus> backends,
		RuntimeStatus clusterStatus)
	{
		var criticalAlerts = alerts.Count(x => x.Severity == DashboardAlertSeverity.Critical);
		var totalRoutes = config.Frontends.Sum(x => x.BackendSwitchingRules.Count);
		var activeServices = backends.Sum(x => x.HealthyServers);
		var downServices = backends.Sum(x => x.DownServers);

		return new DashboardSummary
		{
			GeneratedAt = DateTimeOffset.UtcNow,
			RuntimeStatus = clusterStatus,
			Alerts = new DashboardKpi
			{
				Title = "Alerts",
				Value = criticalAlerts > 0 ? criticalAlerts : alerts.Count,
				Subtitle = criticalAlerts > 0 ? $"{criticalAlerts} critical issues" : alerts.Count == 0 ? "No active issues" : $"{alerts.Count} operational notices",
				Tone = criticalAlerts > 0 ? DashboardTone.Critical : alerts.Count > 0 ? DashboardTone.Warning : DashboardTone.Success,
				Trend = [alerts.Count, criticalAlerts, backends.Sum(x => x.DownServers), backends.Sum(x => x.MaintenanceServers)],
			},
			Routes = new DashboardKpi
			{
				Title = "Routes",
				Value = totalRoutes,
				Subtitle = totalRoutes == 0 ? "No switching rules" : $"{totalRoutes} redirected rules",
				Tone = totalRoutes > 0 ? DashboardTone.Warning : DashboardTone.Neutral,
				Trend = config.Frontends.Select(x => x.BackendSwitchingRules.Count).DefaultIfEmpty(0).ToList(),
			},
			Services = new DashboardKpi
			{
				Title = "Services",
				Value = activeServices,
				Subtitle = downServices > 0 ? $"{downServices} services degraded" : $"{backends.Count} backend groups monitored",
				Tone = downServices > 0 ? DashboardTone.Warning : DashboardTone.Info,
				Trend = backends.Select(x => x.SessionRate).DefaultIfEmpty(0).ToList(),
			},
		};
	}

	private static List<RuntimeBackendStatus> AggregateBackends(IReadOnlyCollection<NodeRuntimeSnapshot> runtimes)
	{
		return runtimes
			.SelectMany(runtime => runtime.Backends)
			.GroupBy(x => x.Name, StringComparer.Ordinal)
			.Select(group =>
			{
				var servers = group
					.SelectMany(x => x.Servers)
					.GroupBy(x => x.Name, StringComparer.Ordinal)
					.Select(serverGroup =>
					{
						var sample = serverGroup.First();
						return new RuntimeServerStatus
						{
							Name = sample.Name,
							Status = DetermineAggregatedServerStatus(serverGroup),
							Address = sample.Address,
							Port = sample.Port,
							AdminState = sample.AdminState,
							OperationalState = sample.OperationalState,
							CheckStatus = sample.CheckStatus,
							CurrentSessions = serverGroup.Sum(x => x.CurrentSessions),
							SessionRate = serverGroup.Sum(x => x.SessionRate),
						};
					})
					.OrderBy(x => x.Name, StringComparer.Ordinal)
					.ToList();

				return new RuntimeBackendStatus
				{
					Name = group.Key,
					Status = DetermineAggregatedBackendStatus(servers),
					CurrentSessions = group.Sum(x => x.CurrentSessions),
					SessionRate = group.Sum(x => x.SessionRate),
					BytesIn = group.Sum(x => x.BytesIn),
					BytesOut = group.Sum(x => x.BytesOut),
					HealthyServers = servers.Count(x => x.Status is RuntimeStatus.Up or RuntimeStatus.Healthy),
					DownServers = servers.Count(x => x.Status is RuntimeStatus.Down or RuntimeStatus.Critical),
					MaintenanceServers = servers.Count(x => x.Status == RuntimeStatus.Maintenance),
					Servers = servers,
				};
			})
			.OrderBy(x => x.Name, StringComparer.Ordinal)
			.ToList();
	}

	private static RuntimeStatus DetermineAggregatedServerStatus(IEnumerable<RuntimeServerStatus> servers)
	{
		return servers
			.Select(x => x.Status)
			.OrderByDescending(GetStatusSeverity)
			.FirstOrDefault();
	}

	private static RuntimeStatus DetermineAggregatedBackendStatus(IReadOnlyCollection<RuntimeServerStatus> servers)
	{
		if (servers.Count == 0)
		{
			return RuntimeStatus.Empty;
		}

		if (servers.All(x => x.Status is RuntimeStatus.Down or RuntimeStatus.Critical))
		{
			return RuntimeStatus.Critical;
		}

		if (servers.All(x => x.Status == RuntimeStatus.Maintenance))
		{
			return RuntimeStatus.Maintenance;
		}

		if (servers.Any(x => x.Status is RuntimeStatus.Down or RuntimeStatus.Critical))
		{
			return RuntimeStatus.Degraded;
		}

		if (servers.Any(x => x.Status is RuntimeStatus.Up or RuntimeStatus.Healthy))
		{
			return RuntimeStatus.Healthy;
		}

		return RuntimeStatus.Unknown;
	}

	private static RuntimeStatus DetermineClusterStatus(ClusterRevisionDocument revision, IReadOnlyCollection<NodeDashboardState> nodes)
	{
		var enabledNodes = nodes.Where(x => x.Enabled).ToList();
		if (enabledNodes.Count == 0)
		{
			return RuntimeStatus.Unknown;
		}

		if (enabledNodes.Any(x => x.State.SyncStatus == ClusterSyncStatus.Failed || x.Runtime?.RuntimeStatus == RuntimeStatus.Down))
		{
			return RuntimeStatus.Critical;
		}

		if (enabledNodes.Any(x => x.State.SyncStatus != ClusterSyncStatus.Synced || x.Runtime is null || x.Runtime.RuntimeStatus != RuntimeStatus.Up))
		{
			return RuntimeStatus.Degraded;
		}

		return revision.Nodes.Count(x => x.Enabled && x.SyncStatus == ClusterSyncStatus.Synced) == revision.Nodes.Count(x => x.Enabled)
			? RuntimeStatus.Healthy
			: RuntimeStatus.Degraded;
	}

	private static int GetStatusSeverity(RuntimeStatus status)
	{
		return status switch
		{
			RuntimeStatus.Critical => 6,
			RuntimeStatus.Down => 5,
			RuntimeStatus.Degraded => 4,
			RuntimeStatus.Maintenance => 3,
			RuntimeStatus.Healthy => 2,
			RuntimeStatus.Up => 2,
			RuntimeStatus.Empty => 1,
			_ => 0,
		};
	}

	private string GetCurrentActor()
	{
		return _httpContextAccessor.HttpContext?.User?.Identity?.Name
			?? _httpContextAccessor.HttpContext?.User?.FindFirst("preferred_username")?.Value
			?? "unknown";
	}

	private sealed record NodeDashboardState(
		ClusterNodeRevisionState State,
		bool Enabled,
		NodeRuntimeSnapshot? Runtime,
		string? RuntimeError);
}
