using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Adapters;

public interface IWriteHaproxyAdapter
{
	public Task Write(string filePath, HaproxyConfiguration conf);
}