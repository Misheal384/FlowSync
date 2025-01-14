import { Request, Response } from 'express';
import { Team } from '../models/Team';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  const { name, timezone, schedule } = req.body;

  try {
    const team = new Team({ name, timezone, schedule });
    await team.save();
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error: any) {
    console.error('Error in createTeam:', error); // Log error to console
    res.status(400).json({ error: error.message || 'Unknown error occurred' });
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.params;

  try {
    await Team.findByIdAndDelete(teamId);
    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};
