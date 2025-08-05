import { SlashCommandBuilder } from 'discord.js';
import Reminder from '../models/reminder.js';
import { activeJobs } from '../utils/scheduler.js';

export const data = new SlashCommandBuilder()
  .setName('delete-reminder')
  .setDescription('Menghapus reminder aktif dari server');

export async function execute(interaction) {
  const guildId = interaction.guildId;
  const reminder = await Reminder.findOne({ guildId });

  if (!reminder) {
    return interaction.reply({ 
        content: '❌ Tidak ada reminder aktif.', 
        flags: MessageFlags.Ephemeral
    });
  }

  const botMember = await interaction.guild.members.fetchMe();
  const botPermissions = interaction.channel.permissionsFor(botMember);
  
  if (!botPermissions?.has(['ViewChannel', 'SendMessages'])) {
    return interaction.reply({
      content: `❌ Bot tidak memiliki izin untuk mengirim pesan di <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral
    });
  }

  const job = activeJobs.get(guildId);
  if (job) {
    job.stop();
    activeJobs.delete(guildId);
  }

  await Reminder.deleteOne({ guildId });
  await interaction.reply('✅ Reminder berhasil dihapus.');
}