import express from 'express';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const serverDir = path.dirname(fileURLToPath(import.meta.url));
const publicDir = path.join(serverDir, '../public');

const app = express();
const PORT = 3000;

app.use(express.static(publicDir));

app.get('/health', (req, res) => {
    res.json({ status: 'ok' });
});

app.listen(PORT, () => {
    console.log(`Server running at http://localhost:${PORT}`);
});