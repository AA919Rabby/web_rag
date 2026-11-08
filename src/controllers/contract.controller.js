import fs from "node:fs";
import { Contract } from "../models/contract.model.js";
import { Chunk } from "../models/chunk.model.js";
import { parsePdfToChunks } from "../utils/pdfParser.js";
import { generateEmbedding } from "../utils/ai.js";


export const uploadAndIndexContract = async (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({
                success: false,
                message: "Upload a document file"
            });
        }
        const filePath = req.file.path;
        try {
            const { chunks } = await parsePdfToChunks(filePath);
            const contract = await Contract.create({
                userId: req.user ? (req.user.id || req.user._id) : null,
                filename: req.file.originalname,
                filePath: filePath,
                fileSize: req.file.size,
            });
            let indexedCount = 0;
            // Replace the sequential for loop with Promise.all:
            await Promise.all(
                chunks.map(async (chunk) => {
                    const embedding = await generateEmbedding(chunk.content);
                    return Chunk.create({
                        contractId: contract.id || contract._id,
                        content: chunk.content,
                        pageNumber: chunk.pageNumber,
                        clauseHeader: chunk.clauseHeader,
                        embedding
                    });
                })
            );
            return res.status(201).json({
                success: true,
                message: `Contract uploaded and successfully indexed ${indexedCount} vector chunks!`,
                data: contract
            });
        } catch (error) {
            console.log("Failed to analysis", error);
            return res.status(500).json({
                success: false,
                message: "Failed to analysis"
            });
        }
    } catch (error) {
        console.log("An unexpected error occured", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
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