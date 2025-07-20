using Haproxy.Editor.Abstractions.Extensions;
using Haproxy.Editor.Adapters.Haproxy;
using Haproxy.Editor.Core;
using Haproxy.Editor.Endpoints;

var builder = WebApplication.CreateBuilder(args);

builder.Logging.AddSimpleConsole(x => x.SingleLine = true).SetMinimumLevel(LogLevel.Debug);

builder.Services.AddLogging();


builder.AddModule<CoreModule>();
builder.AddModule<HaproxyAdapterModule>();


// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddOpenApi();
builder.Services.AddEndpointsApiExplorer();


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseSwaggerUI(c =>
	{
		c.SwaggerEndpoint("https://localhost:7252/openapi/v1.json", "Haproxy Editor API v1");
		c.RoutePrefix = "swagger";
	});

	app.MapOpenApi();
}

app.UseHttpsRedirection();

app.MapHaproxyEndpoints();


app.Run();