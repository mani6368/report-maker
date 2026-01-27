import { GoogleGenerativeAI } from "@google/generative-ai";

const API_KEY = "AIzaSyAbfPN-g_4sAWfsQxhkygke82aRhlO8gT0";

async function listModels() {
    const genAI = new GoogleGenerativeAI(API_KEY);
    // Access the model manager directly if possible, or try a raw fetch if SDK doesn't expose it easily in this version
    // The Node SDK usually supports this via a specific manager, but let's try a raw fetch for certainty.

    const url = `https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`;

    try {
        const response = await fetch(url);
        const data = await response.json();
        console.log("Available Models:");
        if (data.models) {
            data.models.forEach(m => {
                if (m.supportedGenerationMethods && m.supportedGenerationMethods.includes("generateContent")) {
                    console.log(`- ${m.name}`);
                }
            });
        } else {
            console.log("No models found or error structure:", data);
        }
    } catch (error) {
        console.error("Error listing models:", error);
    }
}

listModels();
