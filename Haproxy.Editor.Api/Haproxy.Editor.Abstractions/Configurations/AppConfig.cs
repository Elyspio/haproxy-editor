namespace Haproxy.Editor.Abstractions.Configurations;

public class AppConfig
{
	public const string Section = "App";
	public required string HaproxyConfigPath { get; init; }
	
	public required OidcConfig Oidc { get; init; }
}

public class OidcConfig
{
	public required string Audience { get; set; }
	public required string Issuer { get; set; }
}