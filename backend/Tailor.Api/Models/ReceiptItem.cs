namespace Tailor.Api.Models;

public class ReceiptItem
{
    public int Id { get; set; }
    public int ReceiptId { get; set; }
    public string ClothingType { get; set; } = string.Empty;
    public string? Color { get; set; }
    public int Quantity { get; set; } = 1;
}
