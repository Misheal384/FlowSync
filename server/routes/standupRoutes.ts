import express from 'express';
import { submitStandup, getStandupAnswers, configureStandupQuestions } from '../controllers/standupController';

const router = express.Router();

//configure standup questions for a team
router.post('/teams/:teamId/configure', configureStandupQuestions);

//submit standup update
router.post('/teams/:teamId/members/:memberId/standup', submitStandup);

//get standup answers
router.get('/', getStandupAnswers);

export default router;
    