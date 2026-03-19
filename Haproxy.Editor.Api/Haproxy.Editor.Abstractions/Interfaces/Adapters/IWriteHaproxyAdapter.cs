using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Adapters;

public interface IWriteHaproxyAdapter
{
	public Task WriteToFile(string filePath, HaproxyConfiguration conf);

	public string WriteToString(HaproxyConfiguration conf);
}