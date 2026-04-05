using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Data;
using Microsoft.Extensions.Logging;
using Generated = Haproxy.Editor.Adapters.Haproxy;

namespace Haproxy.Editor.Core.Services;

public class NodeHaproxyService : TracingService, IHaproxyNodeService
{
	private readonly Generated.IHaproxyNodeClientFactory _clientFactory;

	public NodeHaproxyService(Generated.IHaproxyNodeClientFactory clientFactory, ILogger<NodeHaproxyService> logger) : base(logger)
	{
		_clientFactory = clientFactory;
	}

	public Task<HaproxyResourceSnapshot> GetConfig(string nodeId, CancellationToken cancellationToken = default)
	{
		using var _ = LogService();
		return LoadSnapshot(_clientFactory.CreateClient(nodeId), cancellationToken: cancellationToken);
	}

	public async Task<long> SaveConfig(string nodeId, HaproxyResourceSnapshot config, CancellationToken cancellationToken = default)
	{
		using var _ = LogService();
		var client = _clientFactory.CreateClient(nodeId);
		var currentVersion = await client.GetConfigurationVersionAsync(cancellationToken: cancellationToken);
		var transaction = await client.StartTransactionAsync(ToClientVersion(currentVersion), cancellationToken);
		var transactionId = GetTransactionId(transaction);

		try
		{
			var baseline = await LoadSnapshot(client, transactionId, cancellationToken);
			await ApplySnapshot(client, config, baseline, transactionId, cancellationToken);
			var commit = await client.CommitTransactionAsync(transactionId, cancellationToken: cancellationToken);
			return commit._version ?? await client.GetConfigurationVersionAsync(cancellationToken: cancellationToken);
		}
		catch
		{
			await TryDeleteTransaction(client, transactionId, cancellationToken);
			throw;
		}
	}

	public async Task<IValidationResult> ValidateConfig(string nodeId, HaproxyResourceSnapshot config, CancellationToken cancellationToken = default)
	{
		using var _ = LogService();
		var client = _clientFactory.CreateClient(nodeId);
		var currentVersion = await client.GetConfigurationVersionAsync(cancellationToken: cancellationToken);
		var transaction = await client.StartTransactionAsync(ToClientVersion(currentVersion), cancellationToken);
		var transactionId = GetTransactionId(transaction);

		try
		{
			var baseline = await LoadSnapshot(client, transactionId, cancellationToken);
			await ApplySnapshot(client, config, baseline, transactionId, cancellationToken);
			return new ValidationResult(true);
		}
		catch (Exception err)
		{
			return new ValidationResult(false, err.Message);
		}
		finally
		{
			await TryDeleteTransaction(client, transactionId, cancellationToken);
		}
	}

	public async Task<NodeRuntimeSnapshot> GetRuntimeSnapshot(string nodeId, HaproxyResourceSnapshot desiredConfig, CancellationToken cancellationToken = default)
	{
		using var _ = LogService();
		var client = _clientFactory.CreateClient(nodeId);
		var healthTask = client.GetHealthAsync(cancellationToken);
		var statsTask = client.GetStatsAsync(cancellationToken: cancellationToken);
		var runtimeServers = await LoadRuntimeServers(client, desiredConfig.Backends, cancellationToken);

		await Task.WhenAll(healthTask, statsTask);

		var health = await healthTask;
		var stats = await statsTask;

		return new NodeRuntimeSnapshot
		{
			RuntimeStatus = health?.Haproxy switch
			{
				Generated.HealthHaproxy.Up => RuntimeStatus.Up,
				Generated.HealthHaproxy.Down => RuntimeStatus.Down,
				_ => RuntimeStatus.Unknown,
			},
			RuntimeError = stats?.Error,
			Backends = BuildRuntimeBackends(desiredConfig, stats, runtimeServers),
		};
	}

