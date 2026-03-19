using Elyspio.Utils.Telemetry.Tracing.Elements;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Services;
using Microsoft.Extensions.Logging;
using Generated = Haproxy.Editor.Adapters.Haproxy;

namespace Haproxy.Editor.Core.Services;

public class HaproxyService : TracingService, IHaproxyService
{
	private readonly Generated.HaproxyClient _client;

	public HaproxyService(Generated.HaproxyClient client, ILogger<HaproxyService> logger) : base(logger)
	{
		_client = client;
	}

	public Task<HaproxyResourceSnapshot> GetConfig()
	{
		using var _ = LogService();
		return LoadSnapshot();
	}

	public async Task SaveConfig(HaproxyResourceSnapshot config)
	{
		using var _ = LogService();

		var transaction = await _client.StartTransactionAsync(ToClientVersion(config.Version));
		var transactionId = GetTransactionId(transaction);

		try
		{
			var baseline = await LoadSnapshot(transactionId);
			await ApplySnapshot(config, baseline, transactionId);
			await _client.CommitTransactionAsync(transactionId);
		}
		catch
		{
			await TryDeleteTransaction(transactionId);
			throw;
		}
	}

	public async Task<IValidationResult> ValidateConfig(HaproxyResourceSnapshot config)
	{
		using var _ = LogService();

		var transaction = await _client.StartTransactionAsync(ToClientVersion(config.Version));
		var transactionId = GetTransactionId(transaction);

		try
		{
			var baseline = await LoadSnapshot(transactionId);
			await ApplySnapshot(config, baseline, transactionId);
			return new ValidationResult(true);
		}
		catch (Exception err)
		{
			return new ValidationResult(false, err.Message);
		}
		finally
		{
			await TryDeleteTransaction(transactionId);
		}
	}

	private async Task<HaproxyResourceSnapshot> LoadSnapshot(string? transactionId = null)
	{
		using var _ = LogService();

		var versionTask = _client.GetConfigurationVersionAsync(transactionId);
		var globalTask = _client.GetGlobalAsync(transactionId, true);
		var defaultsTask = _client.GetDefaultsSectionsAsync(transactionId, true);
		var frontendsTask = _client.GetFrontendsAsync(transactionId, true);
		var backendsTask = _client.GetBackendsAsync(transactionId, true);

		await Task.WhenAll(versionTask, globalTask, defaultsTask, frontendsTask, backendsTask);

		var frontends = await BuildFrontends((await frontendsTask).ToList(), transactionId);
		var backends = await BuildBackends((await backendsTask).ToList(), transactionId);

		return new HaproxyResourceSnapshot
		{
			Version = await versionTask,
			Global = ToResource(await globalTask),
			Defaults = (await defaultsTask)
				.Select(ToResource)
				.OrderBy(x => x.Name, StringComparer.Ordinal)
				.ToList(),
			Frontends = frontends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Backends = backends.OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			Summary = new HaproxySummary
			{
				FrontendCount = frontends.Count,
				BackendCount = backends.Count,
				ServerCount = backends.Sum(x => x.Servers.Count),
			},
		};
	}

	private async Task<List<HaproxyFrontendResource>> BuildFrontends(IReadOnlyList<Generated.Frontend> frontends, string? transactionId)
	{
		var tasks = frontends.Select(async frontend =>
		{
			var bindsTask = _client.GetAllBindFrontendAsync(frontend.Name, transactionId);
			var aclsTask = _client.GetAllAclFrontendAsync(frontend.Name, null, transactionId);
			var rulesTask = _client.GetBackendSwitchingRulesAsync(frontend.Name, transactionId);

			await Task.WhenAll(bindsTask, aclsTask, rulesTask);

			return new HaproxyFrontendResource
			{
				Name = frontend.Name,
				Mode = ToApiString(frontend.Mode),
				DefaultBackend = frontend.Default_backend,
				Binds = (await bindsTask).Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
				Acls = (await aclsTask).Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
				BackendSwitchingRules = (await rulesTask).Select(ToResource).ToList(),
			};
		});

		return (await Task.WhenAll(tasks)).ToList();
	}

