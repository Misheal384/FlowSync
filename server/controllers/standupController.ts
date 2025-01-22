import { Request, Response } from 'express';
import { Standup } from '../models/Standup';
import { Question } from '../models/Question';
import { Team } from '../models/Team';
import {web as slackClient} from '../config/slack';

//function to submit standup questions configured
export const configureStandupQuestions = async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.params;
  const { questions } = req.body;

  try {
    // Check if the Slack channel exists
    const channelExists = await Team.findOne({ slackChannelId: teamId });

    if (!channelExists) {
      throw new Error(`Slack channel with ID ${teamId} not found`);
    }

    // Delete existing questions for the team
    await Question.deleteMany({ team: teamId });

    // Add new questions
    for (const question of questions) {
      const newQuestion = new Question({ team: teamId, text: question.text, answer: question.answer });
      await newQuestion.save();
    }

    res.status(201).json({ message: 'Standup questions configured successfully' });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

//function to get configured standup questions
export const getStandupQuestions = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;

    try {
      const questions = await Question.find({ team: teamId });
      res.json({questions:questions});
    }
    catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }

//function to get all configured standup questions
export const getAllStandupQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const questions = await Question.find();
    res.json({ questions: questions });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};


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
  
      const standups = await Standup.find(query)
      .populate({ path: 'team', select: 'name', options: { strictPopulate: false } })
      .populate('member', 'name');

  
      res.status(200).json({ standups });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  //funtion to get standups for a team
    export const getTeamStandups = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.params;
  
    try {
      const standups = await Standup.find({ team: teamId }).populate('member', 'name').populate('team', 'name');
  
      res.status(200).json({ standups });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  }  

  /*function to get responders and non-responders
  this function is used to get the list of members who have not responded to the standup by checking the answers database and dates attached to them
  a date is attached to each standup update and if the date is not today, then the member has not responded. */
  export const getNotResponded = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.query;
  
    try {
      const today = new Date().toISOString().split('T')[0];
      const standups = await Standup.find({ team: teamId, date: today });
      const members = standups.map((standup) => standup.member);
  
      const allMembers = await Team.findById(teamId).select('members');
      const nonResponders = allMembers ? allMembers.members.filter((member: any) => !members.includes(member)) : [];
  
      res.status(200).json({ nonResponders });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  //also function to get responders and send them
  export const getResponded = async (req: Request, res: Response): Promise<void> => {
    const { teamId } = req.query;
  
    try {
      const today = new Date().toISOString().split('T')[0];
      const standups = await Standup.find({ team: teamId, date: today });
      const members = standups.map((standup) => standup.member);
  
      res.status(200).json({ members });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };

  //get all standups
  export const getAllStandups = async (req: Request, res: Response): Promise<void> => {
    try {
      const standups = await Standup.find().populate('member', 'name').populate('team', 'name');
      res.status(200).json({ standups });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
