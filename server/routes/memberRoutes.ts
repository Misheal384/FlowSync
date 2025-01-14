import express from 'express';
import { addMember, removeMember } from '../controllers/memberController';


const router = express.Router();

// Add a member to a team
router.post('/teams/:teamId/members', addMember);

// Remove a member from a team
router.delete('/teams/:teamId/members/:memberId', removeMember);

export default router;
