using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Core.Services;

public interface IHaproxyNodeService
{
	public Task<HaproxyResourceSnapshot> GetConfig(string nodeId, CancellationToken cancellationToken = default);

	public Task<long> SaveConfig(string nodeId, HaproxyResourceSnapshot config, CancellationToken cancellationToken = default);

	public Task<IValidationResult> ValidateConfig(string nodeId, HaproxyResourceSnapshot config, CancellationToken cancellationToken = default);

	public Task<NodeRuntimeSnapshot> GetRuntimeSnapshot(string nodeId, HaproxyResourceSnapshot desiredConfig, CancellationToken cancellationToken = default);
}

public sealed record NodeRuntimeSnapshot
{
	public RuntimeStatus RuntimeStatus { get; init; } = RuntimeStatus.Unknown;

	public string? RuntimeError { get; init; }

	public IReadOnlyList<RuntimeBackendStatus> Backends { get; init; } = [];
}
