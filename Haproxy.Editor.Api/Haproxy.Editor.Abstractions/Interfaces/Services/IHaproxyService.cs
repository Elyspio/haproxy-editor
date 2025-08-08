using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Services;

public interface IHaproxyService
{
	public Task<HaproxyConfiguration> GetConfig();

	public Task SaveConfig(HaproxyConfiguration config);
	Task<ValidationResult> ValidateConfig(HaproxyConfiguration config);
}