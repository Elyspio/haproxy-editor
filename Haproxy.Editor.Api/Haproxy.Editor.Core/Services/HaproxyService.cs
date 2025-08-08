using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Adapters;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Microsoft.Extensions.Options;

namespace Haproxy.Editor.Core.Services;

public class HaproxyService : TracingService, IHaproxyService
{
	private readonly IOptionsMonitor<AppConfig> _appConfig;
	private readonly IReadHaproxyAdapter _readHaproxyAdapter;
	private readonly IWriteHaproxyAdapter _writeHaproxyAdapter;
	private readonly IValidatorHaproxyAdapter _validatorHaproxyAdapter;

	public HaproxyService(IWriteHaproxyAdapter writeHaproxyAdapter, IReadHaproxyAdapter readHaproxyAdapter, ILogger<HaproxyService> logger, IOptionsMonitor<AppConfig> appConfig, IValidatorHaproxyAdapter validatorHaproxyAdapter) : base(logger)
	{
		_writeHaproxyAdapter = writeHaproxyAdapter;
		_readHaproxyAdapter = readHaproxyAdapter;
		_appConfig = appConfig;
		_validatorHaproxyAdapter = validatorHaproxyAdapter;
	}

	/// <inheritdoc />
	public Task<HaproxyConfiguration> GetConfig()
	{
		using var _ = LogService();

		return _readHaproxyAdapter.Read(_appConfig.CurrentValue.HaproxyConfigPath);
	}

	/// <inheritdoc />
	public Task SaveConfig(HaproxyConfiguration config)
	{
		using var _ = LogService();

		return _writeHaproxyAdapter.Write(_appConfig.CurrentValue.HaproxyConfigPath, config);
	}

	/// <inheritdoc />
	public async Task<ValidationResult> ValidateConfig(HaproxyConfiguration config)
	{
		using var _ = LogService();

		var tempFilePath = Path.Combine(Path.GetTempPath(), "haproxy-editor", Guid.NewGuid().ToString(), "haproxy.cfg");

		var directoryName = Path.GetDirectoryName(tempFilePath)!;

		try
		{
			Directory.CreateDirectory(directoryName);

			await _writeHaproxyAdapter.Write(tempFilePath, config);

			var result =  await _validatorHaproxyAdapter.Validate(tempFilePath);

			return result;
		}
		finally
		{
			Directory.Delete(directoryName, true);
		}

	}
}