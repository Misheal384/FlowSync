import mongoose, { Schema, Document, Model } from 'mongoose';

// Define the Question schema
const questionSchema: Schema = new Schema({
  team: { type: String, required: true }, // The team ID to which the question belongs to
  text: { type: String, required: true }, // The question text
  answer: { type: Schema.Types.Mixed, required: true }, 
});

export interface IQuestion extends Document {
  team: string
  text: string;
  answer: { type: Schema.Types.Mixed, required: true }, 
}

export const Question: Model<IQuestion> = mongoose.model<IQuestion>('Question', questionSchema);
