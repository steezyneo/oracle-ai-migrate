const { GoogleGenerativeAI } = require("@google/generative-ai");

exports.handler = async function(event, context) {
  try {
    const { code, prompt, aiModel } = JSON.parse(event.body);
    const GEMINI_API_KEY = process.env.GEMINI_API_KEY;
    const genAI = new GoogleGenerativeAI(GEMINI_API_KEY);
    const model = genAI.getGenerativeModel({ model: aiModel || "gemini-2.5-pro" });
    const result = await model.generateContent(prompt || code);
    const response = await result.response;
    const convertedCode = response.text().replace(/^```[a-zA-Z]*|```$/g, '').trim();
    return {
      statusCode: 200,
      body: JSON.stringify({ convertedCode }),
    };
  } catch (e) {
    return {
      statusCode: 500,
      body: JSON.stringify({ error: e.message }),
    };
  }
}; 