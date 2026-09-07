using System.ComponentModel.DataAnnotations;

namespace backend.Modules.Auth.Contracts;

public record LoginRequest
{
    [Required(ErrorMessage = "The email address is mandatory.")]
    [EmailAddress(ErrorMessage = "The email format is invalid.")]
    [StringLength(191, ErrorMessage = "The email cannot exceed 191 characters.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "The password is mandatory.")]
    [StringLength(128, ErrorMessage = "The password must be between 8 and 128 characters long.")]
    public string Password { get; set; } = null!;
}