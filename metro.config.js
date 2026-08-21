/**
 * ============================================================
 * 📁 File: metro.config.js
 * 🎯 Purpose: Configure Expo Metro with Sentry source maps.
 *
 * Used by:
 *   - Expo CLI
 *   - Development builds
 *   - EAS Build
 *
 * Sentry uses this to generate Debug IDs and readable
 * production stack traces.
 * ============================================================
 */

const {
  getSentryExpoConfig,
} = require("@sentry/react-native/metro");

const config = getSentryExpoConfig(__dirname);

module.exports = config;