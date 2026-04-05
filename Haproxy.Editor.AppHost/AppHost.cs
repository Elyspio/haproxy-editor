using Microsoft.Extensions.DependencyInjection;
using Microsoft.Extensions.Logging;
using Projects;

var builder = DistributedApplication.CreateBuilder(args);

builder.Services.AddLogging(x => x.AddSimpleConsole(xx => xx.SingleLine = true) );

var haproxyConfigPath = Path.Combine(builder.AppHostDirectory, "haproxy");

var mongo = builder.AddContainer("mongodb", "mongo", "8.0")
	.WithEndpoint("tcp", endpoint =>
	{
		endpoint.Port = 27017;
		endpoint.TargetPort = 27017;
		endpoint.UriScheme = "tcp";
		endpoint.IsProxied = false;
	});

var haproxy1 = builder.AddContainer("haproxy-1", "haproxytech/haproxy-alpine", "s6-latest")
	.WithHttpEndpoint(port: 5555, targetPort: 5555, isProxied: false)
	.WithBindMount(haproxyConfigPath, "/usr/local/etc/haproxy", isReadOnly: false);

var haproxy2 = builder.AddContainer("haproxy-2", "haproxytech/haproxy-alpine", "s6-latest")
	.WithHttpEndpoint(port: 5556, targetPort: 5555, isProxied: false)
	.WithBindMount(haproxyConfigPath, "/usr/local/etc/haproxy", isReadOnly: false);

var api = builder.AddProject<Haproxy_Editor_WebApi>("api")
	.WithEnvironment("App__MongoDb__ConnectionString", "mongodb://localhost:27017/haproxy-editor")
	.WithEnvironment("App__MongoDb__DatabaseName", "haproxy-editor")
	.WithEnvironment("App__Cluster__ValidationNodeId", "haproxy-1")
	.WithEnvironment("App__Cluster__Nodes__0__NodeId", "haproxy-1")
	.WithEnvironment("App__Cluster__Nodes__0__DisplayName", "HAProxy #1")
	.WithEnvironment("App__Cluster__Nodes__0__BaseUrl", "http://localhost:5555/v3/")
	.WithEnvironment("App__Cluster__Nodes__0__Username", "admin")
	.WithEnvironment("App__Cluster__Nodes__0__Password", "651zdaz651d65za465d8912302139")
	.WithEnvironment("App__Cluster__Nodes__0__IgnoreTlsErrors", "true")
	.WithEnvironment("App__Cluster__Nodes__0__Enabled", "true")
	.WithEnvironment("App__Cluster__Nodes__1__NodeId", "haproxy-2")
	.WithEnvironment("App__Cluster__Nodes__1__DisplayName", "HAProxy #2")
	.WithEnvironment("App__Cluster__Nodes__1__BaseUrl", "http://localhost:5556/v3/")
	.WithEnvironment("App__Cluster__Nodes__1__Username", "admin")
	.WithEnvironment("App__Cluster__Nodes__1__Password", "651zdaz651d65za465d8912302139")
	.WithEnvironment("App__Cluster__Nodes__1__IgnoreTlsErrors", "true")
	.WithEnvironment("App__Cluster__Nodes__1__Enabled", "true")
	.WaitForStart(mongo)
	.WaitForStart(haproxy1)
	.WaitForStart(haproxy2);


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
