// ===========================================================
// 📁 File: src/config/api.ts
// 🎯 Purpose: Shared API + Socket URLs for RomBuzz Mobile
// ===========================================================

// These match your WEB frontend config.js values:
//   PROD_API_BASE   → https://rombuzz-api-ulyk.onrender.com/api
//   PROD_SOCKET_URL → https://rombuzz-api-ulyk.onrender.com
// :contentReference[oaicite:3]{index=3}

const LOCAL_API_BASE = "http://localhost:4000/api";
const LOCAL_SOCKET_URL = "http://localhost:4000";

const PROD_API_BASE = "https://rombuzz-api-ulyk.onrender.com/api";
const PROD_SOCKET_URL = "https://rombuzz-api-ulyk.onrender.com";

// If you ever want to hit localhost from emulator, flip this to true
const USE_LOCAL = false;

export const API_BASE = USE_LOCAL ? LOCAL_API_BASE : PROD_API_BASE;
export const SOCKET_URL = USE_LOCAL ? LOCAL_SOCKET_URL : PROD_SOCKET_URL;
