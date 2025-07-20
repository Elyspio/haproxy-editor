using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Abstractions.Injections;

public interface IModule
{
	public void Load(IServiceCollection services, IConfiguration configuration);
}