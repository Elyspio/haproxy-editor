using System.Diagnostics;
using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Adapters;
using Microsoft.AspNetCore.Hosting;
using Microsoft.Extensions.Hosting;
using Microsoft.Extensions.Logging;

namespace Haproxy.Editor.Adapters.Haproxy.Adapters;

public class ValidatorHaproxyAdapter : TracingAdapter, IValidatorHaproxyAdapter
{
	private readonly IWebHostEnvironment _env;

	/// <inheritdoc />
	public ValidatorHaproxyAdapter(ILogger<ValidatorHaproxyAdapter> logger, IWebHostEnvironment env) : base(logger)
	{
		_env = env;
	}

	/// <inheritdoc />
	public async Task<ValidationResult> Validate(string filepath)
	{
		using var _ = LogAdapter();


		if (_env.IsDevelopment())
			return Random.Shared.Next(0, 10) < 5
				? new ValidationResult(true)
				: new ValidationResult(false, "Validation failed in development mode.");


		var process = new Process
		{
			StartInfo = new ProcessStartInfo
			{
				FileName = "haproxy",
				Arguments = $"-c -f \"{filepath}\"",
				RedirectStandardOutput = true,
				RedirectStandardError = true,
				CreateNoWindow = true,
				UseShellExecute = false
			}
		};

		process.Start();

		await process.WaitForExitAsync();

		var error = await process.StandardError.ReadToEndAsync();

		var exitCode = process.ExitCode;

		return new ValidationResult(exitCode == 0, error);
	}
}