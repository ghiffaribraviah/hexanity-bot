import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'url';
import { Client, Collection, GatewayIntentBits } from 'discord.js';
import 'dotenv/config';
import { dc_text_update } from '../spreadsheet/text-discord.js';

const token = process.env.DISCORD_TOKEN;

dc_text_update();

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const client = new Client({ intents: [GatewayIntentBits.Guilds] });

client.commands = new Collection();

const commandFolder = path.join(__dirname, 'slash-commands');
const commandFiles = fs.readdirSync(commandFolder).filter(file => file.endsWith('.js'));

for (const file of commandFiles) {
	const filePath = path.join(commandFolder, file);
	const command = await import(pathToFileURL(filePath).href);
	if ('data' in command && 'execute' in command) {
		client.commands.set(command.data.name, command);
	} else {
		console.log(`[WARNING] The command at ${filePath} is missing a required "data" or "execute" property.`);
	}
}

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

client.login(token);