import express from 'express';
import { sendMessageToTarget } from './whatsapp.js';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint untuk trigger pengiriman pesan WhatsApp
app.post('/send-message', async (req, res) => {
    const { number, text } = req.body;
    if (!number || !text) {
        return res.status(400).send('Number and text are required');
    }
    try {
        const result = await sendMessageToTarget(number, text);
        res.status(200).send(result);
    } catch (err) {
        res.status(500).send('Failed to send message: ' + err.message);
    }
});

app.get('/', (req, res) => {
    res.send('Hexanity WA Bot API is running');
});

app.listen(PORT, () => {
    console.log(`API server running on port ${PORT}`);
});
