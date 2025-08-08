namespace Haproxy.Editor.Abstractions.Data;

public class HaproxyConfiguration
{
	public required List<string> Global { get; init; }

	public required List<string> Defaults { get; init; } = [];

	public required Dictionary<string, List<string>> Frontends { get; init; } 

	public required Dictionary<string, List<string>> Backends { get; init; } 
}