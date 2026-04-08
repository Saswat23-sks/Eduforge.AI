import { GoogleGenerativeAI } from "@google/generative-ai";
import Groq from "groq-sdk";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const { systemPrompt, prompt, model: modelName, config } = req.body;

  // Helper to extract JSON from text
  const extractJson = (text: string) => {
    try {
      return JSON.parse(text);
    } catch (e) {
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        return JSON.parse(jsonMatch[1].trim());
      }
      throw new Error('Could not parse JSON from AI response');
    }
  };

  // 1. Try Gemini
  const geminiKey = process.env.GEMINI_API_KEY;
  if (geminiKey) {
    try {
      const genAI = new GoogleGenerativeAI(geminiKey);
      const model = genAI.getGenerativeModel({ 
        model: modelName || 'gemini-2.0-flash',
        generationConfig: config
      });

      const result = await model.generateContent([systemPrompt, prompt]);
      const response = await result.response;
      const text = response.text();
      return res.status(200).json(extractJson(text));
    } catch (geminiError) {
      console.error('Gemini Error, attempting Groq fallback:', geminiError);
    }
  }

  // 2. Fallback to Groq
  const groqKey = process.env.GROQ_API_KEY;
  if (groqKey) {
    try {
      const groq = new Groq({ apiKey: groqKey });
      const completion = await groq.chat.completions.create({
        messages: [
          { role: "system", content: systemPrompt },
          { role: "user", content: prompt }
        ],
        model: "llama-3.3-70b-versatile",
        response_format: { type: "json_object" },
        temperature: config?.temperature || 0.7,
      });

      const text = completion.choices[0]?.message?.content || "";
      return res.status(200).json(JSON.parse(text));
    } catch (groqError) {
      console.error('Groq Error:', groqError);
      return res.status(500).json({ error: 'Both Gemini and Groq failed to generate content.' });
    }
  }

  return res.status(500).json({ error: 'No AI API keys configured (Gemini or Groq).' });
}
