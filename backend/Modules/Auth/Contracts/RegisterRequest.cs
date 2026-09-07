using System.ComponentModel.DataAnnotations;
using backend.Modules.Auth.Domain;

namespace backend.Modules.Auth.Contracts;

public record RegisterRequest
{
    [Required(ErrorMessage = "The name is mandatory.")]
    [StringLength(100, MinimumLength = 3, ErrorMessage = "The name must be between 3 and 100 characters long.")]
    public string Name { get; set; } = null!;

    [Required(ErrorMessage = "The email address is mandatory.")]
    [EmailAddress(ErrorMessage = "The email format is invalid.")]
    [StringLength(191, ErrorMessage = "The email cannot exceed 191 characters.")]
    public string Email { get; set; } = null!;

    [Required(ErrorMessage = "Registration is mandatory.")]
    [StringLength(8, ErrorMessage = "The registration number must have a maximum of 8 characters.")]
    public string Enrollment { get; set; } = null!;

    [EnumDataType(typeof(Shift), ErrorMessage = "Invalid turn.")]
    public Shift Shift { get; set; }

    [Required(ErrorMessage = "The password is mandatory.")]
    [StringLength(128, MinimumLength = 8, ErrorMessage = "The password must be between 8 and 128 characters long.")]
    public string Password { get; set; } = null!;

}