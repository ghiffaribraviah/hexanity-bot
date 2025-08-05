import cron from 'node-cron';
import Reminder from '../models/reminder.js';
import { dc_text } from '../../spreadsheet/text-discord.js';

export const activeJobs = new Map();

export async function loadReminders(client) {
  const reminders = await Reminder.find();

  for (const rem of reminders) {
    const channel = await client.channels.fetch(rem.channelId).catch(() => null);
    if (!channel) continue;

    const job = cron.schedule(rem.cronExpr, () => {
      channel.send(dc_text);
    });

    activeJobs.set(rem.guildId, job);
  }
}