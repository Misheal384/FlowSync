import mongoose, { Schema, Document, Types } from 'mongoose';

export interface ITeam extends Document {
  name: string;
  timezone: string;
  schedule: string;
  members: Types.ObjectId[];
}

const teamSchema: Schema = new Schema({
  name: { type: String, required: true, unique: true },
  timezone: { type: String, required: true },
  schedule: { type: String, required: true },
  members: [{ type: Schema.Types.ObjectId, ref: 'Member' }],
});

export const Team = mongoose.model<ITeam>('Team', teamSchema);
