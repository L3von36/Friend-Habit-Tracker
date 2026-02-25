import Groq from 'groq-sdk';

export default async ({ req, res, log, error }) => {
 
  const corsHeaders = {
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

  const apiKey = process.env.GROQ_API_KEY;
  if (!apiKey) {
    error('GROQ_API_KEY is not set.');
    return res.json({ error: 'Server configuration error.' }, 500, corsHeaders);
  }

  let messages = req.body.messages;

  // Handle case where body IS the messages array
  if (!messages && Array.isArray(req.body)) {
    messages = req.body;
  }

  if (!messages || !Array.isArray(messages)) {
    return res.json({ error: "Invalid request: Missing 'messages' array." }, 400, corsHeaders);
  }

  try {
    const groq = new Groq({ apiKey });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: req.body.model || 'llama3-8b-8192',
      temperature: req.body.temperature ?? 0.7,
      max_tokens: req.body.max_tokens,
      response_format: req.body.response_format,
    });

    // Return the full completion to be flexible, but also a top-level 'message' for convenience
    return res.json({
      message: chatCompletion.choices[0]?.message?.content || '',
      choices: chatCompletion.choices,
      usage: chatCompletion.usage
    }, 200, corsHeaders);

  } catch (e) {
    error('Groq API call failed:', e);
    return res.json({
      error: 'Failed to communicate with the AI service.',
      details: e.message
    }, 500, corsHeaders);
  }
};
