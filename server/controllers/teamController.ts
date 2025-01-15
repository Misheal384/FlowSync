import { Request, Response } from 'express';
import { Team } from '../models/Team';
import { WebClient } from '@slack/web-api';
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
import schedule from 'node-schedule';


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


//sending usual reminders to teams
function scheduleChannelReminder(channel: string, text: string, scheduleTime: Date): void {
  schedule.scheduleJob(scheduleTime, async () => {
      try {
          const result = await slackClient.chat.postMessage({
              channel,
              text,
          });
          console.log(`Reminder sent to channel ${channel}:`, result);
      } catch (error) {
          console.error(`Failed to send reminder to channel ${channel}:`, error);
      }
  });
}

//set team reminder using arguments set in the post request
export function scheduleTeamReminder(req: Request, res: Response): void {
  const { channel, text, scheduleTime } = req.body;
  console.log('Received POST /teams/team-reminder request with body:', req.body);
  try {
    scheduleChannelReminder(channel, text, scheduleTime);
    res.status(201).json({ message: 'Team reminder scheduled successfully' });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in scheduleTeamReminder:', {
      message: error.message,
      stack: error.stack,
      body: req.body,
    });

    res.status(400).json({ error: error.message || 'Unknown error occurred' });
  }
}


