# Mock WhatsApp Chatbot (minimal)

A tiny Express server to:
- Send messages to an n8n webhook (`/send`)
- Receive messages from n8n (`/webhook`)
- Test via a simple web UI at `/`

## Setup

1. Create `.env` from example:
```
copy .env.example .env
```
Edit `.env` and set `N8N_WEBHOOK_URL` to your n8n webhook URL.

2. Install deps:
```
npm install
```

3. Run:
```
npm start
```
Server runs on `http://localhost:3000` by default.

4. Expose your local server to the internet using a tunneling service like Ngrok or LocalTunnel:
```
# For Ngrok
ngrok http 3000

# For LocalTunnel
lt --port 3000
```
Copy the url to n8n http request node for sending message, for e.g. https://thin-socks-follow.loca.lt is the localtunnel url, https://thin-socks-follow.loca.lt/webhook is the url to receive message from n8n.

## Endpoints

- `POST /send` → send outbound message to n8n webhook
  - Body: `{ "to": "123456", "text": "Hello", "file": { "filename": "example.txt", "path": "uploads/example.txt" }, "meta": {"any":"thing"} }`
  - Forwards JSON to `N8N_WEBHOOK_URL` with `direction: "outbound"`, `channel: "whatsapp"`, and optional `file`.

- `POST /webhook` → receive inbound message from n8n
  - Body: `{ "from": "123456", "text": "Hi", "file": { "filename": "example.txt", "path": "uploads/example.txt" }, "meta": { ... } }`
  - Logs the message and stores it for UI polling.

## Web UI

- Open `http://localhost:3000/` in a browser.
- Left panel: send message to n8n (`/send`) with fields:
  - Recipient ID
  - Message
  - File (optional)
- Right panel: poll and display inbound messages from `/messages`.
  - Displays text and file metadata.

## Minimal philosophy

- No database, sessions, or auth. Keep it simple.
- Adjust payload fields to match your n8n flow.
