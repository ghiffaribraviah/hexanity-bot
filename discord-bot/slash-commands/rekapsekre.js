import { SlashCommandBuilder } from 'discord.js';
import { dc_text } from '../../spreadsheet/text-discord.js';

export const data = new SlashCommandBuilder()
  .setName('rekap-tugas')
  .setDescription('Memberikan informasi mengenai tugas yang ada di Hexanity Academic Center!');

export async function execute(interaction) {
  await interaction.reply(dc_text);
}