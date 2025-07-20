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

	public HaproxyService(IWriteHaproxyAdapter writeHaproxyAdapter, IReadHaproxyAdapter readHaproxyAdapter, ILogger<HaproxyService> logger, IOptionsMonitor<AppConfig> appConfig) : base(logger)
	{
		_writeHaproxyAdapter = writeHaproxyAdapter;
		_readHaproxyAdapter = readHaproxyAdapter;
		_appConfig = appConfig;
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
}