import express from 'express';
import dotenv from 'dotenv';
import teamRoutes from './server/routes/teamRoutes';
import memberRoutes from './server/routes/memberRoutes';
import { connectDB } from './server/config/database';
import { slackApp } from './server/config/slack';

//swagger ui implementation
import swaggerUi from "swagger-ui-express";
import swaggerSpec from "./swaggerConfig";

dotenv.config();

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

// Health check endpoint
app.use("/api-docs", swaggerUi.serve, swaggerUi.setup(swaggerSpec));
app.get('/', (req, res) =>{
  res.send("ok");
 });

// Register routes
app.use('/teams', teamRoutes); // No need for ':teamId' here
app.use('/teams/:teamId/members', memberRoutes); // Keep this as is


app.use((req, res) => {
  res.status(404).send(`Route not found: ${req.method} ${req.url}`);
});

//simple message to the bot
// Listen for messages in channels or direct messages
// Listen for messages
slackApp.message(async ({ message, client }) => {
  // Type narrowing: Check if `message` has a `user` property
  if ('user' in message && typeof message.user === 'string') {
    try {
      // Send a reply in the same channel
      await client.chat.postMessage({
        channel: message.channel,
        text: `Hello <@${message.user}>! You said: "${message.text}"`,
        thread_ts: message.ts, // Reply in a thread if needed
      });
    } catch (error) {
      console.error('Error replying to message:', error);
    }
  } else {
    console.log('Received a message without a user property:', message);
  }
});

// Start Slack Bot
(async () => {
  try {
    await slackApp.start(process.env.PORT ? parseInt(process.env.PORT) : 5000);
    console.log('⚡️ FlowSync app is running!');
  } catch (error) {
    console.error('Error starting FlowSync app:', error);
    process.exit(1);
  }
})();

// Start Express Server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});





