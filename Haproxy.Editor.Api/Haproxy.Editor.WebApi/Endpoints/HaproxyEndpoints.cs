using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;

namespace Haproxy.Editor.Endpoints;

public static class HaproxyEndpoints
{
	public static WebApplication MapHaproxyEndpoints(this WebApplication app)
	{
		var grp = app.MapGroup("/haproxy").WithTags("Haproxy").RequireAuthorization();


		grp.MapGet("/config", GetConfig).WithName("GetHaproxyConfig");
		grp.MapPost("/config", SetConfig).WithName("SaveHaproxyConfig");

		return app;
	}

	private static Task<HaproxyConfiguration> GetConfig(IHaproxyService haproxyService)
	{
		return haproxyService.GetConfig();
	}

	private static Task SetConfig(HaproxyConfiguration config, IHaproxyService haproxyService)
	{
		return haproxyService.SaveConfig(config);
	}
}