using Haproxy.Editor.Abstractions.Configurations;
using Microsoft.Extensions.Configuration;
using MongoDB.Driver;

namespace Haproxy.Editor.Adapters.Mongo.Technical;

public sealed class MongoContext
{
	public MongoContext(IConfiguration configuration)
	{
		var appConfig = configuration.GetRequiredSection(AppConfig.Section).Get<AppConfig>()
			?? throw new InvalidOperationException("App configuration section is missing.");

		ArgumentException.ThrowIfNullOrWhiteSpace(appConfig.MongoDb.ConnectionString);
		ArgumentException.ThrowIfNullOrWhiteSpace(appConfig.MongoDb.DatabaseName);

		var mongoUrl = new MongoUrl(appConfig.MongoDb.ConnectionString);
		var clientSettings = MongoClientSettings.FromUrl(mongoUrl);

		MongoClient = new MongoClient(clientSettings);
		MongoDatabase = MongoClient.GetDatabase(appConfig.MongoDb.DatabaseName);
	}

	public MongoClient MongoClient { get; }

	public IMongoDatabase MongoDatabase { get; }
}
