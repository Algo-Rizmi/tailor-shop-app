using Microsoft.AspNetCore.Authorization;
using Microsoft.AspNetCore.Mvc;
using Tailor.Api.Auth;
using Tailor.Api.Models;
using Tailor.Api.Services;

namespace Tailor.Api.Controllers;

[ApiController]
[Route("api/receipts")]
[Authorize]
public class ReceiptsController(ReceiptService receiptService) : ControllerBase
{
    [HttpGet("next-preview")]
    public async Task<ActionResult<NextPreviewResponse>> GetNextPreview()
    {
        var next = await receiptService.GetNextPreviewAsync(User.GetShopId());
        return Ok(new NextPreviewResponse(next));
    }

    [HttpPost]
    public async Task<ActionResult<Receipt>> Create([FromBody] CreateReceiptRequest request)
    {
        try
        {
            var receipt = await receiptService.CreateReceiptAsync(User.GetShopId(), request);
            return CreatedAtAction(nameof(GetById), new { id = receipt.Id }, receipt);
        }
        catch (NoActiveVolumeException ex)
        {
            return Conflict(new { error = ex.Message });
        }
        catch (VolumeClosedException ex)
        {
            return Conflict(new { error = ex.Message });
        }
    }

    [HttpGet]
    public async Task<ActionResult<PagedResult<Receipt>>> List(
        [FromQuery] ReceiptStatus? status,
        [FromQuery] string? search,
        [FromQuery] int page = 1,
        [FromQuery] int pageSize = 20)
    {
        page = Math.Max(page, 1);
        pageSize = Math.Clamp(pageSize, 1, 100);
        var result = await receiptService.ListAsync(User.GetShopId(), status, search, page, pageSize);
        return Ok(result);
    }

    [HttpGet("{id:int}")]
    public async Task<ActionResult<Receipt>> GetById(int id)
    {
        var receipt = await receiptService.GetByIdAsync(User.GetShopId(), id);
        return receipt is null ? NotFound() : Ok(receipt);
    }

    [HttpPut("{id:int}")]
    public async Task<ActionResult<Receipt>> Update(int id, [FromBody] UpdateReceiptRequest request)
    {
        var receipt = await receiptService.UpdateAsync(User.GetShopId(), id, request);
        return receipt is null ? NotFound() : Ok(receipt);
    }
}
