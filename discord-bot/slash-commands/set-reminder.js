import { SlashCommandBuilder, ChannelType, MessageFlags } from 'discord.js';
import cron from 'node-cron';
import Reminder from '../models/reminder.js'
import { activeJobs } from '../utils/scheduler.js';
import { dc_text } from '../../spreadsheet/text-discord.js';


export const data = new SlashCommandBuilder()
  .setName('set-reminder')
  .setDescription('Membuat reminder harian #RekapDongSekre sesuai tempat yang diinginkan')
  .addStringOption(option =>
    option.setName('jadwal')
    .setDescription('Gunakan UNIX cron format untuk menentukan jadwal reminder')
    .setRequired(true))
  .addChannelOption(option =>
    option.setName('channel')
    .setDescription('Channel tempat reminder dikirim')
    .addChannelTypes(ChannelType.GuildText)
    .setRequired(true));

export async function execute(interaction) {
  const cronExpression = interaction.options.getString('jadwal');
  const channel = interaction.options.getChannel('channel');
  const guildId = interaction.guildId;

  if (!cron.validate(cronExpression)) {
    return interaction.reply({ 
      content: '❌ Format cron tidak valid!', 
      flags: MessageFlags.Ephemeral
    });
  }

  const existing = await Reminder.findOne({guildId});
  if (existing) {
    return interaction.reply({ 
      content: '❌ Sudah ada reminder aktif di server ini!', 
      flags: MessageFlags.Ephemeral 
    });
  }

  const botMember = await interaction.guild.members.fetchMe();
  const botPermissions = channel.permissionsFor(botMember);

  if (!botPermissions?.has(['ViewChannel', 'SendMessages'])) {
    return interaction.reply({
      content: `❌ Bot tidak memiliki izin untuk mengirim pesan di <#${channel.id}>.`,
      flags: MessageFlags.Ephemeral
    });
  }

  const job = cron.schedule(cronExpression, () => {
    channel.send(dc_text);
  });

  activeJobs.set(guildId, job);
  
  await Reminder.create({ guildId, channelId: channel.id, cronExpr: cronExpression});
  await interaction.reply(`✅ Reminder disimpan. Pesan akan dikirim ke <#${channel.id}> dengan jadwal \`${cronExpression}\``);
  console.log("Requested Reminder from: " + interaction.guildId);
}