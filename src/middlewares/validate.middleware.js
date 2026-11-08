import { z, ZodError } from "zod";

export const validate = (schema) => {
    return async (req, res, next) => {
        try {
            await schema.parseAsync({
                body: req.body,
                query: req.query,
                params: req.params,
            });
            next();
        } catch (error) {
            if (error instanceof ZodError) {
                return res.status(400).json({
                    success: false,
                    message: "Validation Error",
                    errors: error.errors.map((err) => ({
                        field: err.path.slice(1).join("."),
                        message: err.message,
                    })),
                });
            }
            return res.status(500).json({ success: false, message: "Internal validation error" });
        }
    };
};

// Zod Schema for RAG Agent Question
export const askAgentSchema = z.object({
    body: z.object({
        contractId: z.string({ required_error: "contractId is required" }).uuid("Invalid contract ID format"),
        prompt: z.string({ required_error: "prompt is required" }).trim().min(3, "Prompt must be at least 3 characters"),
    }),
});