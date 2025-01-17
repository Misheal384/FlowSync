import { Request, Response } from 'express';
import { Team } from '../models/Team';


import {web as slackClient} from '../config/slack';
import schedule from 'node-schedule';

//function required to create a team
export const createTeam = async (req: Request, res: Response): Promise<void> => {
  const { name, timezone } = req.body;
  console.log('Received POST /teams request with body:', req.body);

  try {
    // Step 1: Save the team to the database
    const team = new Team({ name, timezone });
    await team.save();

    // Step 2: Create a Slack channel
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
    // Step 1: Fetch channels from Slack workspace
    const response = await slackClient.conversations.list({
      types: 'public_channel,private_channel',  // You can specify the types of channels you want
    });

    // Step 2: Check if the API call was successful
    if (!response.ok) {
      res.status(400).json({ error: 'Failed to retrieve channels from Slack' });
      return;
    }

    // Step 3: Extract the channels from the response
    const channels = response.channels;

    // Step 4: Respond with the list of channels (teams)
    res.status(200).json({ teams: channels });
  } catch (error: any) {
    // Enhanced error logging
    console.error('Error in getTeams:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message || 'Unknown error occurred' });
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


