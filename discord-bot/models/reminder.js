import mongoose from 'mongoose';

const reminderSchema = new mongoose.Schema({
  guildId: { type: String, required: true, unique: true },
  channelId: { type: String, required: true },
  cronExpr: { type: String, required: true },
});

export default mongoose.model('Reminder', reminderSchema);