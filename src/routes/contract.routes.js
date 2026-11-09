import { Router } from "express";
import { uploadAndIndexContract, getUserContracts } from "../controllers/contract.controller.js";
import { uploadContractPdf } from "../middlewares/upload.middleware.js";

const router = Router();

// Wrapper to return JSON instead of raw HTML on upload errors
const handleUpload = (req, res, next) => {
    uploadContractPdf(req, res, (err) => {
        if (err) {
            return res.status(400).json({
                success: false,
                message: err.message || "File upload failed"
            });
        }
        next();
    });
};

router.post("/upload", handleUpload, uploadAndIndexContract);
router.get("/get", getUserContracts);

export default router;