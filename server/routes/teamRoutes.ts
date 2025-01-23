import express from 'express';
import { createTeam, deleteTeam, getTeams,getTeamsWithQuestions, scheduleTeamReminder, removeAllReminders, getTeamsWithStandupsAndMembers } from '../controllers/teamController';



const router = express.Router();

// get all team
router.get('/', getTeams);

//get all teams with questions
router.get('/questions', getTeamsWithQuestions);

//create a new team
router.post('/', createTeam);

// Delete a team
router.delete('/:teamId', deleteTeam);

//schedule reminder for teams
router.post('/team-reminder', scheduleTeamReminder);

//remove all reminders
router.delete('/team-reminder/:teamId', removeAllReminders);

//all teams with their standups
router.get('/standups', getTeamsWithStandupsAndMembers);


export default router;
