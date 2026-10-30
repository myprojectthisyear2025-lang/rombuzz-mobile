/**
 * Adds Android PiP state events and a dedicated RomBuzz hang-up action.
 */
const METHODS = `
  private var rbzPipReceiverRegistered = false
  private val rbzPipAction get() = packageName + ".RBZ_PIP_END"

  private val rbzPipReceiver = object : android.content.BroadcastReceiver() {
    override fun onReceive(
      context: android.content.Context?,
      intent: android.content.Intent?
    ) {
      if (intent?.action == rbzPipAction) {
        rbzEmitPip("rbz:pip:end", true)
      }
    }
  }

  private fun rbzEmitPip(name: String, value: Boolean) {
    val app = application as com.facebook.react.ReactApplication
    val context = app.reactHost?.currentReactContext
      ?: app.reactNativeHost.reactInstanceManager.currentReactContext

    context?.getJSModule(
      com.facebook.react.modules.core.DeviceEventManagerModule.RCTDeviceEventEmitter::class.java
    )?.emit(name, value)
  }

  override fun onStart() {
    super.onStart()

    if (!rbzPipReceiverRegistered) {
      androidx.core.content.ContextCompat.registerReceiver(
        this,
        rbzPipReceiver,
        android.content.IntentFilter(rbzPipAction),
        androidx.core.content.ContextCompat.RECEIVER_NOT_EXPORTED
      )
      rbzPipReceiverRegistered = true
    }

    if (android.os.Build.VERSION.SDK_INT >= 26) {
      rbzEmitPip("rbz:pip:state", isInPictureInPictureMode)
    }
  }

  override fun onPictureInPictureModeChanged(
    inPip: Boolean,
    newConfig: android.content.res.Configuration
  ) {
    super.onPictureInPictureModeChanged(inPip, newConfig)
    rbzEmitPip("rbz:pip:state", inPip)

    if (android.os.Build.VERSION.SDK_INT >= 26) {
      val actions = mutableListOf<android.app.RemoteAction>()

      if (inPip) {
        val intent = android.content.Intent(rbzPipAction)
          .setPackage(packageName)

        val pending = android.app.PendingIntent.getBroadcast(
          this,
          9182,
          intent,
          android.app.PendingIntent.FLAG_UPDATE_CURRENT or
            android.app.PendingIntent.FLAG_IMMUTABLE
        )

        actions.add(android.app.RemoteAction(
          android.graphics.drawable.Icon.createWithResource(
            this,
            android.R.drawable.ic_menu_close_clear_cancel
          ),
          "End call",
          "End RomBuzz video call",
          pending
        ))
      }

      setPictureInPictureParams(
        android.app.PictureInPictureParams.Builder()
          .setActions(actions)
          .build()
      )
    }
  }

  override fun onDestroy() {
    if (rbzPipReceiverRegistered) {
      unregisterReceiver(rbzPipReceiver)
      rbzPipReceiverRegistered = false
    }

    super.onDestroy()
  }
`;

module.exports = function addRomBuzzPipControls(contents) {
  const addPipLifecycle = require("./romBuzzPipLifecycle");
  if (contents.includes("private var rbzPipReceiverRegistered")) {
    return addPipLifecycle(contents);
  }

  if (
    /override fun (onStart|onDestroy|onPictureInPictureModeChanged)\s*\(/.test(
      contents,
    )
  ) {
    throw new Error(
      "RomBuzz PiP: MainActivity already overrides a required lifecycle method.",
    );
  }

  const pattern = /class MainActivity\s*:\s*AgoraPIPActivity\(\)\s*\{/;

  if (!pattern.test(contents)) {
    throw new Error("RomBuzz PiP: Kotlin MainActivity class not found.");
  }

  return addPipLifecycle(
    contents.replace(pattern, (match) => match + "\n" + METHODS),
  );
};