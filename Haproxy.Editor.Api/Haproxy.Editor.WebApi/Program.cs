using Coexya.Utils.Telemetry.Tracing.Builder;
using Elyspio.Utils.Telemetry.Technical.Options;
using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Extensions;
using Haproxy.Editor.Adapters.Haproxy;
using Haproxy.Editor.Core;
using Haproxy.Editor.Endpoints;
using Microsoft.IdentityModel.Logging;
using Microsoft.IdentityModel.Tokens;
using Microsoft.OpenApi;
using Newtonsoft.Json;

var builder = WebApplication.CreateBuilder(args);

static object? CreateConfigurationSnapshot(IConfigurationSection section)
{
	var children = section.GetChildren().ToArray();

	if (children.Length == 0)
	{
		return section.Value;
	}

	if (children.All(child => int.TryParse(child.Key, out _)))
	{
		return children
			.OrderBy(child => int.Parse(child.Key, System.Globalization.CultureInfo.InvariantCulture))
			.Select(CreateConfigurationSnapshot)
			.ToArray();
	}

	return children.ToDictionary(
		child => child.Key,
		child => CreateConfigurationSnapshot(child));
}

IdentityModelEventSource.ShowPII = true;

builder.Logging.AddSimpleConsole(x => x.SingleLine = true).SetMinimumLevel(LogLevel.Debug);

builder.Configuration.AddJsonFile("appsettings.dockerhost.json", optional: true, reloadOnChange: true);

builder.Services.AddLogging(x =>
{
	x.AddOpenTelemetry();
});

builder.AddModule<CoreModule>();
builder.AddModule<HaproxyAdapterModule>();

// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.NonNullableReferenceTypesAsRequired();
	options.SupportNonNullableReferenceTypes();

	options.AddSecurityDefinition("Bearer", new OpenApiSecurityScheme
	{
		Name = "Authorization",
		Type = SecuritySchemeType.Http,
		Scheme = "Bearer",
		BearerFormat = "JWT",
		In = ParameterLocation.Header,
		Description = "Enter your token."
	});

	options.AddSecurityRequirement(document => new OpenApiSecurityRequirement
	{
		{
			new OpenApiSecuritySchemeReference("Bearer", hostDocument: document, externalResource: null),
			[]
		}
	});
});

var oidcConfig = builder.Configuration.GetRequiredSection("Oidc").Get<OidcConfig>()!;

builder.Services.AddAuthentication("Bearer")
	.AddJwtBearer("Bearer", options =>
	{
		options.Authority = oidcConfig.Issuer;
		options.Audience = oidcConfig.Audience;
		options.TokenValidationParameters = new TokenValidationParameters
		{
			ValidateAudience = true,
			ValidAudience = oidcConfig.Audience,
			ValidateIssuer = true,
			ValidIssuer = oidcConfig.Issuer,
			ValidateLifetime = true,
			ClockSkew = TimeSpan.FromMinutes(0.5),
			ValidateIssuerSigningKey = true
		};
	});

builder.Services.AddAuthorization();
builder.Services.AddCors(options =>
{
	options.AddDefaultPolicy(policy =>
	{
		policy.WithOrigins("https://localhost:4000")
			.AllowAnyHeader()
			.AllowAnyMethod();
	});
});

var otelSection = builder.Configuration.GetSection("OpenTelemetry");
var otelOptions = otelSection.Get<AppOpenTelemetryBuilderOptions>();

if (otelOptions == null)
{
	throw new InvalidOperationException("OpenTelemetry options not found");
}

var otelOptionsSnapshot = CreateConfigurationSnapshot(otelSection);

System.Console.WriteLine($"OpenTelemetry options: {System.Environment.NewLine}{JsonConvert.SerializeObject(otelOptionsSnapshot, Formatting.Indented)}");

var otelBuilder = new AppOpenTelemetryBuilder<Program>(otelOptions!, builder.Configuration);

otelBuilder.AddAssembly<CoreModule>();

otelBuilder.AddAssembly<HaproxyAdapterModule>();

otelBuilder.Build(builder.Services);


var app = builder.Build();

// Configure the HTTP request pipeline.
if (app.Environment.IsDevelopment())
{
	app.UseSwagger();
	app.UseSwaggerUI();
	app.UseCors();
}

app.UseAuthentication();
app.UseAuthorization();


app.UseHttpsRedirection();

app.MapGet("/health", () => Results.Ok("healthy"));

app.MapHaproxyEndpoints();


app.Run();

public partial class Program;
