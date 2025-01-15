import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { Team } from '../models/Team';

export const addMember = async (req: Request, res: Response): Promise<void> => {
  const { name, slackId } = req.body;
  const { teamId } = req.params;

  try {
    const member = new Member({ name, slackId, team: teamId });
    await member.save();
    await Team.findByIdAndUpdate(teamId, { $push: { members: member._id } });
    res.status(201).json({ message: 'Member added successfully', member });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { teamId, memberId } = req.params;

  try {
    await Member.findByIdAndDelete(memberId);
    await Team.findByIdAndUpdate(teamId, { $pull: { members: memberId } });
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
