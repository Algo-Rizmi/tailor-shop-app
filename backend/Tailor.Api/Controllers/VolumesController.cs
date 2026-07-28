using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tailor.Api.Auth;
using Tailor.Api.Models;
using Tailor.Api.Services;

namespace Tailor.Api.Controllers;

[ApiController]
[Route("api/volumes")]
[Authorize]
public class VolumesController(VolumeService volumeService) : ControllerBase
{
    [HttpGet("current")]
    public async Task<ActionResult<Volume?>> GetCurrent()
    {
        var current = await volumeService.GetCurrentAsync(User.GetShopId());
        return Ok(current);
    }

    [HttpGet]
    public async Task<ActionResult<List<Volume>>> List()
    {
        var volumes = await volumeService.ListAsync(User.GetShopId());
        return Ok(volumes);
    }

    // Closes whatever volume is active (if any) and starts a new one. This is
    // intentionally repeatable and one-way, unlike the old one-time
    // starting-number setup — the shop can start as many "chapters" as it wants.
    [HttpPost]
    public async Task<ActionResult<Volume>> Start([FromBody] StartVolumeRequest request)
    {
        var volume = await volumeService.StartNewVolumeAsync(User.GetShopId(), request.StartingNumber, request.Label);
        return Ok(volume);
    }
}
