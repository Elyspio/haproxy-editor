using Haproxy.Editor.Abstractions.Injections;
using Haproxy.Editor.Adapters.Haproxy.Adapters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Adapters.Haproxy;

public class HaproxyAdapterModule : IModule
{
	/// <inheritdoc />
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		services.Scan(selector => selector
			.FromAssemblyOf<HaproxyAdapterModule>()
			.AddClasses(filter => filter.InNamespaceOf<ReadHaproxyAdapter>())
			.AsImplementedInterfaces()
			.WithSingletonLifetime()
		);
	}
}