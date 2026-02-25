const Groq = require('groq-sdk');

module.exports = async ({ req, res, log, error }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': '*',
    'Access-Control-Allow-Methods': 'GET, POST, PUT, DELETE, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project, X-Appwrite-Key, X-Appwrite-Session, X-SDK-Version, X-SDK-Name, Authorization',
    'Access-Control-Max-Age': '86400',
    'Access-Control-Allow-Credentials': 'true'
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

    let body = req.body;
    if (typeof body === 'string') {
      try {
        body = JSON.parse(body);
      } catch (e) {
        log('Request body is a string but not valid JSON');
      }
    }

    let messages = body?.messages;
    if (!messages && Array.isArray(body)) {
      messages = body;
    }

    if (!messages || !Array.isArray(messages)) {
      log('Invalid request body: missing messages array');
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
