using Microsoft.EntityFrameworkCore;
using Tailor.Api.Data;
using Tailor.Api.Models;

namespace Tailor.Api.Services;

public class VolumeService(AppDbContext db)
{
    public async Task<Volume?> GetCurrentAsync(int shopId)
    {
        return await db.Volumes.AsNoTracking().SingleOrDefaultAsync(v => v.ShopId == shopId && v.IsActive);
    }

    public async Task<List<Volume>> ListAsync(int shopId)
    {
        return await db.Volumes.AsNoTracking().Where(v => v.ShopId == shopId)
            .OrderByDescending(v => v.Id).ToListAsync();
    }

    // Closes whatever volume is currently active for this shop (if any) and
    // opens a new one starting from the given number. One-way: once closed, a
    // volume can't receive new receipts again — matches "exit the volume,
    // start a new chapter".
    public async Task<Volume> StartNewVolumeAsync(int shopId, int startingNumber, string? label)
    {
        var strategy = db.Database.CreateExecutionStrategy();
        return await strategy.ExecuteAsync(async () =>
        {
            await using var transaction = await db.Database.BeginTransactionAsync();

            var current = await db.Volumes.SingleOrDefaultAsync(v => v.ShopId == shopId && v.IsActive);
            if (current is not null)
            {
                current.IsActive = false;
                current.ClosedAt = DateTime.UtcNow;
            }

            var volumeCount = await db.Volumes.CountAsync(v => v.ShopId == shopId);

            var volume = new Volume
            {
                ShopId = shopId,
                Label = string.IsNullOrWhiteSpace(label) ? $"Volume {volumeCount + 1}" : label.Trim(),
                StartingNumber = startingNumber,
                NextNumber = startingNumber,
                IsActive = true,
                CreatedAt = DateTime.UtcNow,
            };

            db.Volumes.Add(volume);
            await db.SaveChangesAsync();
            await transaction.CommitAsync();

            return volume;
        });
    }
}
