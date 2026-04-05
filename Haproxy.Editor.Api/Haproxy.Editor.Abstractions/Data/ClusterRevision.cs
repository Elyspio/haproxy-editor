using Haproxy.Editor.Abstractions.Configurations;

namespace Haproxy.Editor.Abstractions.Data;

public class ClusterRevisionDocument
{
	public string Id { get; set; } = string.Empty;

	public string ClusterId { get; set; } = string.Empty;

	public long RevisionNumber { get; set; }

	public bool IsCurrent { get; set; }

	public string? CreatedBy { get; set; }

	public DateTimeOffset CreatedAt { get; set; } = DateTimeOffset.UtcNow;

	public HaproxyResourceSnapshot Snapshot { get; set; } = new();

	public long ValidationNodeVersion { get; set; }

	public List<ClusterNodeRevisionState> Nodes { get; set; } = [];

	public HaproxyResourceSnapshot ToSnapshot()
	{
		return Snapshot with
		{
			Version = ValidationNodeVersion,
		};
	}

	public static ClusterRevisionDocument Create(
		string clusterId,
		long revisionNumber,
		string? createdBy,
		HaproxyResourceSnapshot snapshot,
		long validationNodeVersion,
		IReadOnlyList<HaproxyClusterNodeConfig> nodes,
		string validationNodeId,
		bool markValidationNodeSynced)
	{
		return new ClusterRevisionDocument
		{
			ClusterId = clusterId,
			RevisionNumber = revisionNumber,
			IsCurrent = true,
			CreatedBy = createdBy,
			CreatedAt = DateTimeOffset.UtcNow,
			Snapshot = snapshot with
			{
				Version = validationNodeVersion,
			},
			ValidationNodeVersion = validationNodeVersion,
			Nodes = nodes.Select(node => new ClusterNodeRevisionState
			{
				NodeId = node.NodeId,
				DisplayName = node.DisplayName ?? node.NodeId,
				Enabled = node.Enabled,
				SyncStatus = markValidationNodeSynced && string.Equals(node.NodeId, validationNodeId, StringComparison.OrdinalIgnoreCase)
					? ClusterSyncStatus.Synced
					: ClusterSyncStatus.Pending,
				LastSuccessAt = markValidationNodeSynced && string.Equals(node.NodeId, validationNodeId, StringComparison.OrdinalIgnoreCase)
					? DateTimeOffset.UtcNow
					: null,
				AppliedVersion = markValidationNodeSynced && string.Equals(node.NodeId, validationNodeId, StringComparison.OrdinalIgnoreCase)
					? validationNodeVersion
					: null,
			}).ToList(),
		};
	}
}

public class ClusterNodeRevisionState
{
	public string NodeId { get; set; } = string.Empty;

	public string DisplayName { get; set; } = string.Empty;

	public bool Enabled { get; set; } = true;

	public ClusterSyncStatus SyncStatus { get; set; } = ClusterSyncStatus.Pending;

	public DateTimeOffset? LastAttemptAt { get; set; }

	public DateTimeOffset? LastSuccessAt { get; set; }

	public DateTimeOffset? NextAttemptAt { get; set; }

	public string? LastError { get; set; }

	public int AttemptCount { get; set; }

	public long? AppliedVersion { get; set; }
}
