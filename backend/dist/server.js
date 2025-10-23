"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const express_1 = __importDefault(require("express"));
const cors_1 = __importDefault(require("cors"));
const path_1 = __importDefault(require("path"));
const router_1 = require("./tests/router");
const app = (0, express_1.default)();
app.use((0, cors_1.default)({ origin: true, credentials: true }));
app.use(express_1.default.json());
// Health check endpoint
app.get('/api/health', (_req, res) => {
    res.json({ status: 'ok' });
});
app.use('/api/tests', router_1.testsRouter);
// Static frontend serving
const publicDir = path_1.default.join(__dirname, '../../public');
app.use(express_1.default.static(publicDir));
app.get('*', (_req, res) => {
    res.sendFile(path_1.default.join(publicDir, 'index.html'));
});
const port = process.env.PORT ? Number(process.env.PORT) : 4001;
app.listen(port, () => {
    console.log(`Server listening on http://localhost:${port}`);
});
