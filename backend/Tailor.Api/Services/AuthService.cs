using Google.Apis.Auth;
using Microsoft.AspNetCore.Identity;
using Microsoft.EntityFrameworkCore;
using Tailor.Api.Auth;
using Tailor.Api.Data;
using Tailor.Api.Models;

namespace Tailor.Api.Services;

public class AuthService(AppDbContext db, JwtTokenService tokenService, IConfiguration configuration)
{
    private readonly PasswordHasher<User> _hasher = new();

    public async Task<AuthResponse> RegisterAsync(RegisterRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        if (await db.Users.AnyAsync(u => u.Email == email))
        {
            throw new AuthException("An account with this email already exists.");
        }

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var shop = new Shop { Name = request.ShopName.Trim(), CreatedAt = DateTime.UtcNow };
            db.Shops.Add(shop);
            await db.SaveChangesAsync();

            var user = new User { Email = email, ShopId = shop.Id, CreatedAt = DateTime.UtcNow };
            user.PasswordHash = _hasher.HashPassword(user, request.Password);
            db.Users.Add(user);
            await db.SaveChangesAsync();

            await transaction.CommitAsync();

            return new AuthResponse(tokenService.CreateToken(user), user.Email, shop.Name);
        });
    }

    public async Task<AuthResponse> LoginAsync(LoginRequest request)
    {
        var email = request.Email.Trim().ToLowerInvariant();
        var user = await db.Users.Include(u => u.Shop).SingleOrDefaultAsync(u => u.Email == email);

        if (user is null || user.PasswordHash is null)
        {
            throw new AuthException("Invalid email or password.");
        }

        var result = _hasher.VerifyHashedPassword(user, user.PasswordHash, request.Password);
        if (result == PasswordVerificationResult.Failed)
        {
            throw new AuthException("Invalid email or password.");
        }

        return new AuthResponse(tokenService.CreateToken(user), user.Email, user.Shop!.Name);
    }

    public async Task<AuthResponse> GoogleLoginAsync(GoogleLoginRequest request)
    {
        var clientId = configuration["GoogleAuth:ClientId"]
            ?? throw new InvalidOperationException("Missing GoogleAuth:ClientId configuration.");

        GoogleJsonWebSignature.Payload payload;
        try
        {
            payload = await GoogleJsonWebSignature.ValidateAsync(request.IdToken,
                new GoogleJsonWebSignature.ValidationSettings { Audience = [clientId] });
        }
        catch (InvalidJwtException)
        {
            throw new AuthException("Could not verify Google sign-in.");
        }

        var existing = await db.Users.Include(u => u.Shop)
            .SingleOrDefaultAsync(u => u.GoogleSubjectId == payload.Subject);
        if (existing is not null)
        {
            return new AuthResponse(tokenService.CreateToken(existing), existing.Email, existing.Shop!.Name);
        }

        var email = payload.Email.Trim().ToLowerInvariant();
        var byEmail = await db.Users.Include(u => u.Shop).SingleOrDefaultAsync(u => u.Email == email);
        if (byEmail is not null)
        {
            // Same email already registered with a password — link the Google
            // identity to that existing account instead of creating a duplicate.
            byEmail.GoogleSubjectId = payload.Subject;
            await db.SaveChangesAsync();
            return new AuthResponse(tokenService.CreateToken(byEmail), byEmail.Email, byEmail.Shop!.Name);
        }

        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var shopName = string.IsNullOrWhiteSpace(request.ShopName) ? "My Shop" : request.ShopName.Trim();
            var shop = new Shop { Name = shopName, CreatedAt = DateTime.UtcNow };
            db.Shops.Add(shop);
            await db.SaveChangesAsync();

            var user = new User
            {
                Email = email,
                GoogleSubjectId = payload.Subject,
                ShopId = shop.Id,
                CreatedAt = DateTime.UtcNow,
            };
            db.Users.Add(user);
            await db.SaveChangesAsync();

            await transaction.CommitAsync();

            return new AuthResponse(tokenService.CreateToken(user), user.Email, shop.Name);
        });
    }
}
