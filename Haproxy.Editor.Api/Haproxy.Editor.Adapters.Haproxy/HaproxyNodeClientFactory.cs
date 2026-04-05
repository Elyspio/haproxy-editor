using System.Collections.Concurrent;
using System.Net.Http.Headers;
using System.Text;
using Haproxy.Editor.Abstractions.Configurations;
using Microsoft.Extensions.Options;

namespace Haproxy.Editor.Adapters.Haproxy;

public class HaproxyNodeClientFactory : IHaproxyNodeClientFactory, IDisposable
{
	private readonly ConcurrentDictionary<string, Lazy<(HttpClient HttpClient, HaproxyClient Client)>> _clients = new(StringComparer.OrdinalIgnoreCase);
	private readonly IOptionsMonitor<AppConfig> _optionsMonitor;
	private bool _disposed;

	public HaproxyNodeClientFactory(IOptionsMonitor<AppConfig> optionsMonitor)
	{
		_optionsMonitor = optionsMonitor;
	}

	public HaproxyClient CreateClient(string nodeId)
	{
		ThrowIfDisposed();
		return _clients.GetOrAdd(nodeId, CreateLazyClient).Value.Client;
	}

	public HaproxyClusterNodeConfig GetRequiredNode(string nodeId)
	{
		var node = _optionsMonitor.CurrentValue.Cluster.Nodes
			.FirstOrDefault(x => string.Equals(x.NodeId, nodeId, StringComparison.OrdinalIgnoreCase));

		return node ?? throw new InvalidOperationException($"Unknown HAProxy cluster node '{nodeId}'.");
	}

	public IReadOnlyList<HaproxyClusterNodeConfig> GetNodes(bool enabledOnly = false)
	{
		var nodes = _optionsMonitor.CurrentValue.Cluster.Nodes;
		return enabledOnly ? nodes.Where(x => x.Enabled).ToList() : nodes.ToList();
	}

	public void Dispose()
	{
		if (_disposed)
		{
			return;
		}

		foreach (var item in _clients.Values.Where(x => x.IsValueCreated))
		{
			item.Value.HttpClient.Dispose();
		}

		_clients.Clear();
		_disposed = true;
	}

	private Lazy<(HttpClient HttpClient, HaproxyClient Client)> CreateLazyClient(string nodeId)
	{
		return new Lazy<(HttpClient HttpClient, HaproxyClient Client)>(() =>
		{
			var node = GetRequiredNode(nodeId);
			var handler = new HttpClientHandler
			{
				ServerCertificateCustomValidationCallback = node.IgnoreTlsErrors
					? (_, _, _, _) => true
					: null,
			};

			var httpClient = new HttpClient(handler)
			{
				BaseAddress = new Uri(node.BaseUrl.TrimEnd('/') + "/"),
				Timeout = TimeSpan.FromSeconds(node.TimeoutSeconds),
			};

			if (!string.IsNullOrWhiteSpace(node.Token))
			{
				httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Bearer", node.Token);
			}
			else if (!string.IsNullOrWhiteSpace(node.Username))
			{
				var raw = Convert.ToBase64String(Encoding.UTF8.GetBytes($"{node.Username}:{node.Password ?? string.Empty}"));
				httpClient.DefaultRequestHeaders.Authorization = new AuthenticationHeaderValue("Basic", raw);
			}

			return (httpClient, new HaproxyClient(httpClient));
		}, LazyThreadSafetyMode.ExecutionAndPublication);
	}

	private void ThrowIfDisposed()
	{
		ObjectDisposedException.ThrowIf(_disposed, this);
	}
}
