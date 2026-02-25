import Groq from 'groq-sdk';

export default async ({ req, res, log, error }) => {
 
  const corsHeaders = {
    // This allows your specific cloud workstation to talk to Appwrite
    'Access-Control-Allow-Origin': req.headers['origin'] || '*', 
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project, X-Appwrite-Key',
    'Access-Control-Allow-Credentials': 'true'
  };

  if (req.method === 'OPTIONS') {
    return res.send('ok', 204, corsHeaders);
  }

  if (req.method !== 'POST') {
    return res.send('Method Not Allowed', 405, corsHeaders);
  }

  if (!process.env.GROQ_API_KEY) {
    error('GROQ_API_KEY is not set. The function will not work.');
    return res.json({ error: 'Server configuration error.' }, 500, corsHeaders);
  }

  if (!req.body.messages || !Array.isArray(req.body.messages)) {
    return res.json({ error: "Invalid request: Missing 'messages' array." }, 400, corsHeaders);
  }

  try {
    const groq = new Groq({ apiKey: process.env.GROQ_API_KEY });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: req.body.messages,
      model: 'llama3-8b-8192',
    });

    const message = chatCompletion.choices[0]?.message?.content || '';
    
    return res.json({ message: message }, 200, corsHeaders);

  } catch (e) {
    error('Groq API call failed:', e);
    return res.json({ error: 'Failed to communicate with the AI service.' }, 500, corsHeaders);
  }
};