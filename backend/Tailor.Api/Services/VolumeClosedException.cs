namespace Tailor.Api.Services;

// Thrown when a receipt is being saved against a volume that was closed by a
// concurrent "start new volume" call in the instant between reading the
// active volume and assigning the number.
public class VolumeClosedException : Exception
{
    public VolumeClosedException() : base("The active volume changed while saving. Please try again.")
    {
    }
}

public class NoActiveVolumeException : Exception
{
    public NoActiveVolumeException() : base("No active volume. Start a volume before creating receipts.")
    {
    }
}
