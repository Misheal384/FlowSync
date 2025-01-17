import mongoose, { Schema, Document, Types } from 'mongoose';
//import { Question } from './Question';

export interface IStandup extends Document {
  team: Types.ObjectId;
  member: Types.ObjectId;
  date: Date;
  answers: { question: string; answer: string }[];
}

const standupSchema: Schema = new Schema({
  team: { type: Schema.Types.ObjectId, ref: 'Team', required: true },
  member: { type: Schema.Types.ObjectId, ref: 'Member', required: true },
  date: { type: Date, required: true },
  update: [
    {
      question: {type: Schema.Types.ObjectId, ref: 'Question', required: true},
    },
  ],
});

export const Standup = mongoose.model<IStandup>('Standup', standupSchema);