	public static IReadOnlyList<DashboardAlert> BuildConfigurationAlerts(HaproxyResourceSnapshot config)
	{
		var alerts = new List<DashboardAlert>();
		var knownBackends = config.Backends.Select(x => x.Name).ToHashSet(StringComparer.Ordinal);

		foreach (var backend in config.Backends.Where(x => x.Servers.Count == 0))
		{
			alerts.Add(new DashboardAlert
			{
				Id = $"backend-empty-{backend.Name}",
				Severity = DashboardAlertSeverity.Critical,
				Message = $"Backend {backend.Name} has no servers configured.",
				ResourceType = DashboardResourceType.Backend,
				ResourceName = backend.Name,
			});
		}

		foreach (var frontend in config.Frontends)
		{
			var hasDefaultBackend = !string.IsNullOrWhiteSpace(frontend.DefaultBackend);
			var hasRules = frontend.BackendSwitchingRules.Count > 0;

			if (!hasDefaultBackend && !hasRules)
			{
				alerts.Add(new DashboardAlert
				{
					Id = $"frontend-empty-{frontend.Name}",
					Severity = DashboardAlertSeverity.Warning,
					Message = $"Frontend {frontend.Name} has no route target.",
					ResourceType = DashboardResourceType.Frontend,
					ResourceName = frontend.Name,
				});
			}

			if (hasDefaultBackend && !knownBackends.Contains(frontend.DefaultBackend!))
			{
				alerts.Add(new DashboardAlert
				{
					Id = $"frontend-default-{frontend.Name}",
					Severity = DashboardAlertSeverity.Critical,
					Message = $"Frontend {frontend.Name} points to missing backend {frontend.DefaultBackend}.",
					ResourceType = DashboardResourceType.Frontend,
					ResourceName = frontend.Name,
				});
			}

			foreach (var rule in frontend.BackendSwitchingRules.Where(rule => !knownBackends.Contains(rule.BackendName)))
			{
				alerts.Add(new DashboardAlert
				{
					Id = $"frontend-rule-{frontend.Name}-{rule.BackendName}",
					Severity = DashboardAlertSeverity.Critical,
					Message = $"Routing rule on {frontend.Name} points to missing backend {rule.BackendName}.",
					ResourceType = DashboardResourceType.Frontend,
					ResourceName = frontend.Name,
				});
			}
		}

		return alerts;
	}

	private static async Task<HaproxyResourceSnapshot> LoadSnapshot(Generated.HaproxyClient client, string? transactionId = null, CancellationToken cancellationToken = default)
	{
		var versionTask = client.GetConfigurationVersionAsync(transactionId, cancellationToken);
		var globalTask = client.GetGlobalAsync(transactionId, true, cancellationToken);
		var defaultsTask = client.GetDefaultsSectionsAsync(transactionId, true, cancellationToken);
		var frontendsTask = client.GetFrontendsAsync(transactionId, true, cancellationToken);
		var backendsTask = client.GetBackendsAsync(transactionId, true, cancellationToken);

		await Task.WhenAll(versionTask, globalTask, defaultsTask, frontendsTask, backendsTask);

		var frontends = await BuildFrontends(client, (await frontendsTask).ToList(), transactionId, cancellationToken);
		var backends = await BuildBackends(client, (await backendsTask).ToList(), transactionId, cancellationToken);

		return new HaproxyResourceSnapshot
		{
			Version = await versionTask,
			Global = ToResource(await globalTask),
			Defaults = (await defaultsTask).Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Frontends = frontends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Backends = backends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Summary = new HaproxySummary
			{
				FrontendCount = frontends.Count,
				BackendCount = backends.Count,
				ServerCount = backends.Sum(x => x.Servers.Count),
			},
		};
	}

	private static async Task<Dictionary<string, IReadOnlyCollection<Generated.Runtime_server>>> LoadRuntimeServers(
		Generated.HaproxyClient client,
		IEnumerable<HaproxyBackendResource> backends,
		CancellationToken cancellationToken)
	{
		var tasks = backends.Select(async backend =>
		{
			var servers = await client.GetAllRuntimeServerAsync(backend.Name, cancellationToken);
			return new KeyValuePair<string, IReadOnlyCollection<Generated.Runtime_server>>(backend.Name, servers.ToList());
		});

		return (await Task.WhenAll(tasks)).ToDictionary(x => x.Key, x => x.Value, StringComparer.Ordinal);
	}

