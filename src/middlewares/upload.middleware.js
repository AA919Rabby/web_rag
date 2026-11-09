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
        cb(null, `doc-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
});

// Allow ANY file format
const fileFilter = (_req, _file, cb) => {
    cb(null, true);
};

export const uploadContractPdf = multer({
    storage,
    limits: { fileSize: 25 * 1024 * 1024, files: 5 }, // Max 25MB per file, up to 5 files
    fileFilter,
}).any(); // Accepts any field name and any file format