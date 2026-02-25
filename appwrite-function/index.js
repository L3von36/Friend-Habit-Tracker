const Groq = require('groq-sdk');

module.exports = async ({ req, res, log, error }) => {
  // CORS headers must be present in every response path
  const corsHeaders = {
    'access-control-allow-origin': '*',
    'access-control-allow-methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'access-control-allow-headers': 'content-type, x-appwrite-project, x-appwrite-key, x-appwrite-session, x-sdk-version, x-sdk-name, authorization',
    'access-control-max-age': '86400'
  };

  log(`Handling ${req.method} request`);

  if (req.method === 'OPTIONS') {
    return res.send('', 200, corsHeaders);
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

    // Robust body parsing
    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        log('Note: Request body is a string but not valid JSON');
      }
    }

    let messages = body?.messages;
    if (!messages && Array.isArray(body)) {
      messages = body;
    }

    if (!messages || !Array.isArray(messages)) {
      return res.json({ error: "Invalid request: Missing 'messages' array." }, 400, corsHeaders);
    }

    const groq = new Groq({ apiKey });
    
    const chatCompletion = await groq.chat.completions.create({
      messages: messages,
      model: body?.model || 'llama3-8b-8192',
      temperature: body?.temperature ?? 0.7,
      max_tokens: body?.max_tokens,
      response_format: body?.response_format,
    });

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
