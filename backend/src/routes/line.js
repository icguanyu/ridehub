import { Router } from 'express';
import { webhook } from '../controllers/lineController.js';

export const lineRouter = Router();

// LINE 平台的 webhook 回呼
lineRouter.post('/webhook', webhook);
