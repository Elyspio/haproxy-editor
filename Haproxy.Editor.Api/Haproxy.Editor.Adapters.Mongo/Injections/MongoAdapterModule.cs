using Haproxy.Editor.Abstractions.Injections;
using Haproxy.Editor.Adapters.Mongo.Repositories;
using Haproxy.Editor.Adapters.Mongo.Technical;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Adapters.Mongo.Injections;

public class MongoAdapterModule : IModule
{
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		services.AddSingleton<MongoContext>();

		services.Scan(scan => scan
			.FromAssemblyOf<MongoAdapterModule>()
			.AddClasses(classes => classes.InNamespaceOf<HaproxyClusterRepository>(), false)
			.AsImplementedInterfaces()
			.WithSingletonLifetime());
	}
}
