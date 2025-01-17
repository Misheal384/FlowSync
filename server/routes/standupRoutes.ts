import express from 'express';
import { submitStandup, getStandupAnswers, configureStandupQuestions, getStandupQuestions, getNotResponded } from '../controllers/standupController';

const router = express.Router();

//configure standup questions for a team
router.post('/teams/:teamId/configure', configureStandupQuestions);

//get standup questions
router.get('/teams/:teamId/questions', getStandupQuestions);

//submit standup update
router.post('/teams/:teamId/members/:memberId/standup', submitStandup);

//get standup answers
router.get('/answers', getStandupAnswers);

//get not responded
router.get('/not-responded', getNotResponded);


export default router;
    