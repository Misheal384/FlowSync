import express from 'express';
import { submitStandup, getStandupAnswers } from '../controllers/standupController';

const router = express.Router();

router.post('/teams/:teamId/members/:memberId/standup', submitStandup);
router.get('/', getStandupAnswers);

export default router;
    