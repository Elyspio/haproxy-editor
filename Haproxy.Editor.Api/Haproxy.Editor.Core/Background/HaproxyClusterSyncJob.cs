using Hangfire;
using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Repositories;
using Haproxy.Editor.Core.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Haproxy.Editor.Core.Background;

public class HaproxyClusterSyncJob : IHaproxyClusterSyncJob
{
	private readonly IHaproxyClusterRepository _clusterRepository;
	private readonly ILogger<HaproxyClusterSyncJob> _logger;
	private readonly IHaproxyNodeService _nodeService;
	private readonly IOptionsMonitor<AppConfig> _optionsMonitor;

	public HaproxyClusterSyncJob(
		IHaproxyClusterRepository clusterRepository,
		IHaproxyNodeService nodeService,
		IOptionsMonitor<AppConfig> optionsMonitor,
		ILogger<HaproxyClusterSyncJob> logger)
	{
		_clusterRepository = clusterRepository;
		_nodeService = nodeService;
		_optionsMonitor = optionsMonitor;
		_logger = logger;
	}

	[AutomaticRetry(Attempts = 0)]
	[DisableConcurrentExecution(timeoutInSeconds: 300)]
	public async Task Execute(CancellationToken cancellationToken = default)
	{
		var revision = await _clusterRepository.GetCurrentRevisionNeedingSync(DateTimeOffset.UtcNow, cancellationToken);
		if (revision is null)
		{
			return;
		}

		var dueNodes = revision.Nodes
			.Where(node => node.Enabled
				&& node.SyncStatus != ClusterSyncStatus.Synced
				&& (node.NextAttemptAt == null || node.NextAttemptAt <= DateTimeOffset.UtcNow))
			.ToList();

		if (dueNodes.Count == 0)
		{
			return;
		}

		var attemptAt = DateTimeOffset.UtcNow;
		foreach (var node in dueNodes)
		{
			await _clusterRepository.MarkNodeSyncing(revision.Id, node.NodeId, attemptAt, cancellationToken);
		}

		var results = await Task.WhenAll(dueNodes.Select(node => SyncNode(revision, node, cancellationToken)));

		foreach (var result in results)
		{
			if (result.Success)
			{
				await _clusterRepository.MarkNodeSynced(
					revision.Id,
					result.NodeId,
					result.AppliedVersion,
					updateValidationVersion: string.Equals(result.NodeId, _optionsMonitor.CurrentValue.Cluster.ValidationNodeId, StringComparison.OrdinalIgnoreCase),
					cancellationToken);
				continue;
			}

			await _clusterRepository.MarkNodeFailed(
				revision.Id,
				result.NodeId,
				result.Error ?? "Unknown synchronization failure",
				attemptAt,
				CalculateNextAttemptAt(result.AttemptCount),
				cancellationToken);
		}
	}

	private async Task<NodeSyncResult> SyncNode(ClusterRevisionDocument revision, ClusterNodeRevisionState node, CancellationToken cancellationToken)
	{
		try
		{
			var appliedVersion = await _nodeService.SaveConfig(node.NodeId, revision.ToSnapshot(), cancellationToken);
			return new NodeSyncResult(node.NodeId, true, appliedVersion, node.AttemptCount + 1, null);
		}
		catch (Exception ex)
		{
			_logger.LogWarning(ex, "Failed to synchronize revision {RevisionNumber} on node {NodeId}.", revision.RevisionNumber, node.NodeId);
			return new NodeSyncResult(node.NodeId, false, 0, node.AttemptCount + 1, ex.Message);
		}
	}

	private DateTimeOffset CalculateNextAttemptAt(int attemptCount)
	{
		var baseDelaySeconds = Math.Max(1, _optionsMonitor.CurrentValue.Cluster.RetryDelaySeconds);
		var factor = Math.Min(Math.Max(1, attemptCount), 6);
		return DateTimeOffset.UtcNow.AddSeconds(baseDelaySeconds * Math.Pow(2, factor - 1));
	}

	private sealed record NodeSyncResult(string NodeId, bool Success, long AppliedVersion, int AttemptCount, string? Error);
}