	public static List<RuntimeBackendStatus> BuildRuntimeBackends(
		HaproxyResourceSnapshot config,
		Generated.Native_stats? stats,
		IReadOnlyDictionary<string, IReadOnlyCollection<Generated.Runtime_server>> runtimeServers)
	{
		var allStats = stats?.Stats?.ToList() ?? [];
		var backendStats = allStats
			.Where(x => x.Type == Generated.Native_statType.Backend)
			.ToDictionary(GetStatName, x => x, StringComparer.Ordinal);
		var serverStats = allStats
			.Where(x => x.Type == Generated.Native_statType.Server)
			.GroupBy(x => $"{x.Backend_name ?? string.Empty}/{x.Name ?? string.Empty}", StringComparer.Ordinal)
			.ToDictionary(x => x.Key, x => x.Last(), StringComparer.Ordinal);

		return config.Backends.Select(backend =>
		{
			runtimeServers.TryGetValue(backend.Name, out var runtimeBackendServers);
			backendStats.TryGetValue(backend.Name, out var backendStat);

			var runtimeByName = (runtimeBackendServers ?? [])
				.Where(x => !string.IsNullOrWhiteSpace(x.Name))
				.ToDictionary(x => x.Name!, x => x, StringComparer.Ordinal);

			var servers = backend.Servers.Select(server =>
			{
				runtimeByName.TryGetValue(server.Name, out var runtimeServer);
				serverStats.TryGetValue($"{backend.Name}/{server.Name}", out var serverStat);

				return new RuntimeServerStatus
				{
					Name = server.Name,
					Status = DetermineServerStatus(runtimeServer, serverStat),
					Address = runtimeServer?.Address ?? server.Address,
					Port = runtimeServer?.Port ?? server.Port,
					AdminState = runtimeServer?.Admin_state?.ToString()?.ToLowerInvariant(),
					OperationalState = runtimeServer?.Operational_state?.ToString()?.ToLowerInvariant(),
					CheckStatus = serverStat?.Stats?.Check_status?.ToString()?.ToLowerInvariant(),
					CurrentSessions = serverStat?.Stats?.Scur ?? 0,
					SessionRate = serverStat?.Stats?.Rate ?? serverStat?.Stats?.Conn_rate ?? 0,
				};
			}).ToList();

			return new RuntimeBackendStatus
			{
				Name = backend.Name,
				Status = DetermineBackendStatus(backendStat, servers),
				CurrentSessions = backendStat?.Stats?.Scur ?? 0,
				SessionRate = backendStat?.Stats?.Rate ?? backendStat?.Stats?.Conn_rate ?? 0,
				BytesIn = backendStat?.Stats?.Bin ?? 0,
				BytesOut = backendStat?.Stats?.Bout ?? 0,
				HealthyServers = servers.Count(x => x.Status == RuntimeStatus.Up),
				DownServers = servers.Count(x => x.Status == RuntimeStatus.Down),
				MaintenanceServers = servers.Count(x => x.Status == RuntimeStatus.Maintenance),
				Servers = servers,
			};
		}).ToList();
	}

	private static async Task<List<HaproxyFrontendResource>> BuildFrontends(
		Generated.HaproxyClient client,
		IReadOnlyList<Generated.Frontend> frontends,
		string? transactionId,
		CancellationToken cancellationToken)
	{
		var tasks = frontends.Select(async frontend =>
		{
			var bindsTask = client.GetAllBindFrontendAsync(frontend.Name, transactionId, cancellationToken);
			var aclsTask = client.GetAllAclFrontendAsync(frontend.Name, null, transactionId, cancellationToken);
			var rulesTask = client.GetBackendSwitchingRulesAsync(frontend.Name, transactionId, cancellationToken);

			await Task.WhenAll(bindsTask, aclsTask, rulesTask);

			return new HaproxyFrontendResource
			{
				Name = frontend.Name,
				Mode = ToApiString(frontend.Mode),
				DefaultBackend = frontend.Default_backend,
				Binds = (await bindsTask).Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
				Acls = (await aclsTask).Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
				BackendSwitchingRules = (await rulesTask).Select(ToResource).ToList(),
			};
		});

		return (await Task.WhenAll(tasks)).ToList();
	}

