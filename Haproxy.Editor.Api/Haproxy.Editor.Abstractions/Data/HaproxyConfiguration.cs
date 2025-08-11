namespace Haproxy.Editor.Abstractions.Data;

public record HaproxyConfiguration(
	string Raw,
	List<string> Global,
	List<string> Defaults,
	Dictionary<string, List<string>> Frontends,
	Dictionary<string, List<string>> Backends
)
{
	public HaproxyConfiguration(string raw) : this(raw, [], [], [], [])
	{
	}
}