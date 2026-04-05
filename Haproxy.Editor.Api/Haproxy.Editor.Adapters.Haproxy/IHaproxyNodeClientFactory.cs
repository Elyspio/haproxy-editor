using Haproxy.Editor.Abstractions.Configurations;

namespace Haproxy.Editor.Adapters.Haproxy;

public interface IHaproxyNodeClientFactory
{
	public HaproxyClient CreateClient(string nodeId);

	public HaproxyClusterNodeConfig GetRequiredNode(string nodeId);

	public IReadOnlyList<HaproxyClusterNodeConfig> GetNodes(bool enabledOnly = false);
}
