import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

// Split text into manageable chunks
const chunkText = (rawText, chunkSize = 800, overlap = 100) => {
    // Ensure rawText is always a string
    const text = typeof rawText === "string"
        ? rawText
        : (rawText?.text || String(rawText || ""));

    const cleanText = text.replace(/\s+/g, " ").trim();
    if (!cleanText) return [];

    const chunks = [];
    let start = 0;

    while (start < cleanText.length) {
        const end = Math.min(start + chunkSize, cleanText.length);
        const chunk = cleanText.slice(start, end);

        const match = chunk.match(/^([A-Z0-9\.\-\s]{3,40}:)/);
        const clauseHeader = match ? match[1].trim() : "General Excerpt";

        chunks.push({
            content: chunk,
            pageNumber: Math.floor(start / 1500) + 1,
            clauseHeader,
        });

        start += chunkSize - overlap;
    }

    return chunks;
};

export const parsePdfToChunks = async (filePath) => {
    try {
        const ext = path.extname(filePath).toLowerCase();
        let fullText = "";

        if (ext === ".pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const uint8Array = new Uint8Array(dataBuffer);
            const parser = new PDFParse(uint8Array);
            const data = await parser.getText();

            // Extract the string whether data is an object or a string
            fullText = typeof data === "string" ? data : (data?.text || "");
        } else {
            // For code, text, json, csv, markdown, etc.
            fullText = fs.readFileSync(filePath, "utf-8");
        }

        const chunks = chunkText(fullText);

        return {
            totalText: fullText,
            chunks: chunks.length > 0 ? chunks : [
                { content: fullText || "Empty document", pageNumber: 1, clauseHeader: "General Excerpt" }
            ],
        };
    } catch (error) {
        console.error("Document Parsing Error:", error.message);
        throw new Error(`Failed to parse document: ${error.message}`);
    }
};