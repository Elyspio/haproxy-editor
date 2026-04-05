using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Injections;
using Haproxy.Editor.Core.Background;
using Haproxy.Editor.Core.Services;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Core;

public class CoreModule : IModule
{
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		services.Configure<AppConfig>(configuration.GetRequiredSection(AppConfig.Section));
		services.AddHttpContextAccessor();

		services.Scan(selector => selector
			.FromAssemblyOf<CoreModule>()
			.AddClasses(filter => filter.InNamespaceOf<HaproxyService>(), false)
			.AsImplementedInterfaces()
			.WithSingletonLifetime()
		);

		services.AddHostedService<HaproxyClusterSyncRegistrationService>();
	}
}
