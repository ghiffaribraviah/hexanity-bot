import 'dotenv/config';
import { startDiscordBot } from './discord-bot/discord-bot.js';
import { startWhatsappBot } from './whatsapp-bot/whatsapp-bot.js';

async function main() {
  console.log("🚀 Starting both bots...");

  try {
    await Promise.all([
      startDiscordBot(),
      startWhatsappBot(),
    ]);
  } catch (err) {
    console.error('❌ Error starting bots:', err);
  }
}

main();