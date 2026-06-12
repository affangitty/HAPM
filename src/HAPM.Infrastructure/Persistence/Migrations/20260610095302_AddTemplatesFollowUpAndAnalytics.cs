using System;
using Microsoft.EntityFrameworkCore.Migrations;
using Npgsql.EntityFrameworkCore.PostgreSQL.Metadata;

#nullable disable

namespace HAPM.Infrastructure.Persistence.Migrations
{
    /// <inheritdoc />
    public partial class AddTemplatesFollowUpAndAnalytics : Migration
    {
        /// <inheritdoc />
        protected override void Up(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.AddColumn<bool>(
                name: "FollowUpReminderSent",
                table: "Prescriptions",
                type: "boolean",
                nullable: false,
                defaultValue: false);

            migrationBuilder.CreateTable(
                name: "PrescriptionTemplates",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    DoctorId = table.Column<int>(type: "integer", nullable: false),
                    Name = table.Column<string>(type: "character varying(100)", maxLength: 100, nullable: false),
                    Diagnosis = table.Column<string>(type: "character varying(1000)", maxLength: 1000, nullable: false),
                    Notes = table.Column<string>(type: "character varying(2000)", maxLength: 2000, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrescriptionTemplates", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrescriptionTemplates_Doctors_DoctorId",
                        column: x => x.DoctorId,
                        principalTable: "Doctors",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateTable(
                name: "PrescriptionTemplateItems",
                columns: table => new
                {
                    Id = table.Column<int>(type: "integer", nullable: false)
                        .Annotation("Npgsql:ValueGenerationStrategy", NpgsqlValueGenerationStrategy.IdentityByDefaultColumn),
                    PrescriptionTemplateId = table.Column<int>(type: "integer", nullable: false),
                    MedicineName = table.Column<string>(type: "character varying(200)", maxLength: 200, nullable: false),
                    Dosage = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    Frequency = table.Column<string>(type: "character varying(50)", maxLength: 50, nullable: false),
                    DurationDays = table.Column<int>(type: "integer", nullable: false),
                    Instructions = table.Column<string>(type: "character varying(300)", maxLength: 300, nullable: true),
                    CreatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: false),
                    UpdatedAtUtc = table.Column<DateTime>(type: "timestamp with time zone", nullable: true)
                },
                constraints: table =>
                {
                    table.PrimaryKey("PK_PrescriptionTemplateItems", x => x.Id);
                    table.ForeignKey(
                        name: "FK_PrescriptionTemplateItems_PrescriptionTemplates_Prescriptio~",
                        column: x => x.PrescriptionTemplateId,
                        principalTable: "PrescriptionTemplates",
                        principalColumn: "Id",
                        onDelete: ReferentialAction.Cascade);
                });

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionTemplateItems_PrescriptionTemplateId",
                table: "PrescriptionTemplateItems",
                column: "PrescriptionTemplateId");

            migrationBuilder.CreateIndex(
                name: "IX_PrescriptionTemplates_DoctorId_Name",
                table: "PrescriptionTemplates",
                columns: new[] { "DoctorId", "Name" },
                unique: true);
        }

        /// <inheritdoc />
        protected override void Down(MigrationBuilder migrationBuilder)
        {
            migrationBuilder.DropTable(
                name: "PrescriptionTemplateItems");

            migrationBuilder.DropTable(
                name: "PrescriptionTemplates");

            migrationBuilder.DropColumn(
                name: "FollowUpReminderSent",
                table: "Prescriptions");
        }
    }
}
