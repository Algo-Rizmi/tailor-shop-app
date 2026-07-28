namespace Tailor.Api.Models;

// One tailor shop's isolated world of volumes and receipts. Created
// automatically the moment its first (and, for now, only) user signs up.
public class Shop
{
    public int Id { get; set; }
    public string Name { get; set; } = string.Empty;
    public DateTime CreatedAt { get; set; }
}
