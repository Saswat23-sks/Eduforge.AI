import { GoogleGenerativeAI } from "@google/generative-ai";

export default async function handler(req: any, res: any) {
  if (req.method !== 'POST') {
    return res.status(405).json({ error: 'Method not allowed' });
  }

  const key = process.env.GEMINI_API_KEY;
  if (!key) {
    console.error('GEMINI_API_KEY is not configured');
    return res.status(500).json({ 
      error: 'GEMINI_API_KEY is missing. Please add it to your Vercel Environment Variables.' 
    });
  }

  try {
    const genAI = new GoogleGenerativeAI(key);
    const { systemPrompt, prompt, model: modelName, config } = req.body;
    
    const model = genAI.getGenerativeModel({ 
      model: modelName || 'gemini-2.0-flash',
      generationConfig: config
    });

    const result = await model.generateContent([systemPrompt, prompt]);
    const response = await result.response;
    let text = response.text();
    
    // Robust JSON extraction
    try {
      // Try direct parse first
      const data = JSON.parse(text);
      res.status(200).json(data);
    } catch (parseError) {
      // Try to extract from markdown blocks if present
      const jsonMatch = text.match(/```json\n([\s\S]*?)\n```/) || text.match(/```([\s\S]*?)```/);
      if (jsonMatch && jsonMatch[1]) {
        try {
          const data = JSON.parse(jsonMatch[1].trim());
          return res.status(200).json(data);
        } catch (innerError) {
          console.error('Inner JSON Parse Error:', innerError);
        }
      }
      
      console.error('JSON Parse Error:', text);
      res.status(500).json({ error: 'AI returned invalid JSON. Please try again.' });
    }
  } catch (error) {
    console.error('AI Generation Error:', error);
    const message = error instanceof Error ? error.message : 'Unknown AI error';
    res.status(500).json({ error: message });
  }
}
