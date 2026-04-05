using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Repositories;

public interface IHaproxyClusterRepository
{
	public Task<ClusterRevisionDocument?> GetCurrentRevision(CancellationToken cancellationToken = default);

	public Task<ClusterRevisionDocument> CreateNewCurrentRevision(
		HaproxyResourceSnapshot snapshot,
		string? createdBy,
		long validationNodeVersion,
		bool markValidationNodeSynced,
		CancellationToken cancellationToken = default);

	public Task<ClusterRevisionDocument?> GetCurrentRevisionNeedingSync(DateTimeOffset now, CancellationToken cancellationToken = default);

	public Task MarkNodeSyncing(string revisionId, string nodeId, DateTimeOffset attemptedAt, CancellationToken cancellationToken = default);

	public Task MarkNodeSynced(string revisionId, string nodeId, long appliedVersion, bool updateValidationVersion, CancellationToken cancellationToken = default);

	public Task MarkNodeFailed(string revisionId, string nodeId, string error, DateTimeOffset attemptedAt, DateTimeOffset nextAttemptAt, CancellationToken cancellationToken = default);
}
