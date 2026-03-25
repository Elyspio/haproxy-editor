using Elyspio.Utils.Telemetry.Technical.Helpers;
using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Adapters;
using Microsoft.Extensions.Logging;

namespace Haproxy.Editor.Adapters.Haproxy.Adapters;

public class ReadHaproxyAdapter : TracingAdapter, IReadHaproxyAdapter
{
	/// <inheritdoc />
	public ReadHaproxyAdapter(ILogger<ReadHaproxyAdapter> logger) : base(logger)
	{
	}

	/// <exception cref="ArgumentOutOfRangeException"></exception>
	/// <inheritdoc />
	public async Task<HaproxyConfiguration> Read(string filePath)
	{
		using var _ = LogAdapter($"{Log.F(filePath)}");


		var content = await File.ReadAllTextAsync(filePath);

		return Parse(content);
	}

	/// <inheritdoc />
	public HaproxyConfiguration Parse(string content)
	{
		var config = new HaproxyConfiguration(content);

		var lines = content.Split(Environment.NewLine);

		// Le bloc courant (global, defaults, frontend, backend)
		HaproxyConfigBlock? current = null;

		// Le nom du bloc courant (utilisé pour les frontends et backends)
		string? currentName = null;

		foreach (var line in lines)
		{
			var data = line.Trim();

			switch (data)
			{
				case "global":
					current = HaproxyConfigBlock.Global;
					continue;
				case "defaults":
					current = HaproxyConfigBlock.Defaults;
					continue;
			}

			if (data.StartsWith("frontend "))
			{
				current = HaproxyConfigBlock.Frontend;
				currentName = data["frontend ".Length..];
				config.Frontends[currentName] = [];

				continue;
			}

			if (data.StartsWith("backend "))
			{
				current = HaproxyConfigBlock.Backend;
				currentName = data["backend ".Length..];
				config.Backends[currentName] = [];
				continue;
			}


			var arr = current switch
			{
				HaproxyConfigBlock.Global => config.Global,
				HaproxyConfigBlock.Defaults => config.Defaults,
				HaproxyConfigBlock.Frontend => config.Frontends[currentName!],
				HaproxyConfigBlock.Backend => config.Backends[currentName!],
				_ => throw new ArgumentOutOfRangeException()
			};

			arr.Add(data);
		}


		RemoveLastEmptyLines(config.Global);
		RemoveLastEmptyLines(config.Defaults);

		foreach (var frontend in config.Frontends) RemoveLastEmptyLines(frontend.Value);

		foreach (var backend in config.Backends) RemoveLastEmptyLines(backend.Value);

		return config;
	}


	private void RemoveLastEmptyLines(List<string> lines)
	{
		var lastLineWithContent = lines.FindLastIndex(line => !string.IsNullOrWhiteSpace(line));

		if (lastLineWithContent != -1) lines.RemoveRange(lastLineWithContent + 1, lines.Count - lastLineWithContent - 1);
	}
}

internal enum HaproxyConfigBlock
{
	Global,
	Defaults,
	Frontend,
	Backend
}