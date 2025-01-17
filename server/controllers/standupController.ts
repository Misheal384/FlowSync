import { Request, Response } from 'express';
import { Standup } from '../models/Standup';
import { Question } from '../models/Question';
import { Team } from '../models/Team';

//function to submit standup questions configured
export const configureStandupQuestions = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
    const { questions } = req.body;

    try {
      const team = await Team.findById(teamId);

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      await Question.deleteMany({ team: teamId });

      for (const question of questions) {
        const newQuestion = new Question({ team: teamId, text: question.text, answer: question.answer });
        await newQuestion.save();
      }

      res.status(201).json({ message: 'Standup questions configured successfully' });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    
  }
}

//function to get configured standup questions
export const getStandupQuestions = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;

    try {
      const questions = await Question.find({ team: teamId });
      res.json(questions);
    }
    catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }
  



//function to submit standup updates to the database
export const submitStandup = async (req: Request, res: Response): Promise<void> => {
  const { teamId, memberId } = req.params;
  const { update } = req.body; 

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
      update,
    });

    await standup.save();
    res.status(201).json({ message: 'Standup submitted successfully', standup });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


//function to get standup answers from the database
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