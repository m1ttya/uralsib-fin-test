import express from 'express';
import cors from 'cors';
import { testsRouter } from './tests/router';

const app = express();
     
app.use(cors()); // Allow all origins for Vercel Serverless Function
app.use(express.json());
   
// Health check endpoint
app.get('/api/health', (_req, res) => {
   res.json({ status: 'ok' });
});

app.use('/api/tests', testsRouter);
   
export default app;
