import { HexanityBot } from './whatsapp-bot/whatsapp-bot.js';
import { startUpdate } from './spreadsheet/spreadsheet.js';
// import './whatsapp-bot/api.js';

startUpdate();
HexanityBot();
// Ini script untuk menjalankan whatsapp.js (client WA) dan api.js (API server) secara bersamaan
// npm run start atau node index.js
