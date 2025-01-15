import { Request, Response } from 'express';
import { Member } from '../models/Member';
import { Team } from '../models/Team';
import { WebClient } from '@slack/web-api';
const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);
import schedule from 'node-schedule';

export const addMember = async (req: Request, res: Response): Promise<void> => {
  const { name, slackId } = req.body;
  const { teamId } = req.params;

  try {
    const member = new Member({ name, slackId, team: teamId });
    await member.save();
    await Team.findByIdAndUpdate(teamId, { $push: { members: member._id } });
    res.status(201).json({ message: 'Member added successfully', member });
  } catch (error: any) {
    res.status(400).json({ error: error.message });
  }
};

export const removeMember = async (req: Request, res: Response): Promise<void> => {
  const { teamId, memberId } = req.params;

  try {
    await Member.findByIdAndDelete(memberId);
    await Team.findByIdAndUpdate(teamId, { $pull: { members: memberId } });
    res.status(200).json({ message: 'Member removed successfully' });
  } catch (error: any) {
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

