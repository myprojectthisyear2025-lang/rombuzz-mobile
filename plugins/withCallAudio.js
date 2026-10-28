/** Bundles Android call tones and registers the native call-audio bridge. */
const fs = require("fs");
const path = require("path");
const {
  withDangerousMod,
  withMainApplication,
} = require("expo/config-plugins");

module.exports = function withCallAudio(config) {
  const packageName = config.android.package;

  config = withMainApplication(config, (mod) => {
    const source = mod.modResults.contents;
    if (source.includes("RomBuzzCallAudio.Package()")) return mod;

    const anchor = /PackageList\(this\)\.packages\.apply\s*\{/;
    if (!anchor.test(source)) {
      throw new Error("Call audio: Kotlin package registration point not found");
    }

    mod.modResults.contents = source.replace(
      anchor,
      (match) => match + "\n          add(RomBuzzCallAudio.Package())",
    );

    return mod;
  });

  config = withDangerousMod(config, ["android", async (mod) => {
    const root = mod.modRequest.projectRoot;
    const android = mod.modRequest.platformProjectRoot;
    const java = path.join(
      android, "app/src/main/java", ...packageName.split("."),
    );
    const raw = path.join(android, "app/src/main/res/raw");

    fs.mkdirSync(java, { recursive: true });
    fs.mkdirSync(raw, { recursive: true });

    for (const name of ["RomBuzzCallAudio.java", "RomBuzzToneLoop.java"]) {
      const source = fs.readFileSync(
        path.join(__dirname, "callAudio", name),
        "utf8",
      );

      fs.writeFileSync(
        path.join(java, name),
        source.replace("__PACKAGE__", packageName),
      );
    }

    for (const [input, output] of [
      ["incoming.wav", "rbz_incoming.wav"],
      ["outgoing.wav", "rbz_outgoing.wav"],
    ]) {
      fs.copyFileSync(
        path.join(root, "assets/sounds/defaults", input),
        path.join(raw, output),
      );
    }

    return mod;
  }]);

  config.android.permissions = [...new Set([
    ...(config.android.permissions || []),
    "android.permission.VIBRATE",
  ])];

  return config;
};