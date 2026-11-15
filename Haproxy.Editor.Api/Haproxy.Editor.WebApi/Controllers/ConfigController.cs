using Elyspio.Utils.Telemetry;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Haproxy.Editor.Controllers;

[ApiController]
[Authorize]
[Route("config")]
public sealed class ConfigController(IHaproxyService config, ILogger<ConfigController> logger) : ControllerBase
{
	[HttpGet(Name = "GetConfig")]
	public async Task<HaproxyResourceSnapshot> Get(CancellationToken cancellationToken)
	{
		using var trace = logger.Trace();
		return await config.GetConfig(cancellationToken);
	}

	[HttpPut(Name = "SaveConfig")]
	public async Task<HaproxyResourceSnapshot> Save(
		[FromBody] HaproxyResourceSnapshot snapshot,
		CancellationToken cancellationToken)
	{
		using var trace = logger.Trace();
		return await config.SaveConfig(snapshot, cancellationToken);
	}

	[HttpPost("validate", Name = "ValidateConfig")]
	public async Task<IActionResult> Validate(
		[FromBody] HaproxyResourceSnapshot snapshot,
		CancellationToken cancellationToken)
	{
		using var trace = logger.Trace();
		var result = await config.ValidateConfig(snapshot, cancellationToken);
		return result.IsValid
			? NoContent()
			: Problem(statusCode: StatusCodes.Status400BadRequest, title: "The configuration is invalid.", detail: result.ErrorMessage);
	}
}
