using System.Net.Http;
using Hangfire;
using Hangfire.Common;
using Hangfire.States;
using Haproxy.Editor.Abstractions.Configurations;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Abstractions.Interfaces.Repositories;
using Haproxy.Editor.Core.Services;
using Microsoft.AspNetCore.Http;
using Microsoft.Extensions.Logging.Abstractions;
using Microsoft.Extensions.Options;
using NSubstitute;
using Shouldly;
using Xunit;
using Generated = Haproxy.Editor.Adapters.Haproxy;

namespace Haproxy.Editor.Core.Tests;

public class NodeHaproxyServiceTests
{
	[Fact]
	public async Task GetConfig_builds_resource_snapshot_from_generated_data_plane_resources()
	{
		var client = CreateClient();
		var service = new NodeHaproxyService(new FakeNodeClientFactory(client), NullLogger<NodeHaproxyService>.Instance);

		client.GetConfigurationVersionAsync(null, Arg.Any<CancellationToken>()).Returns(7);
		client.GetGlobalAsync(null, true, Arg.Any<CancellationToken>()).Returns(new Generated.Global { Daemon = true });
		client.GetDefaultsSectionsAsync(null, true, Arg.Any<CancellationToken>()).Returns([
			new Generated.Defaults { Name = "defaults_main", Mode = Generated.Defaults_baseMode.Http },
		]);
		client.GetFrontendsAsync(null, true, Arg.Any<CancellationToken>()).Returns([
			new Generated.Frontend { Name = "fe_main", Mode = Generated.Frontend_baseMode.Http },
		]);
		client.GetBackendsAsync(null, true, Arg.Any<CancellationToken>()).Returns([
			new Generated.Backend { Name = "be_main", Mode = Generated.Backend_baseMode.Http },
		]);
		client.GetAllBindFrontendAsync("fe_main", null, Arg.Any<CancellationToken>()).Returns([
			new Generated.Bind { Name = "public", Address = "127.0.0.1", Port = 80 },
		]);
		client.GetAllAclFrontendAsync("fe_main", null, null, Arg.Any<CancellationToken>()).Returns([
			new Generated.Acl { Acl_name = "host_acl", Criterion = "hdr(host)", Value = "example.com" },
		]);
		client.GetBackendSwitchingRulesAsync("fe_main", null, Arg.Any<CancellationToken>()).Returns([
			new Generated.Backend_switching_rule { Name = "be_main", Cond = Generated.Backend_switching_ruleCond.If, Cond_test = "host_acl" },
		]);
		client.GetAllServerBackendAsync("be_main", null, Arg.Any<CancellationToken>()).Returns([
			new Generated.Server { Name = "app_1", Address = "10.0.0.10", Port = 8080 },
		]);

		var result = await service.GetConfig("node-1");

		result.Version.ShouldBe(7);
		result.Frontends.Count.ShouldBe(1);
		result.Backends.Count.ShouldBe(1);
		result.Summary.ServerCount.ShouldBe(1);
		result.Frontends[0].Binds[0].Address.ShouldBe("127.0.0.1");
		result.Frontends[0].Acls[0].Name.ShouldBe("host_acl");
		result.Backends[0].Servers[0].Name.ShouldBe("app_1");
	}

	[Fact]
	public async Task ValidateConfig_starts_transaction_applies_changes_and_deletes_transaction()
	{
		var client = CreateClient();
		var service = new NodeHaproxyService(new FakeNodeClientFactory(client), NullLogger<NodeHaproxyService>.Instance);
		var desired = new HaproxyResourceSnapshot
		{
			Version = 10,
			Global = new HaproxyGlobalResource { Daemon = true },
		};

		client.GetConfigurationVersionAsync(null, Arg.Any<CancellationToken>()).Returns(10);
		client.StartTransactionAsync(10, Arg.Any<CancellationToken>()).Returns(new Generated.Transaction { Id = "tx-1", _version = 10 });
		client.GetConfigurationVersionAsync("tx-1", Arg.Any<CancellationToken>()).Returns(10);
		client.GetGlobalAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns(new Generated.Global { Daemon = false });
		client.GetDefaultsSectionsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetFrontendsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetBackendsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);

