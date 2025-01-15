import { App } from '@slack/bolt';
import dotenv from 'dotenv';

dotenv.config();

export const slackApp = new App({
  token: process.env.SLACK_BOT_TOKEN as string,          // Bot token
  signingSecret: process.env.SLACK_SIGNING_SECRET as string, // Signing secret
  socketMode: true,                                      // Enable Sockets Mode
  appToken: process.env.SLACK_APP_TOKEN as string,        // App token (xapp-...)
});
