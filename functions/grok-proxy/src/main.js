export default async ({ req, res, log, error }) => {
  const corsHeaders = {
    'Access-Control-Allow-Origin': 'https://3000-firebase-get-loom-1771929674035.cluster-64pjnskmlbaxowh5lzq6i7v4ra.cloudworkstations.dev',
    'Access-Control-Allow-Methods': 'POST, OPTIONS',
    'Access-Control-Allow-Headers': 'Content-Type, X-Appwrite-Project, X-Appwrite-Key',
  };

  if (req.method === 'OPTIONS') {
    return res.send('', 204, corsHeaders);
  }

  const groqApiKey = process.env.GROQ_API_KEY;
  if (!groqApiKey) {
    error('GROQ_API_KEY is not set.');
    return res.json({ error: "Missing API Key" }, 500, corsHeaders);
  }

  try {
    const { messages = [] } = req.body;
    
    const isAnalysisRequest = messages.some(m => 
      m.role === 'system' && m.content.toLowerCase().includes('json')
    );

    const groqResponse = await fetch("https://api.groq.com/openai/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${groqApiKey}`,
      },
      body: JSON.stringify({
        messages: messages,
        model: "gemma2-9b-it",
        temperature: isAnalysisRequest ? 0.1 : 0.7,
        response_format: isAnalysisRequest ? { type: "json_object" } : undefined 
      }),
    });

    const groqData = await groqResponse.json();
    const content = groqData.choices?.[0]?.message?.content;

    let finalPayload;
    try {
      finalPayload = isAnalysisRequest ? JSON.parse(content) : content;
    } catch (e) {
      finalPayload = content;
    }

    // Return the payload in the 'data' property as expected by the client
    return res.json({ data: finalPayload }, 200, corsHeaders);

  } catch (err) {
    error("Error processing Groq request: " + err.message);
    return res.json({ error: err.message }, 500, corsHeaders);
  }
};