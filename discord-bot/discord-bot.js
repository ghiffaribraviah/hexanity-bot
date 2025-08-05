import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Events, Client, Collection, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { dc_text_update } from '../spreadsheet/text-discord.js';
import { loadReminders } from './utils/scheduler.js';
import { connectDB } from './utils/db.js';

const token = process.env.DISCORD_TOKEN;
dc_text_update();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });
client.commands = new Collection();

// Load Slash Commands
const commandFolder = path.join(__dirname, 'slash-commands');
const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
  const filePath = path.join(commandFolder, file);
  const command = await import(pathToFileURL(filePath).href);
  if ('data' in command && 'execute' in command) {
    client.commands.set(command.data.name, command);
  } else {
    console.warn(`[WARNING] Command ${file} is missing "data" or "execute".`);
  }
}

// Load Events
const eventsPath = path.join(__dirname, 'events');
const eventFiles = fs.readdirSync(eventsPath).filter(file => file.endsWith('.js'));

for (const file of eventFiles) {
  const filePath = path.join(eventsPath, file);
  const event = await import(pathToFileURL(filePath).href);
  if (event.once) {
    client.once(event.name, (...args) => event.execute(...args));
  } else {
    client.on(event.name, (...args) => event.execute(...args));
  }
}

// Main async function
async function main() {
  try {
    await connectDB();
    await client.login(token);
    await loadReminders(client);
    console.log('✅ Bot is up and reminders loaded.');
  } catch (err) {
    console.error('❌ Failed to start bot:', err);
  }
}

main();