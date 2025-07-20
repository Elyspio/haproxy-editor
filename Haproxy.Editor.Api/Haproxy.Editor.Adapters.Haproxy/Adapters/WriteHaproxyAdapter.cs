using System.Text;
using Elyspio.Utils.Telemetry.Technical.Helpers;
using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Adapters;
using Microsoft.Extensions.Logging;

namespace Haproxy.Editor.Adapters.Haproxy.Adapters;

public class WriteHaproxyAdapter : TracingAdapter, IWriteHaproxyAdapter
{
	/// <inheritdoc />
	public WriteHaproxyAdapter(ILogger<WriteHaproxyAdapter> logger) : base(logger)
	{
	}

	/// <inheritdoc />
	public async Task Write(string filePath, HaproxyConfiguration conf)
	{
		using var _ = LogAdapter($"{Log.F(filePath)}");

		var sb = new StringBuilder();

		sb.AppendLine("global");
		foreach (var globalDirective in conf.Global) sb.AppendLine($"    {globalDirective}");

		sb.AppendLine("");


		sb.AppendLine("defaults");
		foreach (var defaultDirective in conf.Defaults) sb.AppendLine($"    {defaultDirective}");


		sb.AppendLine("");
		foreach (var frontend in conf.Frontends)
		{
			sb.AppendLine($"frontend {frontend.Key}");
			foreach (var directive in frontend.Value) sb.AppendLine($"    {directive}");

			sb.AppendLine("");
		}


		foreach (var backend in conf.Backends)
		{
			sb.AppendLine($"backend {backend.Key}");
			foreach (var directive in backend.Value) sb.AppendLine($"    {directive}");

			sb.AppendLine("");
		}

		await File.WriteAllTextAsync(filePath, sb.ToString());
	}
}