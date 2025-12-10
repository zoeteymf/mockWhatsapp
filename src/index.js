import express from 'express';
import dotenv from 'dotenv';
import axios from 'axios';
import path from 'path';
import { fileURLToPath } from 'url';
import multer from 'multer';

dotenv.config();

const app = express();
app.use(express.json());

const PORT = process.env.PORT || 3000;
const N8N_WEBHOOK_URL = process.env.N8N_WEBHOOK_URL || '';

// Resolve __dirname for ES modules
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Configure multer for file uploads
const upload = multer({ dest: 'uploads/' });

// In-memory store for inbound messages (for demo UI)
const inboundMessages = [];

// Health
app.get('/health', (req, res) => {
  res.json({ ok: true, service: 'mock-whatsapp-bot' });
});

// Serve UI
app.use('/', express.static(path.join(__dirname, '..', 'public')));

// Send message to n8n webhook
// POST /send { to: string, text?: string, file?: object, meta?: object }
app.post('/send', upload.single('file'), async (req, res) => {
  if (!N8N_WEBHOOK_URL) {
    return res.status(400).json({ error: 'N8N_WEBHOOK_URL not configured' });
  }
  const { to, text, meta } = req.body || {};
  const file = req.file;
  if (!to || (!text && !file)) {
    return res.status(400).json({ error: 'Missing "to" and at least one of "text" or "file"' });
  }
  try {
    const payload = {
      direction: 'outbound',
      channel: 'whatsapp',
      to,
      text,
      file: file ? { filename: file.originalname, path: file.path } : undefined,
      meta: meta || {}
    };
    const { data, status } = await axios.post(N8N_WEBHOOK_URL, payload, {
      headers: { 'Content-Type': 'application/json' },
      timeout: 10000
    });
    res.status(200).json({ ok: true, status, response: data });
  } catch (err) {
    const status = err.response?.status;
    const respData = err.response?.data;
    res.status(502).json({
      ok: false,
      error: err.message,
      n8nStatus: status,
      n8nResponse: respData,
      url: N8N_WEBHOOK_URL
    });
  }
});

// Receive message from n8n
// n8n should POST to /webhook with { from, text?, file?: object, meta? }
app.post('/webhook', async (req, res) => {
  const { from, text, file, meta } = req.body || {};
  if (!from || (!text && !file)) {
    return res.status(400).json({ error: 'Missing "from" and either "text" or "file"' });
  }
  // Minimal mock: echo back, or log. In real usage, route to your logic.
  console.log('Inbound message', { from, text, file, meta: meta || {} });

  // Store inbound for UI polling
  inboundMessages.push({
    id: Date.now(),
    from,
    text,
    file,
    meta: meta || {},
    at: new Date().toISOString()
  });

  // Acknowledge quickly so n8n flow can proceed
  res.json({ ok: true });
});

// UI polling endpoint
app.get('/messages', (req, res) => {
  res.json({ ok: true, items: inboundMessages.slice(-50) });
});

app.listen(PORT, () => {
  console.log(`Mock WhatsApp bot listening on http://localhost:${PORT}`);
});
