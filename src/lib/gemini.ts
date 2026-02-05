import { GoogleGenerativeAI } from "@google/generative-ai";
import { getApiKey } from "./storage";

export async function runGeminiAnalysis(prompt: string) {
    const apiKey = (await getApiKey()) || process.env.NEXT_PUBLIC_GEMINI_API_KEY;

    if (!apiKey) {
        throw new Error("No Gemini API Key found. Please add it in the Manage/Settings section.");
    }

    const genAI = new GoogleGenerativeAI(apiKey);
    const model = genAI.getGenerativeModel({ model: "gemini-flash-latest" });

    const result = await model.generateContent(prompt);
    const response = await result.response;
    return response.text();
}
