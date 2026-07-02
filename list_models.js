require('dotenv').config();

async function listModels() {
    const API_KEY = process.env.GOOGLE_API_KEY;
    if (!API_KEY) {
        console.log("No GOOGLE_API_KEY in .env");
        return;
    }
    const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models?key=${API_KEY}`);
    const data = await res.json();
    if (data.models) {
        console.log("Available Models:");
        data.models.forEach(m => console.log(`- ${m.name} (generateContent: ${m.supportedGenerationMethods?.includes('generateContent')})`));
    } else {
        console.log("Error:", data);
    }
}

listModels();