		var result = await service.ValidateConfig("node-1", desired);

		result.IsValid.ShouldBeTrue();
		await client.Received(1).StartTransactionAsync(10, Arg.Any<CancellationToken>());
		await client.Received(1).ReplaceGlobalAsync(
			Arg.Is<Generated.Global>(x => x.Daemon == true),
			"tx-1",
			null,
			null,
			true,
			Arg.Any<CancellationToken>());
		await client.Received(1).DeleteTransactionAsync("tx-1", Arg.Any<CancellationToken>());
		await client.DidNotReceive().CommitTransactionAsync(Arg.Any<string>(), Arg.Any<bool?>(), Arg.Any<CancellationToken>());
	}

	[Fact]
	public async Task SaveConfig_commits_transaction_after_resource_creation()
	{
		var client = CreateClient();
		var service = new NodeHaproxyService(new FakeNodeClientFactory(client), NullLogger<NodeHaproxyService>.Instance);
		var desired = new HaproxyResourceSnapshot
		{
			Version = 15,
			Global = new HaproxyGlobalResource(),
			Backends =
			[
				new HaproxyBackendResource
				{
					Name = "be_new",
					Mode = "http",
				},
			],
		};

		client.GetConfigurationVersionAsync(null, Arg.Any<CancellationToken>()).Returns(15);
		client.StartTransactionAsync(15, Arg.Any<CancellationToken>()).Returns(new Generated.Transaction { Id = "tx-2", _version = 15 });
		client.GetConfigurationVersionAsync("tx-2", Arg.Any<CancellationToken>()).Returns(15);
		client.GetGlobalAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns(new Generated.Global());
		client.GetDefaultsSectionsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetFrontendsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetBackendsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.CommitTransactionAsync("tx-2", Arg.Any<bool?>(), Arg.Any<CancellationToken>()).Returns(new Generated.Transaction { Id = "tx-2", _version = 16 });

		var version = await service.SaveConfig("node-1", desired);

		version.ShouldBe(16);
		await client.Received(1).CreateBackendAsync(
			Arg.Is<Generated.Backend>(x => x.Name == "be_new"),
			"tx-2",
			null,
			null,
			true,
			Arg.Any<CancellationToken>());
		await client.Received(1).CommitTransactionAsync("tx-2", Arg.Any<bool?>(), Arg.Any<CancellationToken>());
		await client.DidNotReceive().DeleteTransactionAsync("tx-2", Arg.Any<CancellationToken>());
	}

	private static Generated.HaproxyClient CreateClient()
	{
		return Substitute.For<Generated.HaproxyClient>(new HttpClient());
	}
}

public class HaproxyServiceTests
{
	[Fact]
	public async Task SaveConfig_persists_revision_and_signals_background_sync()
	{
		var nodeService = Substitute.For<IHaproxyNodeService>();
		var repository = Substitute.For<IHaproxyClusterRepository>();
		var backgroundJobs = Substitute.For<IBackgroundJobClient>();
		var service = CreateService(nodeService, repository, backgroundJobs);
		var snapshot = CreateSnapshot(version: 4);

		nodeService.ValidateConfig("node-1", Arg.Any<HaproxyResourceSnapshot>(), Arg.Any<CancellationToken>())
			.Returns(new ValidationResult(true));
		nodeService.GetConfig("node-1", Arg.Any<CancellationToken>())
			.Returns(CreateSnapshot(version: 7));

		await service.SaveConfig(snapshot);

		await repository.Received(1).CreateNewCurrentRevision(
			Arg.Is<HaproxyResourceSnapshot>(x => x.Summary.ServerCount == 1 && x.Backends[0].Name == "be_main"),
			"alice",
			7,
			false,
			Arg.Any<CancellationToken>());
		backgroundJobs.Received(1).Create(Arg.Any<Job>(), Arg.Any<IState>());
	}

