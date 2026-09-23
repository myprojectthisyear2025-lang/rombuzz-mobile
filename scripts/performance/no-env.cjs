/** Path: scripts/performance/no-env.cjs
 * Purpose: Prevent local synthetic backend tests from reading any checkout .env or production credentials. */
const { createRequire } = require('node:module');
const path = require('node:path');
const load = createRequire(path.join(process.cwd(), 'package.json'));
const dotenv = load('dotenv');
dotenv.config = dotenv.configDotenv = () => ({ parsed: {} });