	private async Task<List<HaproxyBackendResource>> BuildBackends(IReadOnlyList<Generated.Backend> backends, string? transactionId)
	{
		var tasks = backends.Select(async backend =>
		{
			var servers = await _client.GetAllServerBackendAsync(backend.Name, transactionId);

			return new HaproxyBackendResource
			{
				Name = backend.Name,
				Mode = ToApiString(backend.Mode),
				Balance = backend.Balance?.Algorithm.ToString().ToLowerInvariant(),
				Servers = servers.Select(ToResource).OrderBy(x => x.Name, StringComparer.Ordinal).ToList(),
			};
		});

		return (await Task.WhenAll(tasks)).ToList();
	}

	private async Task ApplySnapshot(HaproxyResourceSnapshot desired, HaproxyResourceSnapshot baseline, string transactionId)
	{
		if (desired.Global != baseline.Global)
		{
			await _client.ReplaceGlobalAsync(ToGenerated(desired.Global), transactionId, null, null, true);
		}

		var desiredDefaults = desired.Defaults.ToDictionary(x => x.Name, StringComparer.Ordinal);
		var currentDefaults = baseline.Defaults.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var defaults in desired.Defaults)
		{
			var payload = ToGenerated(defaults);

			if (!currentDefaults.TryGetValue(defaults.Name, out var existing))
			{
				await _client.AddDefaultsSectionAsync(payload, transactionId, null, null, true);
				continue;
			}

			if (defaults != existing)
			{
				await _client.ReplaceDefaultsSectionAsync(defaults.Name, payload, transactionId, null, null, true);
			}
		}

