import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  timezone: string;
  slackChannelId: string;
  members: Types.ObjectId[];
}

const teamSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  timezone: { type: String, required: true },
  slackChannelId: { type: String, required: false },
  members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
});

export const Team = mongoose.model<ITeam>('Team', teamSchema);