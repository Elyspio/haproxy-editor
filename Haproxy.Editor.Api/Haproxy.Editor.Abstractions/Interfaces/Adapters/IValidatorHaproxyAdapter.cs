using Haproxy.Editor.Abstractions.Data;

namespace Haproxy.Editor.Abstractions.Interfaces.Adapters;

public interface IValidatorHaproxyAdapter
{
	public Task<ValidationResult> Validate(string filepath);
}