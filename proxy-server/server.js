const http = require('http');

const PORT = 3001;
const API_KEY = process.env.MODERATION_API_KEY || '';

const server = http.createServer((req, res) => {
  res.setHeader('Content-Type', 'application/json');
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS');
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type, Authorization');

  if (req.method === 'OPTIONS') {
    res.writeHead(204);
    res.end();
    return;
  }

  if (req.method !== 'POST') {
    res.writeHead(405);
    res.end(JSON.stringify({ error: 'Method not allowed' }));
    return;
  }

  let body = '';
  req.on('data', chunk => { body += chunk; });
  req.on('end', async () => {
    try {
      const { text } = JSON.parse(body);
      const result = await moderateText(text);
      res.writeHead(200);
      res.end(JSON.stringify(result));
    } catch (err) {
      res.writeHead(400);
      res.end(JSON.stringify({ error: err.message }));
    }
  });
});

async function moderateText(text) {
  // Placeholder - ganti dengan API moderasi pilihan Anda
  // Contoh: OpenAI Moderation API
  if (API_KEY) {
    try {
      const response = await fetch('https://api.openai.com/v1/moderations', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${API_KEY}`,
        },
        body: JSON.stringify({ input: text }),
      });
      const data = await response.json();
      if (data.results?.[0]) {
        const result = data.results[0];
        return {
          isSensitive: result.flagged,
          confidence: Math.max(...Object.values(result.category_scores || {})),
          categories: Object.entries(result.categories || {})
            .filter(([_, v]) => v)
            .map(([k]) => k),
        };
      }
    } catch (err) {
      console.error('Moderation API error:', err.message);
    }
  }

  // Fallback local
  const sensitive = /\b(porn|sex|nsfw|xxx|18\+)\b/i.test(text);
  return {
    isSensitive: sensitive,
    confidence: sensitive ? 0.85 : 0.0,
    categories: sensitive ? ['suggestive'] : [],
  };
}

server.listen(PORT, () => {
  console.log(`AppFilter proxy server running on http://localhost:${PORT}`);
  console.log(`API Key configured: ${API_KEY ? 'Yes' : 'No (using local fallback)'}`);
});