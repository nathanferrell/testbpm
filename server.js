const express = require('express');
const fetch = require('node-fetch');
const path = require('path');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.static(path.join(__dirname))); // Serve all root files

// API proxy route
app.get('/api/search', async (req, res) => {
  const { type, query } = req.query;
  const baseUrl = type === 'bpm'
    ? `https://api.getsong.co/tempo/?bpm=${query}`
    : `https://api.getsong.co/search/?type=song&lookup=${encodeURIComponent(query)}`;

  try {
    const response = await fetch(`${baseUrl}&api_key=${process.env.GETSONG_API_KEY}`, {
      headers: { Accept: 'application/json' }
    });
    const data = await response.json();
    res.json(data);
  } catch (err) {
    res.status(500).json({ error: 'API request failed', details: err.message });
  }
});

// Optional: redirect "/" to search.html
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, 'search.html'));
});

app.listen(PORT, () => {
  console.log(`Server is running at http://localhost:${PORT}`);
});

