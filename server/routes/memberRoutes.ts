import express from 'express';
import { addMember, removeMember } from '../controllers/memberController';

const router = express.Router();

// Add a member to a team
/**
 * @swagger
 * /:
 *   post:
 *     summary: Add a member to team
 *    
 *     responses:
 *       200:
 *         description: Success
 */
router.post('/', addMember);

// Remove a member from a team
/**
 * @swagger
 * /:
 *   get: 
 *     summary: Delete team member
 *     parameters:
 *       MemberId:
 *          description: team member id
 *     
 *     responses:
 *       200:
 *         description: Success
 */
router.delete('/:memberId', removeMember);

export default router;
