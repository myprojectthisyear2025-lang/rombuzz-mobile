/**
 * File: plugins/withCallKeepMicrophone.js
 * Purpose: Adds microphone support to CallKeep's Android foreground service.
 */

const { AndroidConfig, withAndroidManifest } = require("expo/config-plugins");

module.exports = function withCallKeepMicrophone(config) {
  return withAndroidManifest(config, (config) => {
    const app = AndroidConfig.Manifest.getMainApplicationOrThrow(
      config.modResults,
    );

    app.service = app.service ?? [];

    let service = app.service.find(
      (item) =>
        item.$["android:name"] ===
        "io.wazo.callkeep.VoiceConnectionService",
    );

    if (!service) {
      service = {
        $: {
          "android:name": "io.wazo.callkeep.VoiceConnectionService",
          "android:permission":
            "android.permission.BIND_TELECOM_CONNECTION_SERVICE",
          "android:exported": "true",
        },
        "intent-filter": [
          {
            action: [
              {
                $: {
                  "android:name": "android.telecom.ConnectionService",
                },
              },
            ],
          },
        ],
      };
      app.service.push(service);
    }

    service.$["android:foregroundServiceType"] = "phoneCall|microphone";
    return config;
  });
};