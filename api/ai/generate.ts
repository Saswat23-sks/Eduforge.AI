import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  try {
    const genAI = new GoogleGenerativeAI(process.env.GEMINI_API_KEY || '');
    const { systemPrompt, prompt, model: modelName, config } = req.body;
    
    const model = genAI.getGenerativeModel({ 
      model: modelName || 'gemini-2.0-flash',
      generationConfig: config
    });

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    const text = response.text();
    
    res.status(200).json(JSON.parse(text));
  } catch (error) {
    console.error('AI Generation Error:', error);
    res.status(500).json({ error: error instanceof Error ? error.message : 'Unknown error' });
  }
}
