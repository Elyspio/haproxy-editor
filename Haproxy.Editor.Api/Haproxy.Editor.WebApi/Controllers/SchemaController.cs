using Elyspio.Utils.Telemetry;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Haproxy.Editor.Controllers;

[ApiController]
[Authorize]
[Route("schema")]
public sealed class SchemaController(ISchemaService schema, ILogger<SchemaController> logger) : ControllerBase
{
	/// <summary>
	///     Lists the Data Plane API fields available as advanced options, per configuration section.
	/// </summary>
	[HttpGet(Name = "GetSchema")]
	public HaproxySchema Get()
	{
		using var trace = logger.Trace();
		return schema.GetSchema();
	}
}
