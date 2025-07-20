namespace Haproxy.Editor.Abstractions.Data;

public class HaproxyConfiguration
{
	public List<string> Global { get; init; } = [];

	public List<string> Defaults { get; init; } = [];

	public Dictionary<string, List<string>> Frontends { get; init; } = new();

	public Dictionary<string, List<string>> Backends { get; init; } = new();
}