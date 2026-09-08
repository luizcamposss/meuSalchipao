using System;
using Microsoft.EntityFrameworkCore.Migrations;

#nullable disable

namespace backend.Migrations
{
    /// <inheritdoc />
    public partial class SetProductPrice : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("0b8a3f6e-1c2d-4e5f-8a9b-000000000001"),
                column: "Price",
                value: 5.00m);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.UpdateData(
                table: "products",
                keyColumn: "Id",
                keyValue: new Guid("0b8a3f6e-1c2d-4e5f-8a9b-000000000001"),
                column: "Price",
                value: 0.01m);
        }
    }
}
