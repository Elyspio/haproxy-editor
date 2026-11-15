using Elyspio.Utils.Telemetry.MongoDB.Business;
using Haproxy.Editor.Abstractions.Injections;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using MongoDB.Driver;
using Microsoft.Extensions.Configuration;
using Microsoft.Extensions.DependencyInjection;

namespace Haproxy.Editor.Adapters.MongoDB;

public sealed class MongoAdapterModule : IModule
{
	public void Load(IServiceCollection services, IConfiguration configuration)
	{
		var connectionString = configuration.GetConnectionString("MongoDB") ?? throw new InvalidOperationException("ConnectionStrings:MongoDB is required.");
		var url = MongoUrl.Create(connectionString);
		var databaseName = url.DatabaseName ?? "haproxy-editor";
		services.AddSingleton<IMongoClient>(_ =>
		{
			var settings = MongoClientSettings.FromConnectionString(connectionString);
			settings.ClusterConfigurator = cluster => cluster.Subscribe(new MongoDbActivityEventSubscriber());
			return new MongoClient(settings);
		});
		services.AddSingleton(sp => sp.GetRequiredService<IMongoClient>().GetDatabase(databaseName));
		services.AddSingleton<IExposureRepository, MongoExposureRepository>();
		services.AddSingleton<IExposureMutationLock, MongoExposureMutationLock>();
	}
}