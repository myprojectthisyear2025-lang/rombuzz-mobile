/** Adds PiP rendering lifecycle hooks to the existing generated MainActivity. */
const METHODS = `
  // RBZ_PIP_RENDERING_BEGIN
  private var rbzActivityPaused = false
  private var rbzReactResumedForPip = false

  private fun rbzResumeReactForPip() {
    if (!rbzActivityPaused || rbzReactResumedForPip) return
    if (android.os.Build.VERSION.SDK_INT < 26 || !isInPictureInPictureMode) return
    val app = application as com.facebook.react.ReactApplication
    if (com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.bridgelessEnabled) {
      app.reactHost?.onHostResume(this, this)
    } else {
      app.reactNativeHost.reactInstanceManager.onHostResume(this, this)
    }
    rbzReactResumedForPip = true
  }

  private fun rbzPauseReactAfterPip() {
    if (!rbzReactResumedForPip) return
    val app = application as com.facebook.react.ReactApplication
    if (com.facebook.react.defaults.DefaultNewArchitectureEntryPoint.bridgelessEnabled) {
      app.reactHost?.onHostPause(this)
    } else {
      app.reactNativeHost.reactInstanceManager.onHostPause(this)
    }
    rbzReactResumedForPip = false
  }

  override fun onPause() {
    super.onPause()
    rbzActivityPaused = true
    rbzResumeReactForPip()
  }

  override fun onResume() {
    rbzActivityPaused = false
    rbzReactResumedForPip = false
    super.onResume()
  }

  override fun onStop() {
    rbzPauseReactAfterPip()
    super.onStop()
  }
  // RBZ_PIP_RENDERING_END
`;

module.exports = function addPipLifecycle(contents) {
  if (contents.includes("// RBZ_PIP_RENDERING_BEGIN")) return contents;

  if (/override fun (onPause|onResume|onStop)\s*\(/.test(contents)) {
    throw new Error("RomBuzz PiP: conflicting MainActivity lifecycle overrides.");
  }

  const callback = "    rbzEmitPip(\"rbz:pip:state\", inPip)";
  if (!contents.includes(callback)) {
    throw new Error("RomBuzz PiP: state callback was not found.");
  }

  const activity = /class MainActivity\s*:\s*AgoraPIPActivity\(\)\s*\{/;
  if (!activity.test(contents)) {
    throw new Error("RomBuzz PiP: MainActivity was not found.");
  }

  return contents.replace(activity, (match) => match + METHODS).replace(
    callback,
    "    if (inPip) rbzResumeReactForPip()\n" +
      "    else rbzPauseReactAfterPip()\n" + callback,
  );
};