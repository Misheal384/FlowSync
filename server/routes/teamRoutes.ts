import express from 'express';
import { createTeam, deleteTeam, getTeams, scheduleTeamReminder } from '../controllers/teamController';



const router = express.Router();

// get all team
router.get('/', getTeams);

//create a new team
router.post('/', createTeam);

// Delete a team
router.delete('/:teamId', deleteTeam);

//schedule reminder for teams
router.post('/team-reminder', scheduleTeamReminder);


export default router;
