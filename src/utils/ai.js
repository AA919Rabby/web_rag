import OpenAI from "openai";


export const openrouter = new OpenAI({
    baseURL: "https://openrouter.ai/api/v1",
    apiKey: process.env.OPENROUTER_API_KEY,
    defaultHeaders: {
        "HTTP-Referer": "http://localhost:5000",
        "X-Title": "Legal & Financial Contract Analyzer"
    }
});


export const generateEmbedding = async (text) => {
    try {
        const response = await openrouter.embeddings.create({
            model: process.env.EMBEDDING_MODEL,
            input: text.replace(/\n/g, " "),
        });
        return response.data[0].embedding;
    } catch (error) {
        console.log("Openrouter embedding error", error);
        throw new Error("Failed to generate vector embedding");
    }
};