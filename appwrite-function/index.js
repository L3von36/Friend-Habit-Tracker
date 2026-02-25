import Groq from 'groq-sdk';

export default async ({ req, res, log, error }) => {
  const origin = req.headers['origin'] || '*';

  const corsHeaders = {
    'Access-Control-Allow-Origin': origin,
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project, X-Appwrite-Key, X-Appwrite-Session, X-SDK-Version, X-SDK-Name',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
  };

  log(`Request method: ${req.method} from origin: ${origin}`);

  if (req.method === 'OPTIONS') {
    return res.send('', 204, corsHeaders);
  }

  try {
    if (req.method !== 'POST') {
      return res.send('Method Not Allowed', 405, corsHeaders);
    }

    const apiKey = process.env.GROQ_API_KEY;
    if (!apiKey) {
      error('GROQ_API_KEY is not set.');
      return res.json({ error: 'Server configuration error.' }, 500, corsHeaders);
    }

    let messages = req.body.messages;
    if (!messages && Array.isArray(req.body)) {
      messages = req.body;
    }

    if (!messages || !Array.isArray(messages)) {
      log('Invalid request body: ' + JSON.stringify(req.body));
      return res.json({ error: "Invalid request: Missing 'messages' array." }, 400, corsHeaders);
    }

    log(`Calling Groq API with model: ${req.body.model || 'llama3-8b-8192'}`);
    const groq = new Groq({ apiKey });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: req.body.model || 'llama3-8b-8192',
      temperature: req.body.temperature ?? 0.7,
      max_tokens: req.body.max_tokens,
      response_format: req.body.response_format,
    });

    log('Groq API call successful');

    return res.json({
      message: chatCompletion.choices[0]?.message?.content || '',
      choices: chatCompletion.choices,
      usage: chatCompletion.usage
    }, 200, corsHeaders);

  } catch (e) {
    error('Function execution failed: ' + e.message);
    return res.json({
      error: 'Internal Server Error',
      details: e.message
    }, 500, corsHeaders);
  }
};
