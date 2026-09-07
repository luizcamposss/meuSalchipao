using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddEventSettings : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.CreateTable(
                name: "event_settings",
                columns: table => new
                {
                    Id = table.Column<Guid>(type: "char(36)", nullable: false, collation: "ascii_general_ci"),
                    SalesOpenAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    SalesCloseAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    RedemptionOpensAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    ForcedPhase = table.Column<string>(type: "varchar(20)", maxLength: 20, nullable: false)
                        .Annotation("MySql:CharSet", "utf8mb4"),
                    UpdatedAt = table.Column<DateTime>(type: "datetime(6)", nullable: false),
                    UpdatedBy = table.Column<Guid>(type: "char(36)", nullable: true, collation: "ascii_general_ci")
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_event_settings", x => x.Id);
                })
                .Annotation("MySql:CharSet", "utf8mb4");

            migrationBuilder.InsertData(
                table: "event_settings",
                columns: new[] { "Id", "ForcedPhase", "RedemptionOpensAt", "SalesCloseAt", "SalesOpenAt", "UpdatedAt", "UpdatedBy" },
                values: new object[] { new Guid("11111111-0000-0000-0000-000000000001"), "Auto", new DateTime(2026, 9, 17, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 9, 14, 23, 59, 0, 0, DateTimeKind.Utc), new DateTime(2026, 9, 8, 0, 0, 0, 0, DateTimeKind.Utc), new DateTime(2026, 1, 1, 0, 0, 0, 0, DateTimeKind.Utc), null });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "event_settings");
        }
    }
}
