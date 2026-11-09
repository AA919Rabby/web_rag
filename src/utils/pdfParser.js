import fs from "node:fs";
import path from "node:path";
import { PDFParse } from "pdf-parse";

// Allowed text and document formats
const TEXT_EXTENSIONS = new Set([
    ".txt", ".md", ".csv", ".json", ".js", ".ts", ".html",
    ".css", ".py", ".sql", ".xml", ".yaml", ".yml", ".env"
]);

const UNSUPPORTED_IMAGE_BINARY = new Set([
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".bmp", ".svg",
    ".zip", ".tar", ".gz", ".exe", ".bin", ".mp4", ".mp3"
]);

// Split text into chunks & sanitize null characters for Postgres
const chunkText = (rawText, chunkSize = 800, overlap = 100) => {
    const text = typeof rawText === "string"
        ? rawText
        : (rawText?.text || String(rawText || ""));

    // Remove any 0x00 null bytes that break Postgres UTF-8 encoding
    const sanitized = text.replace(/\0/g, "").replace(/\s+/g, " ").trim();
    if (!sanitized) return [];

    const chunks = [];
    let start = 0;

    while (start < sanitized.length) {
        const end = Math.min(start + chunkSize, sanitized.length);
        const chunk = sanitized.slice(start, end);

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
    const ext = path.extname(filePath).toLowerCase();
    const filename = path.basename(filePath);

    // 1. Explicitly check for image and binary files
    if (UNSUPPORTED_IMAGE_BINARY.has(ext)) {
        throw new Error(`File '${filename}' is an image/binary file and cannot be parsed. Please upload PDFs, Word, or text documents.`);
    }

    let fullText = "";

    try {
        if (ext === ".pdf") {
            const dataBuffer = fs.readFileSync(filePath);
            const uint8Array = new Uint8Array(dataBuffer);
            const parser = new PDFParse(uint8Array);
            const data = await parser.getText();
            fullText = typeof data === "string" ? data : (data?.text || "");
        } else if (TEXT_EXTENSIONS.has(ext)) {
            fullText = fs.readFileSync(filePath, "utf-8");
        } else {
            // Unknown or unreadable file extension
            throw new Error(`The file format '${ext}' is not supported. Please upload a PDF, Word, or plain text document.`);
        }

        const chunks = chunkText(fullText);

        if (chunks.length === 0) {
            throw new Error(`Document '${filename}' appears to be empty or contains no readable text.`);
        }

        return {
            totalText: fullText,
            chunks,
        };
    } catch (error) {
        // Re-throw with clean message
        throw new Error(error.message);
    }
};