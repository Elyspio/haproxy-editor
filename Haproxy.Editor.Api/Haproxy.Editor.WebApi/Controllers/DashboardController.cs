using Elyspio.Utils.Telemetry;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;

namespace Haproxy.Editor.Controllers;

[ApiController]
[Authorize]
[Route("dashboard")]
public sealed class DashboardController(IHaproxyService dashboard, ILogger<DashboardController> logger) : ControllerBase
{
	[HttpGet(Name = "GetDashboard")]
	public async Task<DashboardSnapshot> Get(CancellationToken cancellationToken)
	{
		using var trace = logger.Trace();
		if (Request.GetTypedHeaders().CacheControl?.NoCache == true)
		{
			return await dashboard.RefreshDashboardSnapshot(cancellationToken);
		}

		return await dashboard.GetDashboardSnapshot(cancellationToken);
	}
}
