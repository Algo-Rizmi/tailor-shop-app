using System.ComponentModel.DataAnnotations;

namespace Tailor.Api.Models;

public record NextPreviewResponse(int? NextReceiptNumber);

public class ReceiptItemRequest
{
    [Required, MaxLength(100)]
    public string ClothingType { get; set; } = string.Empty;

    [MaxLength(50)]
    public string? Color { get; set; }

    [Range(1, 1000)]
    public int Quantity { get; set; } = 1;
}

public class CreateReceiptRequest
{
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    [Required, MinLength(1)]
    public List<ReceiptItemRequest> Items { get; set; } = [];

    public string? Instructions { get; set; }
    public decimal? Price { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public DateOnly? DueDate { get; set; }
}

public class UpdateReceiptRequest
{
    [MaxLength(200)]
    public string? CustomerName { get; set; }

    [MaxLength(50)]
    public string? CustomerPhone { get; set; }

    [Required, MinLength(1)]
    public List<ReceiptItemRequest> Items { get; set; } = [];

    public string? Instructions { get; set; }
    public decimal? Price { get; set; }
    public PaymentStatus PaymentStatus { get; set; }
    public DateOnly? DueDate { get; set; }
    public ReceiptStatus Status { get; set; }
}

public class StartVolumeRequest
{
    [Range(0, int.MaxValue)]
    public int StartingNumber { get; set; }

    [MaxLength(100)]
    public string? Label { get; set; }
}

public record PagedResult<T>(List<T> Items, int Page, int PageSize, int TotalCount);