	[Fact]
	public async Task GetConfig_bootstraps_from_validation_node_when_repository_is_empty()
	{
		var nodeService = Substitute.For<IHaproxyNodeService>();
		var repository = Substitute.For<IHaproxyClusterRepository>();
		var backgroundJobs = Substitute.For<IBackgroundJobClient>();
		var service = CreateService(nodeService, repository, backgroundJobs);
		var bootstrap = CreateSnapshot(version: 11);
		var createdRevision = CreateRevision(bootstrap, revisionNumber: 1, validationVersion: 11, markValidationNodeSynced: true);

		repository.GetCurrentRevision(Arg.Any<CancellationToken>()).Returns((ClusterRevisionDocument?)null);
		nodeService.GetConfig("node-1", Arg.Any<CancellationToken>()).Returns(bootstrap);
		repository.CreateNewCurrentRevision(Arg.Any<HaproxyResourceSnapshot>(), "bootstrap", 11, true, Arg.Any<CancellationToken>()).Returns(createdRevision);

		var result = await service.GetConfig();

		result.Version.ShouldBe(11);
		result.Backends.Count.ShouldBe(1);
		backgroundJobs.Received(1).Create(Arg.Any<Job>(), Arg.Any<IState>());
	}

	[Fact]
	public async Task GetDashboardSnapshot_aggregates_cluster_status_and_node_details()
	{
		var nodeService = Substitute.For<IHaproxyNodeService>();
		var repository = Substitute.For<IHaproxyClusterRepository>();
		var backgroundJobs = Substitute.For<IBackgroundJobClient>();
		var service = CreateService(nodeService, repository, backgroundJobs);
		var current = CreateRevision(CreateSnapshot(version: 9), revisionNumber: 3, validationVersion: 9, markValidationNodeSynced: false);
		current.Nodes[0].SyncStatus = ClusterSyncStatus.Synced;
		current.Nodes[1].SyncStatus = ClusterSyncStatus.Failed;
		current.Nodes[1].LastError = "timeout";

		repository.GetCurrentRevision(Arg.Any<CancellationToken>()).Returns(current);
		nodeService.GetRuntimeSnapshot("node-1", Arg.Any<HaproxyResourceSnapshot>(), Arg.Any<CancellationToken>())
			.Returns(new NodeRuntimeSnapshot
			{
				RuntimeStatus = RuntimeStatus.Up,
				Backends =
				[
					new RuntimeBackendStatus
					{
						Name = "be_main",
						Status = RuntimeStatus.Healthy,
						HealthyServers = 1,
						Servers = [new RuntimeServerStatus { Name = "app_1", Status = RuntimeStatus.Up }],
					},
				],
			});
		nodeService.GetRuntimeSnapshot("node-2", Arg.Any<HaproxyResourceSnapshot>(), Arg.Any<CancellationToken>())
			.Returns(new NodeRuntimeSnapshot
			{
				RuntimeStatus = RuntimeStatus.Down,
				Backends =
				[
					new RuntimeBackendStatus
					{
						Name = "be_main",
						Status = RuntimeStatus.Critical,
						DownServers = 1,
						Servers = [new RuntimeServerStatus { Name = "app_1", Status = RuntimeStatus.Down }],
					},
				],
			});

		var result = await service.GetDashboardSnapshot();

		result.Cluster.CurrentRevision.ShouldBe(3);
		result.Cluster.Status.ShouldBe(RuntimeStatus.Critical);
		result.Cluster.Nodes.Count.ShouldBe(2);
		result.Alerts.ShouldContain(x => x.Id == "cluster-sync-node-2");
		result.Backends.Single().Status.ShouldBe(RuntimeStatus.Critical);
	}

