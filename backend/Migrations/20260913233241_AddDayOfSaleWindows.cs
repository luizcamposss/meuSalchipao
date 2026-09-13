using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class AddDayOfSaleWindows : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<int>(
                name: "AfternoonSaleCap",
                table: "event_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "AfternoonSaleClosesAt",
                table: "event_settings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "AfternoonSaleCount",
                table: "event_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "AfternoonSaleOpensAt",
                table: "event_settings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "MorningSaleCap",
                table: "event_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "MorningSaleClosesAt",
                table: "event_settings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.AddColumn<int>(
                name: "MorningSaleCount",
                table: "event_settings",
                type: "int",
                nullable: false,
                defaultValue: 0);

            migrationBuilder.AddColumn<DateTime>(
                name: "MorningSaleOpensAt",
                table: "event_settings",
                type: "datetime(6)",
                nullable: false,
                defaultValue: new DateTime(1, 1, 1, 0, 0, 0, 0, DateTimeKind.Unspecified));

            migrationBuilder.UpdateData(
                table: "event_settings",
                keyColumn: "Id",
                keyValue: new Guid("11111111-0000-0000-0000-000000000001"),
                columns: new[] { "AfternoonSaleCap", "AfternoonSaleClosesAt", "AfternoonSaleCount", "AfternoonSaleOpensAt", "MorningSaleCap", "MorningSaleClosesAt", "MorningSaleCount", "MorningSaleOpensAt" },
                values: new object[] { 50, new DateTime(2026, 9, 17, 20, 0, 0, 0, DateTimeKind.Utc), 0, new DateTime(2026, 9, 17, 16, 0, 0, 0, DateTimeKind.Utc), 50, new DateTime(2026, 9, 17, 15, 0, 0, 0, DateTimeKind.Utc), 0, new DateTime(2026, 9, 17, 9, 0, 0, 0, DateTimeKind.Utc) });
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropColumn(
                name: "AfternoonSaleCap",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "AfternoonSaleClosesAt",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "AfternoonSaleCount",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "AfternoonSaleOpensAt",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "MorningSaleCap",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "MorningSaleClosesAt",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "MorningSaleCount",
                table: "event_settings");

            migrationBuilder.DropColumn(
                name: "MorningSaleOpensAt",
                table: "event_settings");
        }
    }
}
