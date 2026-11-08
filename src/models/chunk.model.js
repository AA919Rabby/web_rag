import { query } from "../config/db.js";

let tableInitialized = false;

const extractVector = (raw) => {
    if (!raw) return [];
    if (Array.isArray(raw)) return raw;
    if (Array.isArray(raw.values)) return raw.values;
    if (Array.isArray(raw.embedding?.values)) return raw.embedding.values;
    if (Array.isArray(raw.embedding)) return raw.embedding;
    return [];
};

export const ChunkModel = {
    async initTable() {
        await query(`
            CREATE EXTENSION IF NOT EXISTS vector;
            CREATE TABLE IF NOT EXISTS contract_chunks (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                contract_id UUID NOT NULL REFERENCES contracts(id) ON DELETE CASCADE,
                content TEXT NOT NULL,
                page_number INTEGER,
                clause_header TEXT DEFAULT 'General Clause',
                embedding vector(1536),
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            -- Automatically update existing table column from 768 to 1536
            ALTER TABLE contract_chunks ALTER COLUMN embedding TYPE vector(1536);
            CREATE INDEX IF NOT EXISTS idx_chunks_contract ON contract_chunks(contract_id);
        `);
        tableInitialized = true;
    },

    async create({ contractId, content, pageNumber, clauseHeader, embedding }) {
        if (!tableInitialized) {
            await this.initTable();
        }

        const vectorValues = extractVector(embedding);
        const vectorString = vectorValues.length > 0 ? `[${vectorValues.join(",")}]` : null;

        const sql = `
            INSERT INTO contract_chunks (contract_id, content, page_number, clause_header, embedding)
            VALUES ($1, $2, $3, $4, $5)
            RETURNING id, page_number, clause_header;
        `;
        const { rows } = await query(sql, [
            contractId,
            content,
            pageNumber,
            clauseHeader || "General Clause",
            vectorString,
        ]);
        return rows[0];
    },

    async searchSimilar({ contractId, queryEmbedding, limit = 4 }) {
        if (!tableInitialized) {
            await this.initTable();
        }

        const vectorValues = extractVector(queryEmbedding);

        if (!vectorValues.length) {
            console.error("Embedding generation failed or returned empty:", queryEmbedding);
            throw new Error("Embedding vector is empty or invalid.");
        }

        const vectorString = `[${vectorValues.join(",")}]`;
        const sql = `
            SELECT
                id,
                content,
                page_number,
                clause_header,
                1 - (embedding <=> $1::vector) AS similarity_score
            FROM contract_chunks
            WHERE contract_id = $2 AND embedding IS NOT NULL
            ORDER BY embedding <=> $1::vector ASC
            LIMIT $3;
        `;
        const { rows } = await query(sql, [vectorString, contractId, limit]);
        return rows;
    },
};

export const Chunk = ChunkModel;