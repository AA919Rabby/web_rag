import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const uploadDir = "uploads/";
if (!fs.existsSync(uploadDir)) {
    fs.mkdirSync(uploadDir, { recursive: true });
}

const storage = multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadDir),
    filename: (_req, file, cb) => {
        const ext = path.extname(file.originalname);
        // Kept your custom naming convention but cleanly applied the matching file extension
        cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

// A comprehensive map of standard document MIME types that RAG systems typically process
const ALLOWED_MIME_TYPES = new Set([
    "application/pdf",                                                        // PDF
    "text/plain", "text/markdown", "text/csv",                                // Plain Text & Markdown / CSVs
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document", // Word (.docx)
    "application/msword",                                                     // Word (.doc)
    "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",      // Excel (.xlsx)
    "application/vnd.ms-excel",                                               // Excel (.xls)
    "application/vnd.openxmlformats-officedocument.presentationml.presentation",// PowerPoint (.pptx)
    "application/vnd.ms-powerpoint",                                          // PowerPoint (.ppt)
    "image/png", "image/jpeg", "image/jpg", "image/webp"                      // Images (For OCR processing)
]);

const fileFilter = (_req, file, cb) => {
    if (ALLOWED_MIME_TYPES.has(file.mimetype)) {
        cb(null, true);
    } else {
        cb(new Error("Unsupported file format! Please upload a valid document or image for analysis."), false);
    }
};

export const uploadContractPdf = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024 }, // Increased limit slightly to 25MB (Excel/PowerPoint can be large)
    fileFilter,
}).single("contract"); // Note: You can keep "contract" as the field name, or rename it later to "document"
