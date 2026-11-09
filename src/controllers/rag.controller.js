import { Chunk } from "../models/chunk.model.js";
import { Contract } from "../models/contract.model.js";
import { generateEmbedding, openrouter } from "../utils/ai.js";

export const askContractAgent = async (req, res) => {
    try {
        const { contractId, contractIds, prompt } = req.body;
        const targetIds = contractIds || (contractId ? [contractId] : []);

        if (!targetIds.length || !prompt) {
            return res.status(400).json({
                success: false,
                message: "ContractId and Prompt cannot be empty"
            });
        }

        const queryVector = await generateEmbedding(prompt);
        const relevantChunks = await Chunk.searchSimilar({
            contractIds: targetIds,
            queryEmbedding: queryVector,
            limit: 5
        });

        console.log(`🔍 Found ${relevantChunks.length} relevant chunks for this question.`);

        if (!relevantChunks || relevantChunks.length === 0) {
            return res.status(200).json({
                success: true,
                data: {
                    answer: "No relevant information found across your uploaded document(s).",
                    citations: []
                }
            });
        }

        const context = relevantChunks
            .map((c) => `[Document: ${c.document_name || "Contract"} | Page ${c.page_number} - ${c.clause_header}]\n${c.content}`)
            .join("\n\n---\n\n");

        const chatClient = openrouter.chat.completions || openrouter.chat;
        const completion = await chatClient.create({
            model: process.env.OPENROUTER_MODEL,
            messages: [
                {
                    role: "system",
                    content: "You are an expert AI Assistant. Answer the question using ONLY the provided excerpts. Cite the Document name and Page number for your claims."
                },
                {
                    role: "user",
                    content: `Context:\n"""\n${context}\n"""\n\nQuestion: "${prompt}"`
                }
            ],
            temperature: 0.1
        });

        const answer = completion.choices[0].message.content;
        return res.status(200).json({
            success: true,
            data: {
                answer,
                citations: relevantChunks.map((c) => ({
                    document: c.document_name,
                    page: c.page_number,
                    clause: c.clause_header
                })),
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