using System.Net.Http;
using Haproxy.Editor.Abstractions.Data;
using Haproxy.Editor.Core.Services;
using Microsoft.Extensions.Logging.Abstractions;
using NSubstitute;
using Shouldly;
using Xunit;
using Generated = Haproxy.Editor.Adapters.Haproxy;

namespace Haproxy.Editor.Core.Tests;

public class HaproxyServiceTests
{
	[Fact]
	public async Task GetConfig_builds_resource_snapshot_from_generated_data_plane_resources()
	{
		var client = Substitute.For<Generated.HaproxyClient>(new HttpClient());
		var service = new HaproxyService(client, NullLogger<HaproxyService>.Instance);

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

		var result = await service.GetConfig();

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
		var client = Substitute.For<Generated.HaproxyClient>(new HttpClient());
		var service = new HaproxyService(client, NullLogger<HaproxyService>.Instance);
		var desired = new HaproxyResourceSnapshot
		{
			Version = 10,
			Global = new HaproxyGlobalResource { Daemon = true },
		};

		client.StartTransactionAsync(10, Arg.Any<CancellationToken>()).Returns(new Generated.Transaction
		{
			Id = "tx-1",
			_version = 10,
			Status = Generated.TransactionStatus.In_progress,
		});
		client.GetConfigurationVersionAsync("tx-1", Arg.Any<CancellationToken>()).Returns(10);
		client.GetGlobalAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns(new Generated.Global { Daemon = false });
		client.GetDefaultsSectionsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetFrontendsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetBackendsAsync("tx-1", true, Arg.Any<CancellationToken>()).Returns([]);

		var result = await service.ValidateConfig(desired);

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
		var client = Substitute.For<Generated.HaproxyClient>(new HttpClient());
		var service = new HaproxyService(client, NullLogger<HaproxyService>.Instance);
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

		client.StartTransactionAsync(15, Arg.Any<CancellationToken>()).Returns(new Generated.Transaction
		{
			Id = "tx-2",
			_version = 15,
			Status = Generated.TransactionStatus.In_progress,
		});
		client.GetConfigurationVersionAsync("tx-2", Arg.Any<CancellationToken>()).Returns(15);
		client.GetGlobalAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns(new Generated.Global());
		client.GetDefaultsSectionsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetFrontendsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.GetBackendsAsync("tx-2", true, Arg.Any<CancellationToken>()).Returns([]);
		client.CommitTransactionAsync("tx-2", Arg.Any<bool?>(), Arg.Any<CancellationToken>()).Returns(new Generated.Transaction
		{
			Id = "tx-2",
			_version = 16,
			Status = Generated.TransactionStatus.Success,
		});

		await service.SaveConfig(desired);

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
}
