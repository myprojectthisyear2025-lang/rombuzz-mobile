/**
 * 📁 File: plugins/withAgoraPip.js
 * 🎯 Purpose: Enable Android Picture-in-Picture for active Agora calls.
 * Used by: app.config.js during Expo prebuild and EAS native builds.
 * Changes: Declares PiP support and uses Agora's PiP-aware MainActivity.
 */

const {
  withAndroidManifest,
  withMainActivity,
} = require("@expo/config-plugins");

const PIP_CONFIG_CHANGES = [
  "screenSize",
  "smallestScreenSize",
  "screenLayout",
  "orientation",
  "uiMode",
];

function withAgoraPip(config) {
  config = withAndroidManifest(config, (mod) => {
    const activities =
      mod.modResults.manifest.application?.[0]?.activity || [];
    const mainActivity = activities.find((activity) =>
      String(activity.$?.["android:name"] || "").endsWith("MainActivity"),
    );

    if (!mainActivity) {
      throw new Error("withAgoraPip could not find the Android MainActivity.");
    }

    mainActivity.$["android:supportsPictureInPicture"] = "true";

    const existingChanges = String(
      mainActivity.$["android:configChanges"] || "",
    )
      .split("|")
      .filter(Boolean);

    mainActivity.$["android:configChanges"] = [
      ...new Set([...existingChanges, ...PIP_CONFIG_CHANGES]),
    ].join("|");

    return mod;
  });

  config = withMainActivity(config, (mod) => {
    const contents = mod.modResults.contents;
    const nativeActivityImport =
      "import io.agora.rtc.ng.react.AgoraPIPActivity";

    if (contents.includes("AgoraPIPActivity")) return mod;
    if (!contents.includes("import com.facebook.react.ReactActivity")) {
      throw new Error("withAgoraPip could not find the ReactActivity import.");
    }
    if (!contents.includes(": ReactActivity()")) {
      throw new Error("withAgoraPip could not find the MainActivity superclass.");
    }

    mod.modResults.contents = contents
      .replace(
        "import com.facebook.react.ReactActivity",
        nativeActivityImport,
      )
      .replace(": ReactActivity()", ": AgoraPIPActivity()");

    return mod;
  });

  return config;
}

module.exports = withAgoraPip;