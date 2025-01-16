import { Request, Response } from 'express';
import { Standup } from '../models/Standup';
import { Team } from '../models/Team';

export const submitStandup = async (req: Request, res: Response): Promise<void> => {
  const { teamId, memberId } = req.params;
  const { answers } = req.body; // Array of { question, answer }

  try {
    const team = await Team.findById(teamId);

    if (!team) {
      throw new Error(`Team with ID ${teamId} not found`);
    }

    const today = new Date().toISOString().split('T')[0]; // Ensure date consistency
    const existingStandup = await Standup.findOne({
      team: teamId,
      member: memberId,
      date: today,
    });

    if (existingStandup) {
      res.status(400).json({ message: 'Standup already submitted for today' });
    }

    const standup = new Standup({
      team: teamId,
      member: memberId,
      date: today,
      answers,
    });

    await standup.save();
    res.status(201).json({ message: 'Standup submitted successfully', standup });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const getStandupAnswers = async (req: Request, res: Response): Promise<void> => {
    const { teamId, date, memberId } = req.query;
  
    try {
      const query: any = {};
      if (teamId) query.team = teamId;
      if (date) query.date = new Date(date as string).toISOString().split('T')[0];
      if (memberId) query.member = memberId;
  
      const standups = await Standup.find(query).populate('member', 'name').populate('team', 'name');
  
      res.status(200).json({ standups });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
    export const getTeamStandups = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
  
    try {
      const standups = await Standup.find({ team: teamId }).populate('member', 'name').populate('team', 'name');
  
      res.status(200).json({ standups });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }  