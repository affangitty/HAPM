namespace HAPM.Application.Common;

public abstract class AppException : Exception
{
    public int StatusCode { get; }
    protected AppException(string message, int statusCode) : base(message) => StatusCode = statusCode;
}

public class NotFoundException : AppException
{
    public NotFoundException(string message) : base(message, 404) { }
    public NotFoundException(string entity, object key) : base($"{entity} with id '{key}' was not found.", 404) { }
}

public class BadRequestException : AppException
{
    public BadRequestException(string message) : base(message, 400) { }
}

public class ConflictException : AppException
{
    public ConflictException(string message) : base(message, 409) { }
}

public class ForbiddenException : AppException
{
    public ForbiddenException(string message = "You do not have permission to perform this action.") : base(message, 403) { }
}

public class UnauthorizedException : AppException
{
    public UnauthorizedException(string message = "Invalid credentials.") : base(message, 401) { }
}
