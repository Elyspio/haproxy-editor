using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Repositories;
using Haproxy.Editor.Adapters.Mongo.Repositories.Base;
using Haproxy.Editor.Adapters.Mongo.Technical;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.Logging;
using MongoDB.Driver;

namespace Haproxy.Editor.Adapters.Mongo.Repositories;

internal class HaproxyClusterRepository : BaseRepository<ClusterRevisionDocument>, IHaproxyClusterRepository
{
	private readonly string _clusterId;
	private readonly IReadOnlyList<HaproxyClusterNodeConfig> _nodes;
	private readonly string _validationNodeId;

	public HaproxyClusterRepository(MongoContext context, IConfiguration configuration, ILogger<HaproxyClusterRepository> logger)
		: base(context, logger)
	{
		var appConfig = configuration.GetRequiredSection(AppConfig.Section).Get<AppConfig>()
			?? throw new InvalidOperationException("App configuration section is missing.");

		_clusterId = appConfig.Cluster.ClusterId;
		_validationNodeId = appConfig.Cluster.ValidationNodeId;
		_nodes = appConfig.Cluster.Nodes;

		CreateIndexIfMissing(["ClusterId", "IsCurrent"]);
		CreateIndexIfMissing(["ClusterId", "RevisionNumber"], unique: true);
	}

	protected override string CollectionName => "haproxy_cluster_revisions";

	public async Task<ClusterRevisionDocument?> GetCurrentRevision(CancellationToken cancellationToken = default)
	{
		return await EntityCollection.Find(x => x.ClusterId == _clusterId && x.IsCurrent)
			.SortByDescending(x => x.RevisionNumber)
			.FirstOrDefaultAsync(cancellationToken);
	}

	public async Task<ClusterRevisionDocument> CreateNewCurrentRevision(
		HaproxyResourceSnapshot snapshot,
		string? createdBy,
		long validationNodeVersion,
		bool markValidationNodeSynced,
		CancellationToken cancellationToken = default)
	{
		var latest = await EntityCollection.Find(x => x.ClusterId == _clusterId)
			.SortByDescending(x => x.RevisionNumber)
			.FirstOrDefaultAsync(cancellationToken);

		var revision = ClusterRevisionDocument.Create(
			_clusterId,
			(latest?.RevisionNumber ?? 0) + 1,
			createdBy,
			snapshot,
			validationNodeVersion,
			_nodes,
			_validationNodeId,
			markValidationNodeSynced);

		revision.Id = Guid.NewGuid().ToString("n");

		if (latest is not null)
		{
			await EntityCollection.UpdateManyAsync(
				x => x.ClusterId == _clusterId && x.IsCurrent,
				Builders<ClusterRevisionDocument>.Update.Set(x => x.IsCurrent, false),
				cancellationToken: cancellationToken);
		}

		await EntityCollection.InsertOneAsync(revision, cancellationToken: cancellationToken);
		return revision;
	}

	public async Task<ClusterRevisionDocument?> GetCurrentRevisionNeedingSync(DateTimeOffset now, CancellationToken cancellationToken = default)
	{
		return await EntityCollection.Find(x => x.ClusterId == _clusterId
				&& x.IsCurrent
				&& x.Nodes.Any(node => node.Enabled
					&& node.SyncStatus != ClusterSyncStatus.Synced
					&& (node.NextAttemptAt == null || node.NextAttemptAt <= now)))
			.SortByDescending(x => x.RevisionNumber)
			.FirstOrDefaultAsync(cancellationToken);
	}

	public Task MarkNodeSyncing(string revisionId, string nodeId, DateTimeOffset attemptedAt, CancellationToken cancellationToken = default)
	{
		return UpdateNode(revisionId, nodeId, node =>
		{
			node.SyncStatus = ClusterSyncStatus.Syncing;
			node.LastAttemptAt = attemptedAt;
			node.LastError = null;
		}, cancellationToken);
	}

	public Task MarkNodeSynced(string revisionId, string nodeId, long appliedVersion, bool updateValidationVersion, CancellationToken cancellationToken = default)
	{
		return UpdateRevision(revisionId, revision =>
		{
			var node = revision.Nodes.First(x => x.NodeId == nodeId);
			node.SyncStatus = ClusterSyncStatus.Synced;
			node.LastSuccessAt = DateTimeOffset.UtcNow;
			node.LastError = null;
			node.NextAttemptAt = null;
			node.AppliedVersion = appliedVersion;
			node.AttemptCount = 0;

			if (updateValidationVersion)
			{
				revision.ValidationNodeVersion = appliedVersion;
				revision.Snapshot = revision.Snapshot with
				{
					Version = appliedVersion,
				};
			}
		}, cancellationToken);
	}

	public Task MarkNodeFailed(string revisionId, string nodeId, string error, DateTimeOffset attemptedAt, DateTimeOffset nextAttemptAt, CancellationToken cancellationToken = default)
	{
		return UpdateNode(revisionId, nodeId, node =>
		{
			node.SyncStatus = ClusterSyncStatus.Failed;
			node.LastAttemptAt = attemptedAt;
			node.LastError = error;
			node.NextAttemptAt = nextAttemptAt;
			node.AttemptCount += 1;
		}, cancellationToken);
	}

	private Task UpdateNode(string revisionId, string nodeId, Action<ClusterNodeRevisionState> update, CancellationToken cancellationToken)
	{
		return UpdateRevision(revisionId, revision =>
		{
			var node = revision.Nodes.First(x => x.NodeId == nodeId);
			update(node);
		}, cancellationToken);
	}

	private async Task UpdateRevision(string revisionId, Action<ClusterRevisionDocument> update, CancellationToken cancellationToken)
	{
		var revision = await EntityCollection.Find(x => x.Id == revisionId).FirstOrDefaultAsync(cancellationToken)
			?? throw new InvalidOperationException($"Unknown cluster revision '{revisionId}'.");

		update(revision);

		await EntityCollection.ReplaceOneAsync(x => x.Id == revisionId, revision, cancellationToken: cancellationToken);
	}
}
