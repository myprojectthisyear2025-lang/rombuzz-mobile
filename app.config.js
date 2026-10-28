/**
 * ============================================================
 * 📁 File: app.config.js
 * 🎯 Purpose: Resolve RomBuzz native configuration by build variant.
 *
 * LOCATION:
 *   Project root / app.config.js
 *
 * USED BY:
 *   Expo CLI and EAS Build.
 *
 * RESPONSIBILITIES:
 *   - Keep development, preview, and production apps separate.
 *   - Enable native Sign in with Apple support on iOS.
 *   - Preserve all shared configuration from app.json.
 * ============================================================
 */

const VARIANTS = {
  development: {
    name: "RomBuzz Dev",
    appId: "com.rombuzz.app.dev",
  },
  preview: {
    name: "RomBuzz Preview",
    appId: "com.rombuzz.app.preview",
  },
  production: {
    name: "RomBuzz",
    appId: "com.rombuzz.app",
  },
};

module.exports = ({ config }) => {
  const baseConfig = config;

  const variantName = process.env.APP_VARIANT || "development";
  const variant = VARIANTS[variantName] || VARIANTS.development;
  const googleServicesFile = variantName === "development" ? undefined :
    process.env.GOOGLE_SERVICES_JSON || baseConfig.android?.googleServicesFile ||
    (variantName === "production" ? "./google-services.json" : undefined);

  const plugins = [
    ...(baseConfig.plugins || []),
    "@config-plugins/react-native-callkeep",
    "./plugins/withCallKeepMicrophone",
    "./plugins/withAgoraPip",
    "./plugins/withCallAudio",
    "expo-apple-authentication",
    [
      "@sentry/react-native/expo",
      {
        organization: process.env.SENTRY_ORG || "rombuzz",
        project: process.env.SENTRY_PROJECT || "rombuzz-mobile",
        url: "https://sentry.io/",
      },
    ],
  ];

  return {
    ...baseConfig,
    name: variant.name,

    ios: {
      ...baseConfig.ios,
      bundleIdentifier: variant.appId,
      usesAppleSignIn: true,
    },

    android: {
      ...baseConfig.android,
      package: variant.appId,
      googleServicesFile,
      blockedPermissions: [
        ...(baseConfig.android?.blockedPermissions || []),
        "android.permission.FOREGROUND_SERVICE_MEDIA_PROJECTION",
      ],
    },

    extra: {
      ...(baseConfig.extra || {}),
      appVariant: variantName,
      androidPushEnabled: !!googleServicesFile,
    },

    plugins,
  };
};