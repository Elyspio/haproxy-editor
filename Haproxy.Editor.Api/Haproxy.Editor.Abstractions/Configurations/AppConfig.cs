namespace Haproxy.Editor.Abstractions.Configurations;

/// <summary>
///     Represents the application configuration section.
/// </summary>
public class AppConfig
{
	/// <summary>
	///     The configuration section name.
	/// </summary>
	public const string Section = "App";

	/// <summary>
	///     MongoDB persistence settings.
	/// </summary>
	public required MongoDbConfig MongoDb { get; init; }

	/// <summary>
	///     Cluster topology and synchronization settings.
	/// </summary>
	public required HaproxyClusterConfig Cluster { get; init; }
}

/// <summary>
///     Represents MongoDB connectivity settings.
/// </summary>
public class MongoDbConfig
{
	/// <summary>
	///     MongoDB connection string.
	/// </summary>
	public required string ConnectionString { get; init; }

	/// <summary>
	///     Database name used by the application.
	/// </summary>
	public required string DatabaseName { get; init; }
}

/// <summary>
///     Represents HAProxy cluster settings.
/// </summary>
public class HaproxyClusterConfig
{
	/// <summary>
	///     Logical cluster identifier.
	/// </summary>
	public required string ClusterId { get; init; }

	/// <summary>
	///     Node used for validation and bootstrap.
	/// </summary>
	public required string ValidationNodeId { get; init; }

	/// <summary>
	///     Polling interval, in seconds, for background synchronization.
	/// </summary>
	public int SyncLoopIntervalSeconds { get; init; } = 5;

	/// <summary>
	///     Base retry delay, in seconds.
	/// </summary>
	public int RetryDelaySeconds { get; init; } = 5;

	/// <summary>
	///     Known HAProxy Data Plane nodes for the cluster.
	/// </summary>
	public List<HaproxyClusterNodeConfig> Nodes { get; init; } = [];
}

/// <summary>
///     Represents a single HAProxy Data Plane node in the cluster.
/// </summary>
public class HaproxyClusterNodeConfig
{
	/// <summary>
	///     Stable logical node identifier.
	/// </summary>
	public required string NodeId { get; init; }

	/// <summary>
	///     Display name shown in operational views.
	/// </summary>
	public string? DisplayName { get; init; }

	/// <summary>
	///     Data Plane API base URL.
	/// </summary>
	public required string BaseUrl { get; init; }

	/// <summary>
	///     Username used for basic authentication.
	/// </summary>
	public string? Username { get; init; }

	/// <summary>
	///     Password used for basic authentication.
	/// </summary>
	public string? Password { get; init; }

	/// <summary>
	///     Bearer token used for authentication.
	/// </summary>
	public string? Token { get; init; }

	/// <summary>
	///     Ignore TLS certificate validation errors.
	/// </summary>
	public bool IgnoreTlsErrors { get; init; }

	/// <summary>
	///     Request timeout, in seconds.
	/// </summary>
	public int TimeoutSeconds { get; init; } = 30;

	/// <summary>
	///     Whether this node should participate in synchronization.
	/// </summary>
	public bool Enabled { get; init; } = true;
}

/// <summary>
///     Represents the OpenID Connect configuration.
/// </summary>
public class OidcConfig
{
	/// <summary>
	///     The expected audience for the OIDC token.
	/// </summary>
	public required string Audience { get; init; }

	/// <summary>
	///     The issuer of the OIDC token.
	/// </summary>
	public required string Issuer { get; init; }
}
