
import fs from "node:fs";
import { PDFParse } from "pdf-parse";

export const parsePdfToChunks = async (filePath) => {
    try {
        const dataBuffer = fs.readFileSync(filePath);

        const parser = new PDFParse({ data: dataBuffer });
        const parsed = await parser.getText();

        const fullText = parsed.text || "";

        // Simple paragraph / clause chunking (approx 500 characters per chunk)
        const rawParagraphs = fullText.split(/\n\s*\n/).filter((p) => p.trim().length > 50);

        const chunks = rawParagraphs.map((para, index) => ({
            content: para.trim(),
            pageNumber: Math.floor(index / 3) + 1,
            clauseHeader: `Clause section ${index + 1}`,
        }));

        return {
            totalText: fullText,
            chunks: chunks.length > 0 ? chunks : [{ content: fullText.slice(0, 1000), pageNumber: 1, clauseHeader: "General" }],
        };
    } catch (error) {
        console.error("PDF Parsing Error:", error);
        throw new Error("Failed to parse PDF document.");
    }
};
