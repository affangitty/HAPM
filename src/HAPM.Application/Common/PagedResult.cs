using Microsoft.EntityFrameworkCore;

namespace HAPM.Application.Common;

public class PagedResult<T>
{
    public IReadOnlyList<T> Items { get; init; } = Array.Empty<T>();
    public int Page { get; init; }
    public int PageSize { get; init; }
    public int TotalCount { get; init; }
    public int TotalPages => PageSize == 0 ? 0 : (int)Math.Ceiling(TotalCount / (double)PageSize);
    public bool HasPrevious => Page > 1;
    public bool HasNext => Page < TotalPages;
}

public class PaginationParams
{
    private const int MaxPageSize = 100;
    private int _page = 1;
    private int _pageSize = 10;

    public int Page { get => _page; set => _page = value < 1 ? 1 : value; }
    public int PageSize { get => _pageSize; set => _pageSize = Math.Clamp(value, 1, MaxPageSize); }
    public string? Search { get; set; }
    public string? SortBy { get; set; }
    public bool SortDescending { get; set; }
}

public static class QueryableExtensions
{
    public static async Task<PagedResult<T>> ToPagedResultAsync<T>(
        this IQueryable<T> query, int page, int pageSize, CancellationToken ct = default)
    {
        var totalCount = await query.CountAsync(ct);
        var items = await query.Skip((page - 1) * pageSize).Take(pageSize).ToListAsync(ct);
        return new PagedResult<T> { Items = items, Page = page, PageSize = pageSize, TotalCount = totalCount };
    }
}
