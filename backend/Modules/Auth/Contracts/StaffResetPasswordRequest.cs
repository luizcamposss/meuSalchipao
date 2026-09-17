using System.ComponentModel.DataAnnotations;

namespace backend.Modules.Auth.Contracts;

public record StaffResetPasswordRequest
{
    [Required(ErrorMessage = "The email address is mandatory.")]
    [EmailAddress(ErrorMessage = "The email format is invalid.")]
    [StringLength(191, ErrorMessage = "The email cannot exceed 191 characters.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "The new password is mandatory.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "The password must be between 8 and 128 characters long.")]
    public string NewPassword { get; set; } = null!;
}
