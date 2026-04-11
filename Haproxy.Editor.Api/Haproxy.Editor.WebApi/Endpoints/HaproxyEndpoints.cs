using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;

namespace Haproxy.Editor.Endpoints;

public static class HaproxyEndpoints
{
	public static WebApplication MapHaproxyEndpoints(this WebApplication app)
	{
		var grp = app.MapGroup("/haproxy").WithTags("Haproxy").RequireAuthorization();


		grp.MapGet("/config", GetConfig).WithName("GetHaproxyConfig");
		grp.MapGet("/dashboard", GetDashboard).WithName("GetHaproxyDashboard");
		grp.MapPut("/config", SetConfig).WithName("SaveHaproxyConfig");
		grp.MapPost("/config/validate", ValidateConfig).WithName("ValidateHaproxyConfig");

		return app;
	}

	private static async Task<IResult> GetConfig(IHaproxyService haproxyService)
	{
		try
		{
			return Results.Ok(await haproxyService.GetConfig());
		}
		catch (InvalidOperationException exception)
		{
			return Results.Problem(title: "Failed to load HAProxy configuration", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
		}
	}

	private static async Task<IResult> GetDashboard(IHaproxyService haproxyService)
	{
		try
		{
			return Results.Ok(await haproxyService.GetDashboardSnapshot());
		}
		catch (InvalidOperationException exception)
		{
			return Results.Problem(title: "Failed to load HAProxy dashboard", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
		}
	}

	private static async Task<IResult> SetConfig(HaproxyResourceSnapshot config, IHaproxyService haproxyService)
	{
		try
		{
			await haproxyService.SaveConfig(config);
			return Results.Ok();
		}
		catch (InvalidOperationException exception)
		{
			return Results.Problem(title: "Failed to save HAProxy configuration", detail: exception.Message, statusCode: StatusCodes.Status502BadGateway);
		}
	}

	private static async Task<IResult> ValidateConfig(HaproxyResourceSnapshot config, IHaproxyService haproxyService)
	{
		var result = await haproxyService.ValidateConfig(config);

		return result.IsValid ? Results.Ok() : Results.BadRequest(result.ErrorMessage);
	}
}
