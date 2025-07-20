namespace Haproxy.Editor.Abstractions.Configurations;

public class AppConfig
{
	public const string Section = "App";
	public required string HaproxyConfigPath { get; set; }
}