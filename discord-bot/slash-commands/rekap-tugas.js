import { SlashCommandBuilder } from 'discord.js';
import { dc_text } from '../../spreadsheet/text-discord.js';

export const data = new SlashCommandBuilder()
  .setName('rekap-tugas')
  .setDescription('Memberikan informasi mengenai tugas yang ada di Hexanity Academic Center!');

export async function execute(interaction) {

  const botMember = await interaction.guild.members.fetchMe();
  const botPermissions = interaction.channel.permissionsFor(botMember);
  
  if (!botPermissions?.has(['ViewChannel', 'SendMessages'])) {
    return interaction.reply({
      content: `❌ Bot tidak memiliki izin untuk mengirim pesan di <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral
    });
  }

  await interaction.reply(dc_text);
  console.log("Requested Rekap from: " + interaction.user.id);
}