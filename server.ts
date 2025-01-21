import express from 'express';
import dotenv from 'dotenv';
import teamRoutes from './server/routes/teamRoutes';
import memberRoutes from './server/routes/memberRoutes';
import standupRoutes from './server/routes/standupRoutes';
import { connectDB } from './server/config/database';
import { slackApp } from './server/config/slack';
import { appMentionRespond, greetingRespond } from './server/slack_activities/interactions';
import { home_pub } from './server/slack_activities/slack_home';

import {web as slackClient} from './server/config/slack';
import { Team } from './server/models/Team';
import {redisClient} from './server/config/redis';



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
app.use('/members', memberRoutes); // Keep this as is
app.use('/standups', standupRoutes); // Register the standup routes
app.use((req, res) => {
  res.status(404).send(`Route not found: ${req.method} ${req.url}`);
});

//geting all teams and their members
async function getChannelMembers(channelId: string) {
  try {
    // Fetch members of the channel
    const response = await slackClient.conversations.members({
      channel: channelId,
    });

    if (response.ok) {
      return response.members;
    } else {
      throw new Error('Error fetching members');
    }
  } catch (error) {
    console.error(`Error fetching members for channel ${channelId}:`, error);
    return [];
  }
}

// Function to fetch channels and their members
async function getTeamsWithMembers() {
  try {
    // Fetch the list of channels
    const response = await slackClient.conversations.list();

    if (response.ok) {
      const channels = response.channels;

      // Fetch members for each channel
      if(channels){
        const teamsWithMembers = await Promise.all(
          channels.map(async (channel) => {
            if(channel.id){
              const members = await getChannelMembers(channel.id);
              return {
                id: channel.id,
                name: channel.name,
                members: members,
              };
            }
          })
        );
        return teamsWithMembers;
      }

    } else {
      throw new Error('Error fetching channels');
    }
  } catch (error) {
    console.error('Error fetching channels and members:', error);
    return [];
  }
}

// Run the function to get teams with members
getTeamsWithMembers().then(async (teamsWithMembers) => {
  if (teamsWithMembers) {
    try {
      // Iterate using for...of to properly handle async operations sequentially
      for (const team of teamsWithMembers) {
        if (team && team.id) {
          const existingTeam = await Team.findOne({ slackChannelId: team.id });
          if (!existingTeam) {
            await Team.create({
              slackChannelId: team.id,
              name: team.name,
              members: team.members,
              timezone: "UTC"
            });
          }
        }
      }
      console.log('All teams and their members have been processed successfully');('All teams and their members have been processed successfully');
    } catch (error) {
      console.error('Error while processing teams:', error);
    }
  }
});

//now get all members from slack and then name take on their name and id and cache it in redis
async function cacheMembersInRedis() {
  try {
    const response = await slackClient.users.list({});
    await redisClient.connect()

    if (response.ok) {
      const members = response.members;

      if (members) {
        for (const member of members) {
          if (member.id && member.name) {
            await redisClient.set(`slackUser:${member.id}`, member.name);
          }
        }
        console.log('All members have been cached in Redis successfully');
      }
    } else {
      throw new Error('Error fetching members');
    }
  } catch (error) {
    console.error('Error caching members in Redis:', error);
  }
}

// Run the function to cache members in Redis
cacheMembersInRedis();





//slack interactions
appMentionRespond();
greetingRespond();

//slack rendering
home_pub();



// Start Slack Bot
(async () => {
  try {
    const SLACK_PORT = 3000; 
    await slackApp.start(SLACK_PORT);
    
    console.log(`⚡️ FlowSync app is running on port ${SLACK_PORT}`);
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





