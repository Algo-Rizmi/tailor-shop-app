namespace Tailor.Api.Models;

public enum PaymentStatus
{
    Unpaid,
    Partial,
    Paid
}

public enum ReceiptStatus
{
    Pending,
    InProgress,
    Ready,
    PickedUp
}

public class Receipt
{
    public int Id { get; set; }
    public int VolumeId { get; set; }
    public Volume? Volume { get; set; }
    public int ReceiptNumber { get; set; }
    public string CustomerName { get; set; } = string.Empty;
    public string? CustomerPhone { get; set; }
    public List<ReceiptItem> Items { get; set; } = [];
    public string? Instructions { get; set; }
    public decimal? Price { get; set; }
    public PaymentStatus PaymentStatus { get; set; } = PaymentStatus.Unpaid;
    public DateOnly? DueDate { get; set; }
    public ReceiptStatus Status { get; set; } = ReceiptStatus.Pending;
    public DateTime CreatedAt { get; set; }
    public DateTime UpdatedAt { get; set; }
}
