import express from 'express';
import { sendMessageToTarget } from './whatsapp-bot.js';
import 'dotenv/config';

const app = express();
const PORT = process.env.PORT || 3000;

app.use(express.json());

// Endpoint untuk trigger pengiriman pesan WhatsApp otomatis
app.post('/send-message', async (req, res) => {
    try {
        const result = await sendMessageToTarget();
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