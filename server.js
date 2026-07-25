// Signaling server for phone-to-web camera streaming (WebRTC)
// This server does NOT see or store video - it only relays connection
// setup messages between your phone and viewers. Video flows directly
// peer-to-peer once connected.

const express = require('express');
const http = require('http');
const WebSocket = require('ws');
const path = require('path');

const app = express();
app.use(express.static(path.join(__dirname, 'public')));

const server = http.createServer(app);
const wss = new WebSocket.Server({ server });

// Set these as environment variables on your host - do not leave defaults in production
const BROADCASTER_KEY = process.env.BROADCASTER_KEY || 'change-me-broadcaster';
const VIEWER_KEY = process.env.VIEWER_KEY || 'change-me-viewer';

let broadcaster = null; // the ws connection representing your phone
const viewers = new Map(); // viewerId -> ws connection

function send(ws, obj) {
  if (ws && ws.readyState === WebSocket.OPEN) {
    ws.send(JSON.stringify(obj));
  }
}

wss.on('connection', (ws) => {
  ws.id = Math.random().toString(36).slice(2, 10);

  ws.on('message', (raw) => {
    let msg;
    try { msg = JSON.parse(raw); } catch { return; }

    switch (msg.type) {
      case 'register-broadcaster': {
        if (msg.key !== BROADCASTER_KEY) {
          send(ws, { type: 'error', message: 'Invalid broadcaster key' });
          ws.close();
          return;
        }
        broadcaster = ws;
        ws.role = 'broadcaster';
        send(ws, { type: 'registered' });
        break;
      }
        case'register-viewer':{
        ws.role = 'viewer';
        viewers.set(ws.id, ws);
        send(ws, { type: 'registered', viewerId: ws.id });
        if (broadcaster) {
          send(broadcaster, { type: 'viewer-joined', viewerId: ws.id });
        } else {
          send(ws, { type: 'broadcaster-offline' });
        }
        break;
      }

      // Broadcaster (phone) sends an SDP offer targeted at one viewer
      case 'offer': {
        const target = viewers.get(msg.viewerId);
        send(target, { type: 'offer', sdp: msg.sdp, viewerId: msg.viewerId });
        break;
      }

      // Viewer sends its SDP answer back to the broadcaster
      case 'answer': {
        send(broadcaster, { type: 'answer', sdp: msg.sdp, viewerId: ws.id });
        break;
      }

      // ICE candidates relayed in both directions
      case 'ice-candidate': {
        if (ws.role === 'broadcaster') {
          const target = viewers.get(msg.viewerId);
          send(target, { type: 'ice-candidate', candidate: msg.candidate });
        } else {
          send(broadcaster, { type: 'ice-candidate', candidate: msg.candidate, viewerId: ws.id });
        }
        break;
      }
    }
  });

  ws.on('close', () => {
    if (ws.role === 'broadcaster' && broadcaster === ws) {
      broadcaster = null;
      for (const v of viewers.values()) send(v, { type: 'broadcaster-offline' });
    } else if (ws.role === 'viewer') {
      viewers.delete(ws.id);
      if (broadcaster) send(broadcaster, { type: 'viewer-left', viewerId: ws.id });
    }
  });
});

const PORT = process.env.PORT || 3000;
server.listen(PORT, () => console.log(`Signaling server running on port ${PORT}`));