		var desiredFrontends = desired.Frontends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		var currentFrontends = baseline.Frontends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var frontend in desired.Frontends)
		{
			var payload = ToGenerated(frontend);

			if (!currentFrontends.TryGetValue(frontend.Name, out var existing))
			{
				await _client.CreateFrontendAsync(payload, transactionId, null, null, true);
			}
			else if (HasFrontendChanged(frontend, existing))
			{
				await _client.ReplaceFrontendAsync(frontend.Name, payload, transactionId, null, null, true);
			}
		}

		var desiredBackends = desired.Backends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		var currentBackends = baseline.Backends.ToDictionary(x => x.Name, StringComparer.Ordinal);
		foreach (var backend in desired.Backends)
		{
			var payload = ToGenerated(backend);

			if (!currentBackends.TryGetValue(backend.Name, out var existing))
			{
				await _client.CreateBackendAsync(payload, transactionId, null, null, true);
			}
			else if (HasBackendChanged(backend, existing))
			{
				await _client.ReplaceBackendAsync(backend.Name, payload, transactionId, null, null, true);
			}
		}

		foreach (var frontend in desired.Frontends)
		{
			currentFrontends.TryGetValue(frontend.Name, out var current);
			await ReconcileBinds(frontend, current, transactionId);
			await ReconcileFrontendAcls(frontend, current, transactionId);
		}

		foreach (var backend in desired.Backends)
		{
			currentBackends.TryGetValue(backend.Name, out var current);
			await ReconcileServers(backend, current, transactionId);
		}

		foreach (var frontend in desired.Frontends)
		{
			currentFrontends.TryGetValue(frontend.Name, out var current);
			await ReconcileFrontendBackendSwitchingRules(frontend, current, transactionId);
		}

		foreach (var removed in baseline.Frontends.Where(x => !desiredFrontends.ContainsKey(x.Name)))
		{
			await _client.DeleteFrontendAsync(removed.Name, transactionId);
		}

		foreach (var removed in baseline.Backends.Where(x => !desiredBackends.ContainsKey(x.Name)))
		{
			await _client.DeleteBackendAsync(removed.Name, transactionId);
		}

		foreach (var removed in baseline.Defaults.Where(x => !desiredDefaults.ContainsKey(x.Name)))
		{
			await _client.DeleteDefaultsSectionAsync(removed.Name, transactionId, null, null, true);
		}
	}

	private async Task ReconcileBinds(HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId)
	{
		var currentByName = (current?.Binds ?? []).ToDictionary(x => x.Name, StringComparer.Ordinal);
		var desiredByName = desired.Binds.ToDictionary(x => x.Name, StringComparer.Ordinal);

		foreach (var removed in currentByName.Keys.Except(desiredByName.Keys, StringComparer.Ordinal))
		{
			await _client.DeleteBindFrontendAsync(removed, desired.Name, transactionId);
		}

		foreach (var bind in desired.Binds)
		{
			var payload = ToGenerated(bind);

			if (!currentByName.TryGetValue(bind.Name, out var existing))
			{
				await _client.CreateBindFrontendAsync(desired.Name, payload, transactionId);
				continue;
			}

			if (bind != existing)
			{
				await _client.ReplaceBindFrontendAsync(bind.Name, desired.Name, payload, transactionId);
			}
		}
	}

	private async Task ReconcileServers(HaproxyBackendResource desired, HaproxyBackendResource? current, string transactionId)
	{
		var currentByName = (current?.Servers ?? []).ToDictionary(x => x.Name, StringComparer.Ordinal);
		var desiredByName = desired.Servers.ToDictionary(x => x.Name, StringComparer.Ordinal);

		foreach (var removed in currentByName.Keys.Except(desiredByName.Keys, StringComparer.Ordinal))
		{
			await _client.DeleteServerBackendAsync(removed, desired.Name, transactionId);
		}

		foreach (var server in desired.Servers)
		{
			var payload = ToGenerated(server);

			if (!currentByName.TryGetValue(server.Name, out var existing))
			{
				await _client.CreateServerBackendAsync(desired.Name, payload, transactionId);
				continue;
			}

			if (server != existing)
			{
				await _client.ReplaceServerBackendAsync(server.Name, desired.Name, payload, transactionId);
			}
		}
	}

	private async Task ReconcileFrontendAcls(HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId)
	{
		var currentAcls = current?.Acls ?? [];

		if (!desired.Acls.SequenceEqual(currentAcls))
		{
			await _client.ReplaceAllAclFrontendAsync(desired.Name, desired.Acls.Select(ToGenerated), transactionId);
		}
	}

	private async Task ReconcileFrontendBackendSwitchingRules(HaproxyFrontendResource desired, HaproxyFrontendResource? current, string transactionId)
	{
		var currentRules = current?.BackendSwitchingRules ?? [];

		if (!desired.BackendSwitchingRules.SequenceEqual(currentRules))
		{
			await _client.ReplaceBackendSwitchingRulesAsync(desired.Name, desired.BackendSwitchingRules.Select(ToGenerated), transactionId);
		}
	}

	private async Task TryDeleteTransaction(string transactionId)
	{
		try
		{
			await _client.DeleteTransactionAsync(transactionId);
		}
		catch
		{
			// Best-effort cleanup after validation/save failures.
		}
	}

	private static bool HasFrontendChanged(HaproxyFrontendResource desired, HaproxyFrontendResource current)
	{
		return !string.Equals(desired.Mode, current.Mode, StringComparison.Ordinal)
			|| !string.Equals(desired.DefaultBackend, current.DefaultBackend, StringComparison.Ordinal);
	}

	private static bool HasBackendChanged(HaproxyBackendResource desired, HaproxyBackendResource current)
	{
		return !string.Equals(desired.Mode, current.Mode, StringComparison.Ordinal)
			|| !string.Equals(desired.Balance, current.Balance, StringComparison.Ordinal);
	}

	private static string GetTransactionId(Generated.Transaction transaction)
	{
		return transaction.Id ?? throw new InvalidOperationException("Data Plane API did not return a transaction id.");
	}

	private static int ToClientVersion(long version)
	{
		return checked((int)version);
	}

	private static string? ToApiString<TEnum>(TEnum? value) where TEnum : struct, Enum
	{
		return value?.ToString()?.ToLowerInvariant();
	}

	private static TEnum? ParseEnum<TEnum>(string? value) where TEnum : struct, Enum
	{
		if (string.IsNullOrWhiteSpace(value))
		{
			return null;
		}

		return Enum.TryParse<TEnum>(value, true, out var parsed) ? parsed : null;
	}

	private static HaproxyGlobalResource ToResource(Generated.Global global)
	{
		return new HaproxyGlobalResource
		{
			Daemon = global.Daemon ?? false,
		};
	}

	private static HaproxyDefaultsResource ToResource(Generated.Defaults defaults)
	{
		return new HaproxyDefaultsResource
		{
			Name = defaults.Name ?? string.Empty,
			Mode = ToApiString(defaults.Mode),
		};
	}

	private static HaproxyBindResource ToResource(Generated.Bind bind)
	{
		return new HaproxyBindResource
		{
			Name = bind.Name ?? string.Empty,
			Address = bind.Address,
			Port = bind.Port,
		};
	}

	private static HaproxyAclResource ToResource(Generated.Acl acl)
	{
		return new HaproxyAclResource
		{
			Name = acl.Acl_name ?? string.Empty,
			Criterion = acl.Criterion,
			Value = acl.Value,
		};
	}

	private static HaproxyBackendSwitchingRuleResource ToResource(Generated.Backend_switching_rule rule)
	{
		return new HaproxyBackendSwitchingRuleResource
		{
			BackendName = rule.Name ?? string.Empty,
			Cond = ToApiString(rule.Cond),
			CondTest = rule.Cond_test,
		};
	}

	private static HaproxyServerResource ToResource(Generated.Server server)
	{
		return new HaproxyServerResource
		{
			Name = server.Name ?? string.Empty,
			Address = server.Address,
			Port = server.Port,
			Check = ToApiString(server.Check),
		};
	}

	private static Generated.Global ToGenerated(HaproxyGlobalResource global)
	{
		return new Generated.Global
		{
			Daemon = global.Daemon,
		};
	}

	private static Generated.Defaults ToGenerated(HaproxyDefaultsResource defaults)
	{
		return new Generated.Defaults
		{
			Name = defaults.Name,
			Mode = ParseEnum<Generated.Defaults_baseMode>(defaults.Mode),
		};
	}

	private static Generated.Frontend ToGenerated(HaproxyFrontendResource frontend)
	{
		return new Generated.Frontend
		{
			Name = frontend.Name,
			Mode = ParseEnum<Generated.Frontend_baseMode>(frontend.Mode),
			Default_backend = frontend.DefaultBackend,
		};
	}

	private static Generated.Backend ToGenerated(HaproxyBackendResource backend)
	{
		return new Generated.Backend
		{
			Name = backend.Name,
			Mode = ParseEnum<Generated.Backend_baseMode>(backend.Mode),
			Balance = string.IsNullOrWhiteSpace(backend.Balance)
				? null
				: new Generated.Balance
				{
					Algorithm = ParseEnum<Generated.BalanceAlgorithm>(backend.Balance)
						?? throw new InvalidOperationException($"Unsupported balance algorithm '{backend.Balance}'."),
				},
		};
	}

	private static Generated.Bind ToGenerated(HaproxyBindResource bind)
	{
		return new Generated.Bind
		{
			Name = bind.Name,
			Address = bind.Address,
			Port = bind.Port,
		};
	}

	private static Generated.Acl ToGenerated(HaproxyAclResource acl)
	{
		return new Generated.Acl
		{
			Acl_name = acl.Name,
			Criterion = acl.Criterion ?? string.Empty,
			Value = acl.Value,
		};
	}

	private static Generated.Backend_switching_rule ToGenerated(HaproxyBackendSwitchingRuleResource rule)
	{
		return new Generated.Backend_switching_rule
		{
			Name = rule.BackendName,
			Cond = ParseEnum<Generated.Backend_switching_ruleCond>(rule.Cond),
			Cond_test = rule.CondTest,
		};
	}

	private static Generated.Server ToGenerated(HaproxyServerResource server)
	{
		return new Generated.Server
		{
			Name = server.Name,
			Address = server.Address ?? string.Empty,
			Port = server.Port,
			Check = ParseEnum<Generated.Server_paramsCheck>(server.Check),
		};
	}
}
