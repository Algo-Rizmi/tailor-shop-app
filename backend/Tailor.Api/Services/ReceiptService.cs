using Microsoft.EntityFrameworkCore;
using Tailor.Api.Data;
using Tailor.Api.Models;

namespace Tailor.Api.Services;

public class ReceiptService(AppDbContext db)
{
    // Read-only preview of the number the NEXT saved receipt would get, from
    // this shop's currently active volume. Null if no volume has been started yet.
    public async Task<int?> GetNextPreviewAsync(int shopId)
    {
        var volume = await db.Volumes.AsNoTracking().SingleOrDefaultAsync(v => v.ShopId == shopId && v.IsActive);
        return volume?.NextNumber;
    }

    // Atomically increments the active volume's counter and creates the
    // receipt with that number, in one transaction. Postgres row-locks the
    // volume row for the duration of the transaction, so concurrent calls
    // from different devices serialize here and can never receive the same
    // number. The "- 1" reads the pre-increment value in the same statement.
    public async Task<Receipt> CreateReceiptAsync(int shopId, CreateReceiptRequest request)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var activeVolume = await db.Volumes.AsNoTracking()
                .SingleOrDefaultAsync(v => v.ShopId == shopId && v.IsActive);
            if (activeVolume is null)
            {
                throw new NoActiveVolumeException();
            }

            var assignedNumbers = await db.Database
                .SqlQuery<int>(
                    $"UPDATE \"Volumes\" SET \"NextNumber\" = \"NextNumber\" + 1 WHERE \"Id\" = {activeVolume.Id} AND \"ShopId\" = {shopId} AND \"IsActive\" = true RETURNING \"NextNumber\" - 1")
                .ToListAsync();

            if (assignedNumbers.Count == 0)
            {
                throw new VolumeClosedException();
            }

            var receipt = new Receipt
            {
                VolumeId = activeVolume.Id,
                ReceiptNumber = assignedNumbers.Single(),
                CustomerName = request.CustomerName?.Trim() ?? string.Empty,
                CustomerPhone = request.CustomerPhone,
                Items = request.Items.Select(i => new ReceiptItem
                {
                    ClothingType = i.ClothingType,
                    Color = i.Color,
                    Quantity = i.Quantity,
                }).ToList(),
                Instructions = request.Instructions,
                Price = request.Price,
                PaymentStatus = request.PaymentStatus,
                DueDate = request.DueDate,
                Status = ReceiptStatus.Pending,
                CreatedAt = DateTime.UtcNow,
                UpdatedAt = DateTime.UtcNow,
            };

            db.Receipts.Add(receipt);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            return receipt;
        });
    }

    public async Task<PagedResult<Receipt>> ListAsync(
        int shopId, ReceiptStatus? status, string? search, int page, int pageSize)
    {
        var query = db.Receipts.AsNoTracking().Include(r => r.Items).Include(r => r.Volume)
            .Where(r => r.Volume!.ShopId == shopId)
            .AsQueryable();

        if (status is not null)
        {
            query = query.Where(r => r.Status == status);
        }

        if (!string.IsNullOrWhiteSpace(search))
        {
            var term = search.Trim();
            query = query.Where(r =>
                r.CustomerName.Contains(term) ||
                (r.CustomerPhone != null && r.CustomerPhone.Contains(term)) ||
                r.ReceiptNumber.ToString().Contains(term));
        }

        var totalCount = await query.CountAsync();

        var items = await query
            .OrderByDescending(r => r.CreatedAt)
            .Skip((page - 1) * pageSize)
            .Take(pageSize)
            .ToListAsync();

        return new PagedResult<Receipt>(items, page, pageSize, totalCount);
    }

    public async Task<Receipt?> GetByIdAsync(int shopId, int id)
    {
        return await db.Receipts.AsNoTracking().Include(r => r.Items).Include(r => r.Volume)
            .Where(r => r.Volume!.ShopId == shopId)
            .SingleOrDefaultAsync(r => r.Id == id);
    }

    public async Task<Receipt?> UpdateAsync(int shopId, int id, UpdateReceiptRequest request)
    {
        var receipt = await db.Receipts.Include(r => r.Items).Include(r => r.Volume)
            .Where(r => r.Volume!.ShopId == shopId)
            .SingleOrDefaultAsync(r => r.Id == id);
        if (receipt is null)
        {
            return null;
        }

        receipt.CustomerName = request.CustomerName?.Trim() ?? string.Empty;
        receipt.CustomerPhone = request.CustomerPhone;
        receipt.Instructions = request.Instructions;
        receipt.Price = request.Price;
        receipt.PaymentStatus = request.PaymentStatus;
        receipt.DueDate = request.DueDate;
        receipt.Status = request.Status;
        receipt.UpdatedAt = DateTime.UtcNow;

        receipt.Items.Clear();
        foreach (var item in request.Items)
        {
            receipt.Items.Add(new ReceiptItem
            {
                ClothingType = item.ClothingType,
                Color = item.Color,
                Quantity = item.Quantity,
            });
        }

        await db.SaveChangesAsync();
        return await GetByIdAsync(shopId, id);
    }
}
