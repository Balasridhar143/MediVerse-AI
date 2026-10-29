import dotenv from 'dotenv';
dotenv.config({ path: '.env.local' });
dotenv.config();

import app from './api/index.js';

const PORT = process.env.PORT || 8080;
const HOST = '0.0.0.0';

const server = app.listen(PORT, HOST, () => {
  console.log(`[Mediverse API] Production server listening on http://${HOST}:${PORT}`);
  console.log(`[Mediverse API] Database URL configured: ${Boolean(process.env.DATABASE_URL || process.env.POSTGRES_URL)}`);
});

export default server;
