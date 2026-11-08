import { query } from "../config/db.js";

const formatContract = (row) => {
    if (!row) return null;
    return {
        id: row.id,
        userId: row.user_id,
        filename: row.filename,
        filePath: row.file_path,
        fileSize: row.file_size,
        status: row.status,
        riskSummary: row.risk_summary || {},
        createdAt: row.created_at,
    };
};

let tableInitialized = false;

export const ContractModel = {
    async initTable() {
        await query(`
            CREATE TABLE IF NOT EXISTS contracts (
                id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
                user_id UUID,
                filename VARCHAR(255) NOT NULL,
                file_path TEXT NOT NULL,
                file_size INTEGER NOT NULL,
                status VARCHAR(50) DEFAULT 'INDEXED',
                risk_summary JSONB DEFAULT '{}',
                created_at TIMESTAMPTZ DEFAULT NOW()
            );
            CREATE INDEX IF NOT EXISTS idx_contracts_user ON contracts(user_id);
        `);
        tableInitialized = true;
    },

    async create({ userId, filename, filePath, fileSize }) {
        if (!tableInitialized) {
            await this.initTable();
        }
        const sql = `
            INSERT INTO contracts (user_id, filename, file_path, file_size, status, risk_summary)
            VALUES ($1, $2, $3, $4, 'INDEXED', '{}')
            RETURNING *;
        `;
        const { rows } = await query(sql, [userId, filename, filePath, fileSize]);
        return formatContract(rows[0]);
    },

    async findById(id) {
        if (!tableInitialized) {
            await this.initTable();
        }
        const sql = `SELECT * FROM contracts WHERE id = $1 LIMIT 1;`;
        const { rows } = await query(sql, [id]);
        return formatContract(rows[0]);
    },

    async findByUser(userId) {
        if (!tableInitialized) {
            await this.initTable();
        }
        const sql = `SELECT * FROM contracts WHERE user_id = $1 ORDER BY created_at DESC;`;
        const { rows } = await query(sql, [userId]);
        return rows.map(formatContract);
    },

    async updateRiskSummary(id, riskSummary) {
        if (!tableInitialized) {
            await this.initTable();
        }
        const sql = `
            UPDATE contracts
            SET risk_summary = $1, status = 'AUDITED'
            WHERE id = $2
            RETURNING *;
        `;
        const { rows } = await query(sql, [JSON.stringify(riskSummary), id]);
        return formatContract(rows[0]);
    },

    async delete(id) {
        if (!tableInitialized) {
            await this.initTable();
        }
        const sql = `DELETE FROM contracts WHERE id = $1 RETURNING *;`;
        const { rows } = await query(sql, [id]);
        return formatContract(rows[0]);
    }
};

export const Contract = ContractModel;