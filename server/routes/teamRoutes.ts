import express from 'express';
import { createTeam, deleteTeam, scheduleTeamReminder } from '../controllers/teamController';

const router = express.Router();

// Create a new team
router.post('/', createTeam);

// Delete a team
router.delete('/:teamId', deleteTeam);

//schedule reminder for teams
router.post('/team-reminder', scheduleTeamReminder);


export default router;
