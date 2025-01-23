import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { Question} from '../models/Question';
import { Standup } from '../models/Standup';



import {web as slackClient} from '../config/slack';
import schedule from 'node-schedule';
// A map to store scheduled jobs for each channel
const channelJobs = new Map<string, schedule.Job[]>();

//function required to create a team
export const createTeam = async (req: Request, res: Response): Promise<void> => {
  const { name, description } = req.body;
  console.log('Received POST /teams request with body:', req.body);

  try {
    const team = new Team({ name, description});
    await team.save();

    const channelName = `team-${team.name.toLowerCase().replace(/\s+/g, '-')}`; // Format channel name
    const slackChannelResponse = await slackClient.conversations.create({
      name: channelName,
      is_private: false, // Set to `false` if you want it to be a public channel
    });

    //get the slack channel details after successfully creating it
    if (slackChannelResponse && slackChannelResponse.channel){
      team.slackChannelId = slackChannelResponse.channel.id as string;  
      await team.save();
    }

    //respond if successful
    res.status(201).json({
      message: 'Team created successfully',
      team,
      slackChannel: slackChannelResponse.channel,
    });
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

//function required to get all teams
export const getTeams = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find();
    res.json(teams);
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in getAllTeams:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};

//get all teams and the questions attached to them
export const getTeamsWithQuestions = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find();
    const teamsWithQuestions = await Promise.all(
      teams.map(async (team) => {
        const questions = await Question.find({ team: team.slackChannelId });
        return {
          team,
          questions,
        };
      })
    );
    res.json(teamsWithQuestions);
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in getTeamsWithQuestions:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};

//function required to delete a team
export const deleteTeam = async (req: Request, res: Response): Promise<void> => {
  const teamId = req.params.teamId;

  try {
    const team = await Team.findByIdAndDelete(teamId);

    if (!team) {
      res.status(404).json({ message: 'Team not found' });
      return;
    }

    // Delete the Slack channel associated with the team
    await slackClient.conversations.archive({ channel: team.slackChannelId });

    res.status(200).json({ message: 'Team deleted successfully' });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in deleteTeam:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};



function scheduleDailyChannelReminder(team: string, text: string, startTime: Date): void {
  const rule = new schedule.RecurrenceRule();
  rule.hour = startTime.getUTCHours();
  rule.minute = startTime.getUTCMinutes();

  const job = schedule.scheduleJob(rule, async () => {
    try {
      const result = await slackClient.chat.postMessage({
        channel: team,
        text,
      });
      console.log(`Daily reminder sent to channel ${team}:`, result);
    } catch (error) {
      console.error(`Failed to send reminder to channel ${team}:`, error);
    }
  });

  // Track jobs for this channel
  if (!channelJobs.has(team)) {
    channelJobs.set(team, []);
  }
  channelJobs.get(team)!.push(job);
}

//function for a controller to set team reminder
export const scheduleTeamReminder = async (req: Request, res: Response): Promise<void> => {
  const { team, text, time } = req.body;

  try {
    scheduleDailyChannelReminder(team, text, new Date(time));
    res.status(200).json({ message: 'Reminder scheduled successfully' });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in scheduleTeamReminder:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(400).json({ error: error.message });
  }
};

//function to remove all reminders for a channel
function removeAllRemindersForChannel(team: string): void {
  if (channelJobs.has(team)) {
    const jobs = channelJobs.get(team)!;
    jobs.forEach(job => job.cancel()); // Cancel each job
    channelJobs.delete(team); // Remove the entry for this channel
    console.log(`All reminders for channel ${team} have been removed.`);
  } else {
    console.log(`No reminders found for channel ${team}.`);
  }
}

//function to serve as controller to remove all reminders
export const removeAllReminders = async (req: Request, res: Response): Promise<void> => {
  const team = req.params.team;

  try {
    removeAllRemindersForChannel(team);
    res.status(200).json({ message: 'All reminders removed successfully for team' });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in removeAllReminders:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};


//get all teams with their standups and members associated with them
export const getTeamsWithStandupsAndMembers = async (req: Request, res: Response): Promise<void> => {
  try {
    const teams = await Team.find();
    const teamsWithStandupsAndMembers = await Promise.all(
      teams.map(async (team) => {
        const standups = await Standup.find({ team: team._id });
        const members = await slackClient.conversations.members({ channel: team.slackChannelId });
        return {
          team,
          standups,
          members,
        };
      })
    );
    res.json(teamsWithStandupsAndMembers);
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in getTeamsWithStandupsAndMembers:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message });
  }
};


