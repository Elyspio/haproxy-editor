using Haproxy.Editor.Adapters.Mongo.Technical;
using Microsoft.Extensions.Logging;
using MongoDB.Bson;
using MongoDB.Driver;

namespace Haproxy.Editor.Adapters.Mongo.Repositories.Base;

public abstract class BaseRepository<TDocument>
{
	private readonly MongoContext _context;

	protected BaseRepository(MongoContext context, ILogger logger)
	{
		_context = context;
		Logger = logger;
	}

	protected ILogger Logger { get; }

	protected abstract string CollectionName { get; }

	protected IMongoCollection<TDocument> EntityCollection => _context.MongoDatabase.GetCollection<TDocument>(CollectionName);

	protected void CreateIndexIfMissing(ICollection<string> properties, bool unique = false)
	{
		var indexName = string.Join("-", properties);
		var indexes = EntityCollection.Indexes.List().ToList();
		var foundIndex = indexes.Any(index => index["key"].AsBsonDocument.Names.Contains(indexName, StringComparer.Ordinal));

		if (foundIndex)
		{
			return;
		}

		var indexBuilder = Builders<TDocument>.IndexKeys;
		var newIndex = indexBuilder.Combine(properties.Select(property => indexBuilder.Ascending(property)));
		var indexModel = new CreateIndexModel<TDocument>(newIndex, new CreateIndexOptions
		{
			Unique = unique,
			Name = indexName,
		});

		Logger.LogInformation("Creating Mongo index {Collection}.{IndexName}.", CollectionName, indexName);
		EntityCollection.Indexes.CreateOne(indexModel);
	}
}
