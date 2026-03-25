namespace Haproxy.Editor.Abstractions.Data;

public record ValidationResult(bool IsValid, string? ErrorMessage = null) : IValidationResult
{
	public static implicit operator ValidationResult(Exception err) => new(false, err.Message);
}

public record ValidationResult<T>(T? Data, bool IsValid, string? ErrorMessage = null) : IValidationResult
{
	public static implicit operator ValidationResult<T>(T result) => new(result, true);
	public static implicit operator ValidationResult<T>(Exception err) => new(default, false, err.Message);
}

public interface IValidationResult
{
	bool IsValid { get; }
	string? ErrorMessage { get; }
}