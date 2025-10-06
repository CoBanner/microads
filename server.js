const express = require('express');
const app = express();
const path = require('path');

app.use(express.json());
app.use(express.static(path.join(__dirname, 'public')));

let nextId = 0;
let queue = []; // { id, spotIndex, text, duration, status: 'pending'|'approved'|'showing'|'completed' }

// --- Queue APIs ---

// Get all messages
app.get('/queue', (req, res) => {
    res.json(queue);
});

// Create a new message
app.post('/queue', (req, res) => {
    const { spotIndex, text, duration } = req.body;
    if (spotIndex == null || !text) return res.status(400).json({ error: 'Missing spotIndex or text' });

    const msg = {
        id: nextId++,
        spotIndex,
        text,
        duration: Number(duration) || 10,
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
// Reset system (clear all messages)
app.delete('/queue', (req, res) => {
    queue = [];
    res.json({ ok: true });
});

app.listen(3000, () => console.log('Server running on http://localhost:3000'));
