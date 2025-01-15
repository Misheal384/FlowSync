import express from 'express';
import { addMember, removeMember } from '../controllers/memberController';

const router = express.Router();

// Add a member to a team
router.post('/', addMember);

// Remove a member from a team
router.delete('/:memberId', removeMember);

export default router;