	private static async Task<List<HaproxyBackendResource>> BuildBackends(
		Generated.HaproxyClient client,
		IReadOnlyList<Generated.Backend> backends,
		string? transactionId,
		CancellationToken cancellationToken)
	{
		var tasks = backends.Select(async backend =>
		{
			var servers = await client.GetAllServerBackendAsync(backend.Name, transactionId, cancellationToken);
			return new HaproxyBackendResource
			{
				Name = backend.Name,
				Mode = ToApiString(backend.Mode),
				Balance = backend.Balance?.Algorithm.ToString().ToLowerInvariant(),
				Servers = servers.Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			};
		});

		return (await Task.WhenAll(tasks)).ToList();
	}

	private static async Task ApplySnapshot(Generated.HaproxyClient client, HaproxyResourceSnapshot desired, HaproxyResourceSnapshot baseline, string transactionId, CancellationToken cancellationToken)
	{
		if (desired.Global != baseline.Global)
		{
			await client.ReplaceGlobalAsync(ToGenerated(desired.Global), transactionId, null, null, true, cancellationToken);
		}

		var baselineDefaultsByName = baseline.Defaults.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var defaults in desired.Defaults)
		{
			var payload = ToGenerated(defaults);
			if (!baselineDefaultsByName.ContainsKey(defaults.Name))
			{
				await client.AddDefaultsSectionAsync(payload, transactionId, null, null, true, cancellationToken);
			}
			else if (defaults != baselineDefaultsByName[defaults.Name])
			{
				await client.ReplaceDefaultsSectionAsync(defaults.Name, payload, transactionId, null, null, true, cancellationToken);
			}
		}

