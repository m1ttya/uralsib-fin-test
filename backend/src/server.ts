import express from 'express';
import cors from 'cors';
import path from 'path';
import { testsRouter } from './tests/router';

const app = express();
     
app.use(cors({ origin: true, credentials: true }));
app.use(express.json());
   
// Health check endpoint
app.get('/api/health', (_req, res) => {
   res.json({ status: 'ok' });
});

app.use('/api/tests', testsRouter);
   
// Serve frontend only in development
if (process.env.NODE_ENV !== 'production') {
  // Static frontend serving
  const publicDir = path.join(__dirname, '../../public');
  app.use(express.static(publicDir));
  app.get('*', (_req, res) => {
    res.sendFile(path.join(publicDir, 'index.html'));
  });
}
const port = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(port, () => {
   console.log(`Server listening on http://localhost:${port}`);
});
