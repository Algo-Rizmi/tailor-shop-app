using Microsoft.EntityFrameworkCore;
using Tailor.Api.Models;

namespace Tailor.Api.Data;

public class AppDbContext(DbContextOptions<AppDbContext> options) : DbContext(options)
{
    public DbSet<Shop> Shops => Set<Shop>();
    public DbSet<User> Users => Set<User>();
    public DbSet<Receipt> Receipts => Set<Receipt>();
    public DbSet<ReceiptItem> ReceiptItems => Set<ReceiptItem>();
    public DbSet<Volume> Volumes => Set<Volume>();

    protected override void OnModelCreating(ModelBuilder modelBuilder)
    {
        modelBuilder.Entity<Shop>(entity =>
        {
            entity.Property(s => s.Name).HasMaxLength(200);
        });

        modelBuilder.Entity<User>(entity =>
        {
            entity.HasIndex(u => u.Email).IsUnique();
            entity.HasIndex(u => u.GoogleSubjectId).IsUnique();
            entity.Property(u => u.Email).HasMaxLength(320);
            entity.Property(u => u.GoogleSubjectId).HasMaxLength(64);
            entity.HasOne(u => u.Shop).WithMany().HasForeignKey(u => u.ShopId).OnDelete(DeleteBehavior.Restrict);
        });

        modelBuilder.Entity<Volume>(entity =>
        {
            entity.Property(v => v.Label).HasMaxLength(100);
            entity.HasIndex(v => v.ShopId);
        });

        modelBuilder.Entity<Receipt>(entity =>
        {
            // Numbers are only unique within their own volume — different
            // volumes are independent books and may reuse/overlap ranges.
            entity.HasIndex(r => new { r.VolumeId, r.ReceiptNumber }).IsUnique();
            entity.HasOne(r => r.Volume).WithMany().HasForeignKey(r => r.VolumeId).OnDelete(DeleteBehavior.Restrict);
            entity.Property(r => r.CustomerName).HasMaxLength(200);
            entity.Property(r => r.CustomerPhone).HasMaxLength(50);
            entity.Property(r => r.Price).HasColumnType("decimal(10,2)");
            entity.Property(r => r.Status).HasConversion<string>().HasMaxLength(20);
            entity.Property(r => r.PaymentStatus).HasConversion<string>().HasMaxLength(20);
            entity.HasMany(r => r.Items).WithOne().HasForeignKey(i => i.ReceiptId).OnDelete(DeleteBehavior.Cascade);
        });

        modelBuilder.Entity<ReceiptItem>(entity =>
        {
            entity.Property(i => i.ClothingType).HasMaxLength(100);
            entity.Property(i => i.Color).HasMaxLength(50);
        });
    }
}
