const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let nextId = 0;
let queue = [];
// Message object: { id, spotIndex, text, duration, textColor, special, status: 'pending'|'approved'|'showing'|'completed' }

// -----------------------------
//        Queue APIs
// -----------------------------

// Get all messages
app.get('/queue', (req, res) => {
    res.json(queue);
});

// Create a new message (with full validation)
app.post('/queue', (req, res) => {
    const { spotIndex, text, duration, special, textColor } = req.body;

    const ALLOWED_DURATIONS = [10, 30, 60];  // allowed display durations in seconds
    const MAX_MESSAGE_LENGTH = 200;          // max characters
    const ALLOWED_SPECIAL_FLAGS = [true, false];
    const ALLOWED_COLORS = [
        '#000000', // black
        '#ff0000', // red
        '#00ff00', // green
        '#0000ff', // blue
        '#ffcc00', // yellow
        '#ff00ff'  // magenta
    ]; // only 6 bright colors (no white)

    // Required field validation
    if (spotIndex == null || !text) {
        return res.status(400).json({ error: 'Missing spotIndex or text' });
    }

    // Message length validation
    if (text.length === 0 || text.length > MAX_MESSAGE_LENGTH) {
        return res.status(400).json({ error: `Message length must be 1–${MAX_MESSAGE_LENGTH} characters` });
    }

    // Duration validation
    const dur = Number(duration);
    if (!ALLOWED_DURATIONS.includes(dur)) {
        return res.status(400).json({ error: 'Invalid duration value' });
    }

    // Special flag validation
    if (!ALLOWED_SPECIAL_FLAGS.includes(!!special)) {
        return res.status(400).json({ error: 'Invalid special flag' });
    }

    // Text color validation (required and must be in allowed list)
    if (!textColor || !ALLOWED_COLORS.includes(textColor)) {
        return res.status(400).json({ error: 'Invalid text color. Allowed colors: ' + ALLOWED_COLORS.join(', ') });
    }

    // Passed all validations
    const msg = {
        id: nextId++,
        spotIndex,
        text,
        duration: dur,
        textColor, // use the validated color
        special: !!special,
        status: 'pending'
    };

    queue.push(msg);
    res.json({ success: true, msg });
});


// Approve a message
app.post('/queue/:id/approve', (req, res) => {
    const msg = queue.find(m => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    msg.status = 'approved';
    res.json({ success: true });
});

// Decline a message
app.post('/queue/:id/decline', (req, res) => {
    const msg = queue.find(m => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    msg.status = 'completed';
    res.json({ success: true });
});

// Mark showing
app.post('/queue/:id/showing', (req, res) => {
    const msg = queue.find(m => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    if (msg.status !== 'approved') return res.status(400).json({ error: 'Message not approved' });
    msg.status = 'showing';
    res.json({ success: true });
});

// Mark completed
app.post('/queue/:id/completed', (req, res) => {
    const msg = queue.find(m => m.id == req.params.id);
    if (!msg) return res.status(404).json({ error: 'Message not found' });
    msg.status = 'completed';
    res.json({ success: true });
});

// Reset queue (admin utility)
app.delete('/queue', (req, res) => {
    queue = [];
    res.json({ ok: true });
});

// -----------------------------
//        Server Startup
// -----------------------------
app.listen(3000, () => {
    console.log(' Server running on http://localhost:3000');
});
