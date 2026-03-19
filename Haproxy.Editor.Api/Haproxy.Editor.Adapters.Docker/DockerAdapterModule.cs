using Haproxy.Editor.Abstractions.Injections;
using Haproxy.Editor.Adapters.Docker.Adapters;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Adapters.Docker;

public class DockerAdapterModule : IModule
{
	/// <inheritdoc />
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		services.Scan(selector => selector
			.FromAssemblyOf<DockerAdapterModule>()
			.AddClasses(filter => filter.InNamespaceOf<DockerAdapter>())
			.AsImplementedInterfaces()
			.WithSingletonLifetime()
		);
	}
}