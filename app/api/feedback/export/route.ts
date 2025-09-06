import prisma from "@/lib/db";
import { toCSV } from "@/lib/csv";
import { NextResponse } from "next/server";
import * as XLSX from "xlsx";
import jsPDF from "jspdf";
import "jspdf-autotable";

// Extend jsPDF type to include autoTable
interface AutoTableOptions {
  head: string[][];
  body: string[][];
  startY: number;
  styles: { fontSize: number };
  headStyles: { fillColor: number[] };
}

interface jsPDFWithAutoTable extends jsPDF {
  autoTable: (options: AutoTableOptions) => void;
}

export async function GET(req: Request) {
  try {
    const { searchParams } = new URL(req.url);
    const format = searchParams.get("format") || "csv";
    const days = Number(searchParams.get("days") || 30);
    const category = searchParams.get("category") || "all";

    // Build where clause
    const where: Record<string, unknown> = {};

    if (days > 0) {
      const startDate = new Date();
      startDate.setDate(startDate.getDate() - days);
      where.createdAt = {
        gte: startDate,
      };
    }

    if (category !== "all") {
      where.category = category;
    }

    const items = await prisma.feedback.findMany({
      where,
      orderBy: { createdAt: "desc" },
    });

    const rows = items.map((i) => ({
      id: i.id,
      createdAt: i.createdAt.toISOString(),
      name: i.name,
      contact: i.contact ?? "",
      email: i.email ?? "",
      phone: i.phone ?? "",
      rating: i.rating ?? "",
      comments: i.comments ?? "",
      location: i.location ?? "",
      category: i.category ?? "",
      visitDate: i.visitDate?.toISOString() ?? "",
      isAnonymous: i.isAnonymous ? "Yes" : "No",
      sentiment: i.sentiment ?? "",
      status: i.status,
    }));

    const headers = [
      "ID",
      "Created At",
      "Name",
      "Contact",
      "Email",
      "Phone",
      "Rating",
      "Comments",
      "Location",
      "Category",
      "Visit Date",
      "Anonymous",
      "Sentiment",
      "Status",
    ];

    switch (format.toLowerCase()) {
      case "csv":
        const csv = toCSV(rows, headers);
        return new Response(csv, {
          headers: {
            "Content-Type": "text/csv; charset=utf-8",
            "Content-Disposition": `attachment; filename="feedback-${
              new Date().toISOString().split("T")[0]
            }.csv"`,
          },
        });

      case "excel":
        const worksheet = XLSX.utils.json_to_sheet(rows);
        const workbook = XLSX.utils.book_new();
        XLSX.utils.book_append_sheet(workbook, worksheet, "Feedback");

        // Add summary sheet
        const summaryData = [
          ["Total Feedback", items.length],
          [
            "Average Rating",
            items.filter((i) => i.rating).length > 0
              ? (
                  items
                    .filter((i) => i.rating)
                    .reduce((sum, i) => sum + (i.rating || 0), 0) /
                  items.filter((i) => i.rating).length
                ).toFixed(2)
              : "N/A",
          ],
          [
            "Positive Sentiment",
            items.filter((i) => i.sentiment === "positive").length,
          ],
          [
            "Negative Sentiment",
            items.filter((i) => i.sentiment === "negative").length,
          ],
          [
            "Neutral Sentiment",
            items.filter((i) => i.sentiment === "neutral").length,
          ],
        ];
        const summarySheet = XLSX.utils.aoa_to_sheet(summaryData);
        XLSX.utils.book_append_sheet(workbook, summarySheet, "Summary");

        const excelBuffer = XLSX.write(workbook, {
          type: "buffer",
          bookType: "xlsx",
        });
        return new Response(excelBuffer, {
          headers: {
            "Content-Type":
              "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            "Content-Disposition": `attachment; filename="feedback-${
              new Date().toISOString().split("T")[0]
            }.xlsx"`,
          },
        });

      case "pdf":
        const doc = new jsPDF();

        // Add title
        doc.setFontSize(20);
        doc.text("Feedback Report", 14, 22);

        // Add summary
        doc.setFontSize(12);
        doc.text(`Generated: ${new Date().toLocaleDateString()}`, 14, 35);
        doc.text(`Total Feedback: ${items.length}`, 14, 42);
        doc.text(`Date Range: Last ${days} days`, 14, 49);
        if (category !== "all") {
          doc.text(`Category: ${category}`, 14, 56);
        }

        // Add table
        const tableData = rows.map((row) => [
          row.name,
          row.rating ? row.rating.toString() : "N/A",
          row.category || "N/A",
          row.sentiment || "neutral",
          row.status,
          row.comments?.substring(0, 50) +
            (row.comments?.length > 50 ? "..." : "") || "N/A",
        ]);

        (doc as jsPDFWithAutoTable).autoTable({
          head: [
            ["Name", "Rating", "Category", "Sentiment", "Status", "Comments"],
          ],
          body: tableData,
          startY: 65,
          styles: { fontSize: 8 },
          headStyles: { fillColor: [59, 130, 246] },
        });

        const pdfBuffer = doc.output("arraybuffer");
        return new Response(pdfBuffer, {
          headers: {
            "Content-Type": "application/pdf",
            "Content-Disposition": `attachment; filename="feedback-${
              new Date().toISOString().split("T")[0]
            }.pdf"`,
          },
        });

      default:
        return NextResponse.json(
          { error: "Unsupported format" },
          { status: 400 }
        );
    }
  } catch (error) {
    console.error("Export error:", error);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