	private static HaproxyService CreateService(IHaproxyNodeService nodeService, IHaproxyClusterRepository repository, IBackgroundJobClient backgroundJobs)
	{
		var httpContext = new DefaultHttpContext();
		httpContext.User = new System.Security.Claims.ClaimsPrincipal(new System.Security.Claims.ClaimsIdentity(
			[new System.Security.Claims.Claim(System.Security.Claims.ClaimTypes.Name, "alice")],
			"test"));

		return new HaproxyService(
			nodeService,
			repository,
			backgroundJobs,
			new StaticOptionsMonitor<AppConfig>(new AppConfig
			{
				MongoDb = new MongoDbConfig
				{
					ConnectionString = "mongodb://localhost:27017/haproxy-editor",
					DatabaseName = "haproxy-editor",
				},
				Cluster = new HaproxyClusterConfig
				{
					ClusterId = "cluster-a",
					ValidationNodeId = "node-1",
					Nodes =
					[
						new HaproxyClusterNodeConfig { NodeId = "node-1", DisplayName = "Node 1", BaseUrl = "http://node-1/v3/" },
						new HaproxyClusterNodeConfig { NodeId = "node-2", DisplayName = "Node 2", BaseUrl = "http://node-2/v3/" },
					],
				},
			}),
			new HttpContextAccessor { HttpContext = httpContext },
			NullLogger<HaproxyService>.Instance);
	}

	private static HaproxyResourceSnapshot CreateSnapshot(long version)
	{
		return new HaproxyResourceSnapshot
		{
			Version = version,
			Global = new HaproxyGlobalResource { Daemon = true },
			Frontends =
			[
				new HaproxyFrontendResource
				{
					Name = "fe_main",
					DefaultBackend = "be_main",
				},
			],
			Backends =
			[
				new HaproxyBackendResource
				{
					Name = "be_main",
					Servers = [new HaproxyServerResource { Name = "app_1", Address = "10.0.0.10", Port = 8080 }],
				},
			],
			Summary = new HaproxySummary { FrontendCount = 1, BackendCount = 1, ServerCount = 1 },
		};
	}

	private static ClusterRevisionDocument CreateRevision(HaproxyResourceSnapshot snapshot, long revisionNumber, long validationVersion, bool markValidationNodeSynced)
	{
		return ClusterRevisionDocument.Create(
			"cluster-a",
			revisionNumber,
			"alice",
			snapshot,
			validationVersion,
			[
				new HaproxyClusterNodeConfig { NodeId = "node-1", DisplayName = "Node 1", BaseUrl = "http://node-1/v3/" },
				new HaproxyClusterNodeConfig { NodeId = "node-2", DisplayName = "Node 2", BaseUrl = "http://node-2/v3/" },
			],
			"node-1",
			markValidationNodeSynced);
	}

	private sealed class StaticOptionsMonitor<T> : IOptionsMonitor<T> where T : class
	{
		public StaticOptionsMonitor(T currentValue)
		{
			CurrentValue = currentValue;
		}

		public T CurrentValue { get; }

		public T Get(string? name) => CurrentValue;

		public IDisposable? OnChange(Action<T, string?> listener) => null;
	}
}

file sealed class FakeNodeClientFactory : Generated.IHaproxyNodeClientFactory
{
	private readonly IReadOnlyList<HaproxyClusterNodeConfig> _nodes;
	private readonly Dictionary<string, Generated.HaproxyClient> _clients;

	public FakeNodeClientFactory(Generated.HaproxyClient client)
	{
		_nodes =
		[
			new HaproxyClusterNodeConfig { NodeId = "node-1", DisplayName = "Node 1", BaseUrl = "http://node-1/v3/" },
		];
		_clients = new(StringComparer.OrdinalIgnoreCase)
		{
			["node-1"] = client,
		};
	}

	public Generated.HaproxyClient CreateClient(string nodeId) => _clients[nodeId];

	public HaproxyClusterNodeConfig GetRequiredNode(string nodeId) => _nodes.Single(x => x.NodeId == nodeId);

	public IReadOnlyList<HaproxyClusterNodeConfig> GetNodes(bool enabledOnly = false) => _nodes;
}
