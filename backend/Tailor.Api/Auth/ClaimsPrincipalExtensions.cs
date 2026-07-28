using System.Security.Claims;

namespace Tailor.Api.Auth;

public static class ClaimsPrincipalExtensions
{
    public static int GetShopId(this ClaimsPrincipal principal)
    {
        var value = principal.FindFirstValue(JwtTokenService.ShopIdClaim)
            ?? throw new InvalidOperationException("Token is missing the shop_id claim.");
        return int.Parse(value);
    }
}
