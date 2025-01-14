import express from 'express';
import dotenv from 'dotenv';
import teamRoutes from './server/routes/teamRoutes';
import memberRoutes from './server/routes/memberRoutes';
import { connectDB } from './server/config/database';
import { slackApp } from './server/config/slack';

dotenv.config();

const app = express();
app.use(express.json());

console.log("hey there");
console.log(process.env.SLACK_BOT_TOKEN);

// Connect to Database
connectDB();

//routes
app.get('/', (req, res) =>{
  res.send("ok");
 });
app.use('/teams',teamRoutes);
app.use('/teams/:teamId/members',memberRoutes);


// Start Slack Bot
(async () => {
  try {
    await slackApp.start(process.env.PORT ? parseInt(process.env.PORT) : 3000);
    console.log('⚡️ Slack Bolt app is running!');
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

