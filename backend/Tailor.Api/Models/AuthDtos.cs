using System.ComponentModel.DataAnnotations;

namespace Tailor.Api.Models;

public class RegisterRequest
{
    [Required, EmailAddress, MaxLength(320)]
    public string Email { get; set; } = string.Empty;

    [Required, MinLength(8)]
    public string Password { get; set; } = string.Empty;

    [Required, MaxLength(200)]
    public string ShopName { get; set; } = string.Empty;
}

public class LoginRequest
{
    [Required, EmailAddress]
    public string Email { get; set; } = string.Empty;

    [Required]
    public string Password { get; set; } = string.Empty;
}

public class GoogleLoginRequest
{
    [Required]
    public string IdToken { get; set; } = string.Empty;

    // Only used the first time a Google sign-in creates a brand-new shop.
    [MaxLength(200)]
    public string? ShopName { get; set; }
}

public record AuthResponse(string Token, string Email, string ShopName);
