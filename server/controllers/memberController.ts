import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { Team } from '../models/Team';
// import { WebClient } from '@slack/web-api';
// const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

import {web as slackClient} from '../config/slack';
import schedule from 'node-schedule';

//function to  add member to a team
export const addMembers = async (req: Request, res: Response): Promise<void> => {
  const { members } = req.body; // Expecting an array of members
  const { teamId } = req.params;

  if (!Array.isArray(members)) {
    res.status(400).json({ error: 'Invalid request body. "members" should be an array.' });
    return;
  }

  try {
    const slackChannelId = teamId;
    const teamUpdates: any[] = []; // To keep track of successful updates

    for (const member of members) {
      const { name, slackId } = member;

      if (!name || !slackId) {
        res.status(400).json({ error: 'Each member must have "name" and "slackId".' });
        return;
      }

      // Invite the member to the Slack channel
      await slackClient.conversations.invite({
        channel: slackChannelId,
        users: slackId,
      });

      // Update the team in the database
      const team = await Team.findByIdAndUpdate(
        teamId,
        { $push: { members: slackId } },
        { new: true }
      );

      if (!team) {
        throw new Error(`Team with ID ${teamId} not found`);
      }

      teamUpdates.push({ name, slackId });
    }

    res.status(201).json({
      message: 'Members added successfully',
      addedMembers: teamUpdates,
    });
  } catch (error: any) {
    console.error('Error in addMembers:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message || 'Unknown error occurred' });
  }
};


//get all members from the workspace
export const getAllUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    let allUsers : any = [];
    let cursor: string | undefined = undefined;

    // Loop to handle pagination if there are more than 100 users
    do {
      // Passing an empty object or an object with cursor to users.list
      const response = await slackClient.users.list({ cursor });

      if (response.ok) {
        if (response.members) {
          allUsers = [...allUsers, ...response.members];
        }
        cursor = response.response_metadata?.next_cursor; // Get the next cursor if it exists
      }else{
        res.status(400).json({ error: 'Failed to retrieve users from Slack' });
         return;
      }

    } while (cursor);  // Continue until there's no more data

    // Respond with the full list of users
    res.status(200).json({ users: allUsers });
  } catch (error: any) {
    console.error('Error in getAllUsers:', {
      message: error.message,
      stack: error.stack,
    });

    res.status(400).json({ error: error.message || 'Unknown error occurred' });
  }
};

//get all members from a team
export const getMembers = async (req: Request, res: Response): Promise<void> => {
  const { teamId } = req.params;

  try {
    // Find the team in your database
    const team = await Team.findOne({ slackChannelId: teamId }).populate('members');
    if (!team) {
      res.status(404).json({ error: 'Team not found' });
      return;
    }

    // Fetch channel members from Slack API
    const response = await slackClient.conversations.members({ channel: teamId });
    const slackMemberIds = response.members;
    console.log(response)

    if (!slackMemberIds) {
      res.status(404).json({ error: 'No members found in the Slack channel' });
      return;
    }

    // Respond with the team's name and Slack members
    res.status(200).json({ name: team.name, members: slackMemberIds });
  } catch (error: any) {
    console.error('Error fetching channel members:', error);
    res.status(400).json({ error: error.message });
  }
};

//function to remove slack members from a team by their id
export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { teamId, memberId } = req.params; // Ensure these are sent in the request body

  try {
    // Use Slack API to kick the user from the channel
    await slackClient.conversations.kick({
      channel: teamId,
      user: memberId,
    });

    //also remove the member from the team in the database
    await Team.findOneAndUpdate({ slackChannelId: teamId }, { $pull: { members: memberId } });

    res.status(200).json({ message: `User ${memberId} has been removed from channel ${teamId}.` });
  } catch (error: any) {
    console.error('Error removing user from channel:', error);
    res.status(400).json({ error: error.message });
  }
};

//sending reminders to a team member
export function scheduleMemberReminder(channel: string, text: string, scheduleTime: Date, memberId: string): void {
  schedule.scheduleJob(scheduleTime, async () => {
      try {
          const member = await Member.findById(memberId);
          if (!member) {
              throw new Error(`Member with ID ${memberId} not found`);
          }

          const result = await slackClient.chat.postMessage({
              channel,
              text: `${member.name}, ${text}`,
          });
          console.log(`Reminder sent to channel ${channel}:`, result);
      } catch (error) {
          console.error(`Failed to send reminder to channel ${channel}:`, error);
      }
  });
}

