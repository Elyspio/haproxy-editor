using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

builder.Services.AddLogging(x => x.AddSimpleConsole(xx => xx.SingleLine = true) );

var haproxyConfigPath = Path.Combine(builder.AppHostDirectory, "haproxy");

var haproxy = builder.AddContainer("haproxy", "haproxytech/haproxy-alpine", "s6-latest")
	.WithHttpEndpoint(port: 5555, targetPort: 5555)
	.WithBindMount(haproxyConfigPath, "/usr/local/etc/haproxy", isReadOnly: false);

var api = builder.AddProject<Haproxy_Editor_WebApi>("api")
	.WaitForStart(haproxy);


builder.AddViteApp("front", "../Haproxy.Editor.Front")
	.WithPnpm()
	.WithEndpoint("http", annotation =>
	{
		annotation.Port = 3000;
		annotation.TargetPort = 3000;
		annotation.UriScheme = "https";
		annotation.IsProxied = false;
	})
	.WaitForStart(api);


builder.Build().Run();
