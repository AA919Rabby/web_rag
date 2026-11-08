import { Router } from "express";
import { uploadAndIndexContract, getUserContracts } from "../controllers/contract.controller.js";
import { uploadContractPdf } from "../middlewares/upload.middleware.js";
import { authLimiter } from "../middlewares/rateLimiter.js";


const router = Router();

router.post("/upload", authLimiter, uploadContractPdf, uploadAndIndexContract);
router.get("/get", getUserContracts);

export default router;