import { Router } from "express";
import { askContractAgent } from "../controllers/rag.controller.js";
import { validate, askAgentSchema } from "../middlewares/validate.middleware.js";


const router = Router();


router.post("/ask", validate(askAgentSchema), askContractAgent);

export default router;