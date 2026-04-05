namespace Haproxy.Editor.Core.Background;

public interface IHaproxyClusterSyncJob
{
	public Task Execute(CancellationToken cancellationToken = default);
}
