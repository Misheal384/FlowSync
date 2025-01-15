import { App } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();
export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN as string,
  signingSecret: process.env.SLACK_SIGNING_SECRET as string,
});
