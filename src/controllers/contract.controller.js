import { Contract } from "../models/contract.model.js";
import { Chunk } from "../models/chunk.model.js";
import { parsePdfToChunks } from "../utils/pdfParser.js";
import { generateEmbedding } from "../utils/ai.js";

export const uploadAndIndexContract = async (req, res) => {
    try {
        const files = req.files || [];

        if (files.length === 0) {
            return res.status(400).json({
                success: false,
                message: "Please select at least 1 file (up to 5)."
            });
        }

        if (files.length > 5) {
            return res.status(400).json({
                success: false,
                message: "Maximum 5 files allowed at once."
            });
        }

        const userId = req.user ? (req.user.id || req.user._id) : null;
        const uploadedContracts = [];
        let totalIndexedChunks = 0;

        for (const file of files) {
            // Parse chunks
            const { chunks } = await parsePdfToChunks(file.path);

            const contract = await Contract.create({
                userId,
                filename: file.originalname,
                filePath: file.path,
                fileSize: file.size,
            });

            // Index chunks
            for (const chunk of chunks) {
                const embedding = await generateEmbedding(chunk.content);
                await Chunk.create({
                    contractId: contract.id || contract._id,
                    content: chunk.content,
                    pageNumber: chunk.pageNumber,
                    clauseHeader: chunk.clauseHeader,
                    embedding
                });
                totalIndexedChunks++;
            }

            uploadedContracts.push(contract);
        }

        return res.status(201).json({
            success: true,
            message: `Successfully indexed ${uploadedContracts.length} document(s) with ${totalIndexedChunks} vector chunks!`,
            data: uploadedContracts
        });

    } catch (error) {
        console.error("Failed to analyze documents:", error);
        return res.status(500).json({
            success: false,
            message: error.message || "Failed to analyze documents"
        });
    }
};


export const getUserContracts = async (req, res) => {
    try {
        const userId = req.user ? (req.user.id || req.user._id) : null;
        if (!userId) {
            return res.status(200).json({
                success: true,
                count: 0,
                data: []
            });
        }
        const contract = await Contract.findByUser(userId);
        return res.status(200).json({
            success: true,
            count: contract.length,
            data: contract
        });
    } catch (error) {
        console.log("Failed to fetching contract", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};