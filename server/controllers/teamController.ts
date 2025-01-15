import { Request, Response } from 'express';
import { Team } from '../models/Team';

export const createTeam = async (req: Request, res: Response): Promise<void> => {
  const { name, timezone, schedule } = req.body;
  console.log('Received POST /teams request with body:', req.body);
  try {
    const team = new Team({ name, timezone, schedule });
    await team.save();
    res.status(201).json({ message: 'Team created successfully', team });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in createTeam:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(400).json({ error: error.message || 'Unknown error occurred' });
  }
};

export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.params;

  try {
    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in deleteTeam:', {
      message: error.message,
      stack: error.stack,
      params: req.params,
    });

    res.status(400).json({ error: error.message });
  }
};

