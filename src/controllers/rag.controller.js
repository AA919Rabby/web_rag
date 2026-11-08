import { Chunk } from "../models/chunk.model.js";
import { Contract } from "../models/contract.model.js";
import { generateEmbedding, openrouter } from "../utils/ai.js";


export const askContractAgent = async (req, res) => {
    try {
        const { contractId, prompt } = req.body;
        if (!contractId || !prompt) {
            return res.status(400).json({
                success: false,
                message: "ContractId and Prompt cannot be empty"
            });
        }
        const contract = await Contract.findById(contractId);
        if (!contract) {
            return res.status(404).json({
                success: false,
                message: "Document not found"
            });
        }

        const queryVector = await generateEmbedding(prompt);
        const relevantChunks = await Chunk.searchSimilar({
            contractId,
            queryEmbedding: queryVector,
            limit: 4
        });

        console.log(`🔍 Found ${relevantChunks.length} relevant chunks for this question.`);

        if (!relevantChunks || relevantChunks.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    answer: "No relevant information found in the contract for your question. Please make sure the contract was uploaded after embeddings were fixed.",
                    citations: []
                }
            });
        }

        const context = relevantChunks
            .map((c) => `[Source: Page ${c.page_number} - ${c.clause_header}]\n${c.content}`)
            .join("\n\n---\n\n");

        const chatClient = openrouter.chat.completions || openrouter.chat;
        const completion = await chatClient.create({
            model: process.env.OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert Legal and Financial Contract Auditor. Answer the question accurately using ONLY the provided contract excerpts. Cite the exact Page number and Clause for every claim you make (e.g. [Source: Page 1 - Header])."
                },
                {
                    role: "user",
                    content: `Contract Context:\n"""\n${context}\n"""\n\nQuestion: "${prompt}"`
                }
            ],
            temperature: 0.1
        });

        const answer = completion.choices[0].message.content;
        return res.status(200).json({
            success: true,
            data: {
                answer,
                citations: relevantChunks.map((c) => ({ page: c.page_number, clause: c.clause_header })),
            }
        });
    } catch (error) {
        console.log("An unexpected error occur", error);
        return res.status(500).json({
            success: false,
            message: "Internal Server Error"
        });
    }
};