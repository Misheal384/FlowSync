import express from 'express';
import dotenv from 'dotenv';
import teamRoutes from './server/routes/teamRoutes';
import memberRoutes from './server/routes/memberRoutes';
import standupRoutes from './server/routes/standupRoutes';
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

//a simple root route to the backend 
app.get('/', (req, res) =>{
  console.log('heath check');
  res.send("ok");
 });

// Register routes
app.use('/teams', teamRoutes); // No need for ':teamId' here
app.use('/teams/:teamId/members', memberRoutes); // Keep this as is
app.use('/standups', standupRoutes); // Register the standup routes



app.use((req, res) => {
  res.status(404).send(`Route not found: ${req.method} ${req.url}`);
});

//simple message to the bot
// Listen for messages in channels or direct messages
// Listen for messages
slackApp.message('hi', async ({ message, say }) => {
  // Type guard to ensure message has user property
  if ('user' in message) {
    try {
      await say({
        text: `Hello <@${message.user}>! 👋 How can I help you today?`,
        channel: message.channel
      });
    } catch (error) {
      console.error('Error sending message:', error);
    }
  }
});



// Start Slack Bot
// Start Slack Bot on a separate port
(async () => {
  try {
    const SLACK_PORT = 3000; 
    await slackApp.start(SLACK_PORT);
    console.log(`⚡️ Slack Bolt app is running on port ${SLACK_PORT}`);
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





