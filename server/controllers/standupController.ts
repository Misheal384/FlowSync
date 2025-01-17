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
    const slackResponse = await slackClient.conversations.info({ channel: teamId });
    const channelExists = slackResponse.ok && slackResponse.channel;

    if (!channelExists) {
      throw new Error(`Slack channel with ID ${teamId} not found`);
    }

    // Check if the team exists in the database
    let team = await Team.findOne({ slackChannelId: teamId });

    if (!team) {
      // If the team is not found, add it to the database
      if(slackResponse && slackResponse.channel){
        team = new Team({ name: slackResponse.channel.name, slackChannelId: teamId, timezone: 'UTC' });
        await team.save();
      }
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

  //function to get not responded members
  export const getNotResponded = async (req: Request, res: Response): Promise<void> => {
    const { teamId, date } = req.query;
  
    try {
      // Validate the date
      let formattedDate: string | undefined;
      if (date) {
        const parsedDate = new Date(date as string);
        if (isNaN(parsedDate.getTime())) {
          throw new Error('Invalid date format');
        }
        formattedDate = parsedDate.toISOString().split('T')[0];
      }
  
      const query: any = {};
      if (teamId) query.team = teamId;
      if (formattedDate) query.date = formattedDate;
  
      const standups = await Standup.find(query);
      const members = await Team.findOne({ slackChannelId: teamId }).populate('members');
  
      if (!members) {
        res.status(404).json({ error: 'Team not found' });
        return;
      }
  
      const respondedMembers = standups.map((standup) => standup.member.toString());
      const notResponded = members.members.filter((member: any) => !respondedMembers.includes(member._id.toString()));
  
      res.status(200).json({ notResponded });
    } catch (error: any) {
      res.status(400).json({ error: error.message });
    }
  };
  