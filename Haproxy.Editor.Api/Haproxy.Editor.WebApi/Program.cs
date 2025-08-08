using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Extensions;
using Haproxy.Editor.Adapters.Haproxy;
using Haproxy.Editor.Core;
using Haproxy.Editor.Endpoints;
using Microsoft.IdentityModel.Logging;

var builder = WebApplication.CreateBuilder(args);

IdentityModelEventSource.ShowPII = true;

builder.Logging.AddSimpleConsole(x => x.SingleLine = true).SetMinimumLevel(LogLevel.Debug);

builder.Services.AddLogging();


builder.AddModule<CoreModule>();
builder.AddModule<HaproxyAdapterModule>();


// Add services to the container.
// Learn more about configuring OpenAPI at https://aka.ms/aspnet/openapi
builder.Services.AddEndpointsApiExplorer();
builder.Services.AddSwaggerGen(options =>
{
	options.AddSecurityDefinition("Bearer", new Microsoft.OpenApi.Models.OpenApiSecurityScheme
	{
		Name = "Authorization",
		Type = Microsoft.OpenApi.Models.SecuritySchemeType.Http,
		Scheme = "Bearer",
		BearerFormat = "JWT",
		In = Microsoft.OpenApi.Models.ParameterLocation.Header,
		Description = "Enter your token."
	});
	options.AddSecurityRequirement(new Microsoft.OpenApi.Models.OpenApiSecurityRequirement
	{
		{
			new Microsoft.OpenApi.Models.OpenApiSecurityScheme
			{
				Reference = new Microsoft.OpenApi.Models.OpenApiReference
				{
					Type = Microsoft.OpenApi.Models.ReferenceType.SecurityScheme,
					Id = "Bearer"
				}
			},
			new List<string>()
		}
	});
});

var oidcConfig = builder.Configuration.GetRequiredSection("Oidc").Get<OidcConfig>()!; 

builder.Services.AddAuthentication("Bearer")
	.AddJwtBearer("Bearer", options =>
	{
		options.Authority = oidcConfig.Issuer;
		options.Audience = oidcConfig.Audience;
		options.TokenValidationParameters = new()
		{
			ValidateAudience = true,
			ValidAudience = oidcConfig.Audience,
			ValidateIssuer = true,
			ValidIssuer = oidcConfig.Issuer,
			ValidateLifetime = true,
			ClockSkew = TimeSpan.FromMinutes(0.5),
			ValidateIssuerSigningKey = true,
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

app.MapHaproxyEndpoints();


app.Run();