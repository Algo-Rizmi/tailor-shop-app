namespace Tailor.Api.Models;

// Mirrors a physical receipt book: the shop picks a starting number, receipts
// number up from there, and starting a new one permanently closes the last.
public class Volume
{
    public int Id { get; set; }
    public int ShopId { get; set; }
    public string Label { get; set; } = string.Empty;
    public int StartingNumber { get; set; }
    public int NextNumber { get; set; }
    public bool IsActive { get; set; }
    public DateTime CreatedAt { get; set; }
    public DateTime? ClosedAt { get; set; }
}
