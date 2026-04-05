using Haproxy.Editor.Abstractions.Injections;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Adapters.Haproxy;

public class HaproxyAdapterModule : IModule
{
	/// <inheritdoc />
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		services.AddSingleton<IHaproxyNodeClientFactory, HaproxyNodeClientFactory>();
	}
}
