using Hangfire;
using Microsoft.Extensions.Hosting;

namespace Haproxy.Editor.Core.Background;

public class HaproxyClusterSyncRegistrationService : IHostedService
{
	private readonly IRecurringJobManager _recurringJobManager;

	public HaproxyClusterSyncRegistrationService(IRecurringJobManager recurringJobManager)
	{
		_recurringJobManager = recurringJobManager;
	}

	public Task StartAsync(CancellationToken cancellationToken)
	{
		_recurringJobManager.AddOrUpdate<IHaproxyClusterSyncJob>(
			"haproxy-cluster-sync",
			job => job.Execute(CancellationToken.None),
			Cron.Minutely());

		return Task.CompletedTask;
	}

	public Task StopAsync(CancellationToken cancellationToken)
	{
		return Task.CompletedTask;
	}
}
