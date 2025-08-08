using System.ComponentModel.DataAnnotations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using ValidationResult = Haproxy.Editor.Abstractions.Data.ValidationResult;

namespace Haproxy.Editor.Endpoints;

public static class HaproxyEndpoints
{
	public static WebApplication MapHaproxyEndpoints(this WebApplication app)
	{
		var grp = app.MapGroup("/haproxy").WithTags("Haproxy").RequireAuthorization();


		grp.MapGet("/config", GetConfig).WithName("GetHaproxyConfig");
		grp.MapPut("/config", SetConfig).WithName("SaveHaproxyConfig");
		grp.MapPost("/config/validate", ValidateConfig).WithName("ValidateHaproxyConfig");

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

	private static async Task<IResult> ValidateConfig(HaproxyConfiguration config, IHaproxyService haproxyService)
	{
		var result = await haproxyService.ValidateConfig(config);

		return result.IsValid ? Results.Ok() : Results.BadRequest(result.ErrorMessage);
	}
}