import express from 'express';
import cors from 'cors';
import { testsRouter } from './tests/router';

const app = express();

app.use(cors({ origin: true, credentials: true }));
app.use(express.json());

app.use('/api/tests', testsRouter);

const port = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(port, () => {
  console.log(`API listening on http://localhost:${port}`);
});


