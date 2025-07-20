using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Adapters;

public interface IReadHaproxyAdapter
{
	public Task<HaproxyConfiguration> Read(string filePath);
}