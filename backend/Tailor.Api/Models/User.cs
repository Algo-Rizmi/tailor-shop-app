namespace Tailor.Api.Models;

public class User
{
    public int Id { get; set; }
    public string Email { get; set; } = string.Empty;
    // Null for accounts that only ever signed in with Google.
    public string? PasswordHash { get; set; }
    // Google's stable per-account identifier ("sub" claim). Null for
    // email/password-only accounts.
    public string? GoogleSubjectId { get; set; }
    public int ShopId { get; set; }
    public Shop? Shop { get; set; }
    public DateTime CreatedAt { get; set; }
}
