// token_server.js
// Deploy this to Railway.app
// 
// This server has ONE job: generate a signed JWT token so your
// Android app can connect to LiveKit Cloud.
//
// Railway reads LIVEKIT_API_KEY and LIVEKIT_API_SECRET from
// the environment variables you set in the Railway dashboard.

const express = require('express');
const cors    = require('cors');
const { AccessToken } = require('livekit-server-sdk');

const app = express();
app.use(cors({ origin: '*' }));
app.use(express.json());

// These come from Railway environment variables (set in Step 10 of guide)
// DO NOT hardcode your secret here — use environment variables!
const API_KEY    = process.env.LIVEKIT_API_KEY;
const API_SECRET = process.env.LIVEKIT_API_SECRET;

// ─── Health check ─────────────────────────────────────────────────────────
app.get('/', (req, res) => {
    if (!API_KEY || !API_SECRET) {
        return res.status(500).json({
            status: 'error',
            message: 'LIVEKIT_API_KEY and LIVEKIT_API_SECRET environment variables are not set!'
        });
    }
    res.json({
        status: 'ok',
        service: 'LiveKit Token Server',
        apiKey: API_KEY
    });
});

// ─── Token endpoint ────────────────────────────────────────────────────────
// POST /get-token
// Body: { "roomName": "ABCD1234", "participantName": "Alice" }
// Returns: { "token": "eyJ..." }
app.post('/get-token', async (req, res) => {
    const { roomName, participantName } = req.body;

    // Validate input
    if (!roomName || !participantName) {
        return res.status(400).json({
            error: 'Both roomName and participantName are required'
        });
    }

    // Check env vars are set
    if (!API_KEY || !API_SECRET) {
        return res.status(500).json({
            error: 'Server is missing LIVEKIT_API_KEY or LIVEKIT_API_SECRET. Set them in Railway Variables tab.'
        });
    }

    try {
        const token = new AccessToken(API_KEY, API_SECRET, {
            identity: participantName,
            ttl: '4h',   // token valid for 4 hours
        });

        token.addGrant({
            room:           roomName,
            roomJoin:       true,
            canPublish:     true,   // can send video/audio
            canSubscribe:   true,   // can receive video/audio
            canPublishData: true,   // can send data messages
        });

        const jwt = await token.toJwt();

        console.log(`[${new Date().toISOString()}] Token issued: room=${roomName} participant=${participantName}`);
        res.json({ token: jwt });

    } catch (err) {
        console.error('Token generation failed:', err);
        res.status(500).json({ error: err.message });
    }
});

// ─── Start server ──────────────────────────────────────────────────────────
// Railway injects PORT automatically — do not hardcode 3001 for Railway
const PORT = process.env.PORT || 3001;

app.listen(PORT, '0.0.0.0', () => {
    console.log('==============================================');
    console.log(`  LiveKit Token Server`);
    console.log(`  Port   : ${PORT}`);
    console.log(`  API Key: ${API_KEY || 'NOT SET - add in Railway Variables!'}`);
    console.log('==============================================');
});
