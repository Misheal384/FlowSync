import express from 'express';
import dotenv from 'dotenv';
import teamRoutes from './server/routes/teamRoutes';
import memberRoutes from './server/routes/memberRoutes';
import standupRoutes from './server/routes/standupRoutes';
import { connectDB } from './server/config/database';
import { slackApp } from './server/config/slack';

dotenv.config();

const app = express();
app.use(express.json());

// Connect to Database
connectDB();

// Health check endpoint
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



// Start Slack Bot
// Start Slack Bot on a separate port
(async () => {
  try {
    const SLACK_PORT = 3000; // Or any other available port
    await slackApp.start(SLACK_PORT);
    console.log(`⚡️ Slack Bolt app is running on port ${SLACK_PORT}`);
  } catch (error) {
    console.error('Error starting Slack app:', error);
    process.exit(1);
  }
})();

// Start Express Server
const PORT = process.env.PORT ? parseInt(process.env.PORT) : 5000;
app.listen(PORT, () => {
  console.log(`Express server is running on port ${PORT}`);
});