		var baselineFrontendsByName = baseline.Frontends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var frontend in desired.Frontends)
		{
			var payload = ToGenerated(frontend);
			if (!baselineFrontendsByName.TryGetValue(frontend.Name, out var current))
			{
				await client.CreateFrontendAsync(payload, transactionId, null, null, true, cancellationToken);
			}
			else if (HasFrontendChanged(frontend, current))
			{
				await client.ReplaceFrontendAsync(frontend.Name, payload, transactionId, null, null, true, cancellationToken);
			}
		}

		var baselineBackendsByName = baseline.Backends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var backend in desired.Backends)
		{
			var payload = ToGenerated(backend);
			if (!baselineBackendsByName.TryGetValue(backend.Name, out var current))
			{
				await client.CreateBackendAsync(payload, transactionId, null, null, true, cancellationToken);
			}
			else if (HasBackendChanged(backend, current))
			{
				await client.ReplaceBackendAsync(backend.Name, payload, transactionId, null, null, true, cancellationToken);
			}
		}

		foreach (var frontend in desired.Frontends)
		{
			baselineFrontendsByName.TryGetValue(frontend.Name, out var current);
			await ReconcileBinds(client, frontend, current, transactionId, cancellationToken);
			await ReconcileFrontendAcls(client, frontend, current, transactionId, cancellationToken);
			await ReconcileFrontendBackendSwitchingRules(client, frontend, current, transactionId, cancellationToken);
		}

		foreach (var backend in desired.Backends)
		{
			baselineBackendsByName.TryGetValue(backend.Name, out var current);
			await ReconcileServers(client, backend, current, transactionId, cancellationToken);
		}

		foreach (var removed in baseline.Frontends.Where(x => desired.Frontends.All(y => !string.Equals(y.Name, x.Name, StringComparison.Ordinal))))
		{
			await client.DeleteFrontendAsync(removed.Name, transactionId, cancellationToken: cancellationToken);
		}

		foreach (var removed in baseline.Backends.Where(x => desired.Backends.All(y => !string.Equals(y.Name, x.Name, StringComparison.Ordinal))))
		{
			await client.DeleteBackendAsync(removed.Name, transactionId, cancellationToken: cancellationToken);
		}

		foreach (var removed in baseline.Defaults.Where(x => desired.Defaults.All(y => !string.Equals(y.Name, x.Name, StringComparison.Ordinal))))
		{
			await client.DeleteDefaultsSectionAsync(removed.Name, transactionId, null, null, true, cancellationToken);
		}
	}

	private static async Task ReconcileBinds(Generated.HaproxyClient client, HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId, CancellationToken cancellationToken)
	{
		var currentByName = (current?.Binds ?? []).ToDictionary(x => x.Name, StringComparer.Ordinal);
		var desiredByName = desired.Binds.ToDictionary(x => x.Name, StringComparer.Ordinal);

		foreach (var removed in currentByName.Keys.Except(desiredByName.Keys, StringComparer.Ordinal))
		{
			await client.DeleteBindFrontendAsync(removed, desired.Name, transactionId, cancellationToken: cancellationToken);
		}

		foreach (var bind in desired.Binds)
		{
			var payload = ToGenerated(bind);
			if (!currentByName.TryGetValue(bind.Name, out var existing))
			{
				await client.CreateBindFrontendAsync(desired.Name, payload, transactionId, cancellationToken: cancellationToken);
			}
			else if (bind != existing)
			{
				await client.ReplaceBindFrontendAsync(bind.Name, desired.Name, payload, transactionId, cancellationToken: cancellationToken);
			}
		}
	}

	private static async Task ReconcileServers(Generated.HaproxyClient client, HaproxyBackendResource desired, HaproxyBackendResource? current, string transactionId, CancellationToken cancellationToken)
	{
		var currentByName = (current?.Servers ?? []).ToDictionary(x => x.Name, StringComparer.Ordinal);
		var desiredByName = desired.Servers.ToDictionary(x => x.Name, StringComparer.Ordinal);

		foreach (var removed in currentByName.Keys.Except(desiredByName.Keys, StringComparer.Ordinal))
		{
			await client.DeleteServerBackendAsync(removed, desired.Name, transactionId, cancellationToken: cancellationToken);
		}

		foreach (var server in desired.Servers)
		{
			var payload = ToGenerated(server);
			if (!currentByName.TryGetValue(server.Name, out var existing))
			{
				await client.CreateServerBackendAsync(desired.Name, payload, transactionId, cancellationToken: cancellationToken);
			}
			else if (server != existing)
			{
				await client.ReplaceServerBackendAsync(server.Name, desired.Name, payload, transactionId, cancellationToken: cancellationToken);
			}
		}
	}

	private static Task ReconcileFrontendAcls(Generated.HaproxyClient client, HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId, CancellationToken cancellationToken)
	{
		var currentAcls = current?.Acls ?? [];
		return !desired.Acls.SequenceEqual(currentAcls)
			? client.ReplaceAllAclFrontendAsync(desired.Name, desired.Acls.Select(ToGenerated), transactionId, cancellationToken: cancellationToken)
			: Task.CompletedTask;
	}

	private static Task ReconcileFrontendBackendSwitchingRules(Generated.HaproxyClient client, HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId, CancellationToken cancellationToken)
	{
		var currentRules = current?.BackendSwitchingRules ?? [];
		return !desired.BackendSwitchingRules.SequenceEqual(currentRules)
			? client.ReplaceBackendSwitchingRulesAsync(desired.Name, desired.BackendSwitchingRules.Select(ToGenerated), transactionId, cancellationToken: cancellationToken)
			: Task.CompletedTask;
	}

	private static async Task TryDeleteTransaction(Generated.HaproxyClient client, string transactionId, CancellationToken cancellationToken)
	{
		try
		{
			await client.DeleteTransactionAsync(transactionId, cancellationToken);
		}
		catch
		{
			// Best-effort cleanup after validation/save failures.
		}
	}

	private static bool HasFrontendChanged(HaproxyFrontendResource desired, HaproxyFrontendResource current)
	{
		return !string.Equals(desired.Mode, current.Mode, StringComparison.Ordinal)
			|| !string.Equals(desired.DefaultBackend, current.DefaultBackend, StringComparison.Ordinal);
	}

	private static bool HasBackendChanged(HaproxyBackendResource desired, HaproxyBackendResource current)
	{
		return !string.Equals(desired.Mode, current.Mode, StringComparison.Ordinal)
			|| !string.Equals(desired.Balance, current.Balance, StringComparison.Ordinal);
	}

	private static RuntimeStatus DetermineBackendStatus(Generated.Native_stat? backendStat, IReadOnlyCollection<RuntimeServerStatus> servers)
	{
		if (servers.Count == 0)
		{
			return RuntimeStatus.Empty;
		}

		if (servers.Any(x => x.Status == RuntimeStatus.Up) && servers.Any(x => x.Status == RuntimeStatus.Down))
		{
			return RuntimeStatus.Degraded;
		}

		if (servers.All(x => x.Status == RuntimeStatus.Down))
		{
			return RuntimeStatus.Critical;
		}

		if (servers.All(x => x.Status == RuntimeStatus.Maintenance))
		{
			return RuntimeStatus.Maintenance;
		}

		return backendStat?.Stats?.Status switch
		{
			Generated.Native_stat_statsStatus.UP => RuntimeStatus.Healthy,
			Generated.Native_stat_statsStatus.No_check => RuntimeStatus.Healthy,
			Generated.Native_stat_statsStatus.MAINT => RuntimeStatus.Maintenance,
			Generated.Native_stat_statsStatus.DOWN => RuntimeStatus.Critical,
			_ => servers.Any(x => x.Status == RuntimeStatus.Up) ? RuntimeStatus.Healthy : RuntimeStatus.Unknown,
		};
	}

	private static RuntimeStatus DetermineServerStatus(Generated.Runtime_server? runtimeServer, Generated.Native_stat? serverStat)
	{
		if (runtimeServer?.Admin_state is Generated.Runtime_serverAdmin_state.Maint or Generated.Runtime_serverAdmin_state.Drain)
		{
			return RuntimeStatus.Maintenance;
		}

		if (runtimeServer?.Operational_state == Generated.Runtime_serverOperational_state.Down)
		{
			return RuntimeStatus.Down;
		}

		return serverStat?.Stats?.Status switch
		{
			Generated.Native_stat_statsStatus.UP => RuntimeStatus.Up,
			Generated.Native_stat_statsStatus.No_check => RuntimeStatus.Up,
			Generated.Native_stat_statsStatus.MAINT => RuntimeStatus.Maintenance,
			Generated.Native_stat_statsStatus.DOWN => RuntimeStatus.Down,
			_ => runtimeServer?.Operational_state == Generated.Runtime_serverOperational_state.Up ? RuntimeStatus.Up : RuntimeStatus.Unknown,
		};
	}

	private static string GetStatName(Generated.Native_stat stat)
	{
		return stat.Backend_name ?? stat.Name ?? string.Empty;
	}

	private static string GetTransactionId(Generated.Transaction transaction)
	{
		return transaction.Id ?? throw new InvalidOperationException("Data Plane API did not return a transaction id.");
	}

	private static int ToClientVersion(long version)
	{
		return checked((int)version);
	}

	private static string? ToApiString<TEnum>(TEnum? value) where TEnum : struct, Enum
	{
		return value?.ToString()?.ToLowerInvariant();
	}

	private static TEnum? ParseEnum<TEnum>(string? value) where TEnum : struct, Enum
	{
		if (string.IsNullOrWhiteSpace(value))
		{
			return null;
		}

		return Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : null;
	}

	private static HaproxyGlobalResource ToResource(Generated.Global global)
	{
		return new HaproxyGlobalResource
		{
			Daemon = global.Daemon ?? false,
		};
	}

	private static HaproxyDefaultsResource ToResource(Generated.Defaults defaults)
	{
		return new HaproxyDefaultsResource
		{
			Name = defaults.Name ?? string.Empty,
			Mode = ToApiString(defaults.Mode),
		};
	}

	private static HaproxyBindResource ToResource(Generated.Bind bind)
	{
		return new HaproxyBindResource
		{
			Name = bind.Name ?? string.Empty,
			Address = bind.Address,
			Port = bind.Port,
		};
	}

	private static HaproxyAclResource ToResource(Generated.Acl acl)
	{
		return new HaproxyAclResource
		{
			Name = acl.Acl_name ?? string.Empty,
			Criterion = acl.Criterion,
			Value = acl.Value,
		};
	}

	private static HaproxyBackendSwitchingRuleResource ToResource(Generated.Backend_switching_rule rule)
	{
		return new HaproxyBackendSwitchingRuleResource
		{
			BackendName = rule.Name ?? string.Empty,
			Cond = ToApiString(rule.Cond),
			CondTest = rule.Cond_test,
		};
	}

	private static HaproxyServerResource ToResource(Generated.Server server)
	{
		return new HaproxyServerResource
		{
			Name = server.Name ?? string.Empty,
			Address = server.Address,
			Port = server.Port,
			Check = ToApiString(server.Check),
		};
	}

	private static Generated.Global ToGenerated(HaproxyGlobalResource global)
	{
		return new Generated.Global
		{
			Daemon = global.Daemon,
		};
	}

	private static Generated.Defaults ToGenerated(HaproxyDefaultsResource defaults)
	{
		return new Generated.Defaults
		{
			Name = defaults.Name,
			Mode = ParseEnum<Generated.Defaults_baseMode>(defaults.Mode),
		};
	}

	private static Generated.Frontend ToGenerated(HaproxyFrontendResource frontend)
	{
		return new Generated.Frontend
		{
			Name = frontend.Name,
			Mode = ParseEnum<Generated.Frontend_baseMode>(frontend.Mode),
			Default_backend = frontend.DefaultBackend,
		};
	}

	private static Generated.Backend ToGenerated(HaproxyBackendResource backend)
	{
		return new Generated.Backend
		{
			Name = backend.Name,
			Mode = ParseEnum<Generated.Backend_baseMode>(backend.Mode),
			Balance = string.IsNullOrWhiteSpace(backend.Balance)
				? null
				: new Generated.Balance
				{
					Algorithm = ParseEnum<Generated.BalanceAlgorithm>(backend.Balance)
						?? throw new InvalidOperationException($"Unsupported balance algorithm '{backend.Balance}'."),
				},
		};
	}

	private static Generated.Bind ToGenerated(HaproxyBindResource bind)
	{
		return new Generated.Bind
		{
			Name = bind.Name,
			Address = bind.Address,
			Port = bind.Port,
		};
	}

	private static Generated.Acl ToGenerated(HaproxyAclResource acl)
	{
		return new Generated.Acl
		{
			Acl_name = acl.Name,
			Criterion = acl.Criterion ?? string.Empty,
			Value = acl.Value,
		};
	}

	private static Generated.Backend_switching_rule ToGenerated(HaproxyBackendSwitchingRuleResource rule)
	{
		return new Generated.Backend_switching_rule
		{
			Name = rule.BackendName,
			Cond = ParseEnum<Generated.Backend_switching_ruleCond>(rule.Cond),
			Cond_test = rule.CondTest,
		};
	}

	private static Generated.Server ToGenerated(HaproxyServerResource server)
	{
		return new Generated.Server
		{
			Name = server.Name,
			Address = server.Address ?? string.Empty,
			Port = server.Port,
			Check = ParseEnum<Generated.Server_paramsCheck>(server.Check),
		};
	}
}
