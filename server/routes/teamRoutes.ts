import express from 'express';
import { createTeam, deleteTeam } from '../controllers/teamController';

const router = express.Router();

// Create a new team
router.post('/teams', createTeam);

// Delete a team
router.delete('/teams/:teamId', deleteTeam);

export default router;
