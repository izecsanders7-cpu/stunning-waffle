# Pet/Plant Cam — Custom Remote Camera

A small self-hosted project: your Android phone streams its camera live,
and a few trusted people can watch from a browser link. No third-party
camera app, no video stored anywhere — video goes phone-to-viewer directly
(WebRTC); this server only helps the two sides find each other.

## What's in this folder

- `server.js` — signaling server (Node/Express/WebSocket)
- `public/broadcaster.html` — open this ON YOUR PHONE to start streaming
- `public/viewer.html` — the page you send to trusted people
- `package.json` — dependencies

## 1. Deploy the server (free tier works)

Pick one:
- **Render.com** — New → Web Service → connect this folder/repo → it auto-detects Node
- **Railway.app** — New Project → Deploy from folder/repo
- **Fly.io** — `fly launch` in this folder

Set these environment variables on whichever host you pick:
- `BROADCASTER_KEY` — a strong passcode only your phone will use
- `VIEWER_KEY` — a passcode you share with trusted people (use one key for
  all of them, since you said it's a small trusted group)

Once deployed, you'll get a URL like `your-app.onrender.com`. Your WebSocket
address for the app pages is `wss://your-app.onrender.com`.

## 2. Set up your phone

1. Open `https://your-app.onrender.com/broadcaster.html` in Chrome on your phone
2. Enter your `BROADCASTER_KEY` and the `wss://...` server address
3. Tap **Start Broadcasting**, allow camera access
4. Optional: tap the browser menu → "Add to Home Screen" so it's one tap next time
   (keep the phone plugged in and screen-on/propped facing your pet or plant)

## 3. Share with trusted people

Send them:
- The link: `https://your-app.onrender.com/viewer.html`
- The `VIEWER_KEY` passcode (share this privately, not publicly)

They open the link, enter the passcode, tap **Watch**.

## Important limitation: mobile networks and NAT

If your phone is on cellular data (not WiFi), the direct peer-to-peer
connection can sometimes fail to establish because carrier networks use
strict NAT. If viewers see "Connected. Waiting for camera..." but the
video never loads:

- Try connecting your phone to WiFi instead, or
- Add a free TURN server (e.g. from Metered.ca or OpenRelay) — there's a
  commented-out line in both `broadcaster.html` and `viewer.html` showing
  where to add it

## Security notes

- Change both keys from the defaults before deploying — do not leave them
  as `change-me-broadcaster` / `change-me-viewer`
- Anyone with the viewer passcode can watch, so treat it like a shared
  password
- There's no video recording built in — this is live-view only
