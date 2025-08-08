namespace Haproxy.Editor.Abstractions.Data;

public record ValidationResult(bool IsValid, string? ErrorMessage = null);