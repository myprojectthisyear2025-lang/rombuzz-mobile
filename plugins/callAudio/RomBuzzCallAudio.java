/** Android ringtone/call streams, silent-mode policy, looping and a native 30-second cutoff. */
package __PACKAGE__;
import android.app.Activity;
import android.content.*;
import android.media.*;
import android.os.*;
import androidx.core.content.ContextCompat;
import com.facebook.react.*;
import com.facebook.react.bridge.*;
import com.facebook.react.modules.core.DeviceEventManagerModule;
import com.facebook.react.uimanager.ViewManager;
import java.util.*;
public final class RomBuzzCallAudio extends ReactContextBaseJavaModule
    implements LifecycleEventListener {
  private final Handler main = new Handler(Looper.getMainLooper());
  private MediaPlayer player;
  private boolean prepared = false;
  private String owner = "", kind = "";
  private long generation = 0;
  private int previousStream = AudioManager.USE_DEFAULT_STREAM_TYPE;
  private int targetStream = AudioManager.USE_DEFAULT_STREAM_TYPE;
  private Runnable expiry;
  private final BroadcastReceiver modeReceiver = new BroadcastReceiver() {
    @Override public void onReceive(Context c, Intent intent) {
      main.post(() -> applyRingerMode());
    }
  };
  public RomBuzzCallAudio(ReactApplicationContext context) {
    super(context);
    context.addLifecycleEventListener(this);
    ContextCompat.registerReceiver(context, modeReceiver,
      new IntentFilter(AudioManager.RINGER_MODE_CHANGED_ACTION),
      ContextCompat.RECEIVER_NOT_EXPORTED);
  }
  @Override public String getName() { return "RomBuzzCallAudio"; }
  private AudioManager audio() {
    return (AudioManager) getReactApplicationContext()
      .getSystemService(Context.AUDIO_SERVICE);
  }
  private Vibrator vibrator() {
    return (Vibrator) getReactApplicationContext()
      .getSystemService(Context.VIBRATOR_SERVICE);
  }
  private void setStream(String id, int stream) {
    Activity activity = getCurrentActivity();
    if (owner.isEmpty() && activity != null)
      previousStream = activity.getVolumeControlStream();
    owner = id;
    targetStream = stream;
    if (activity != null) activity.setVolumeControlStream(stream);
  }
  private void applyRingerMode() {
    if (kind.isEmpty()) return;
    boolean audible = kind.equals("outgoing") ||
      audio().getRingerMode() == AudioManager.RINGER_MODE_NORMAL;
    if (player != null && prepared) {
      try {
        player.setVolume(audible ? 1f : 0f, audible ? 1f : 0f);
      } catch (Exception ignored) {}
    }
    Vibrator v = vibrator();
    if (v == null || !v.hasVibrator()) return;
    v.cancel();
    if (kind.equals("incoming") &&
        audio().getRingerMode() == AudioManager.RINGER_MODE_VIBRATE) {
      AudioAttributes attrs = new AudioAttributes.Builder()
        .setUsage(AudioAttributes.USAGE_NOTIFICATION_RINGTONE).build();
      if (Build.VERSION.SDK_INT >= 26) {
        v.vibrate(
          VibrationEffect.createWaveform(new long[]{0, 350, 1400}, 0),
          attrs);
      } else {
        v.vibrate(new long[]{0, 350, 1400}, 0, attrs);
      }
    }
  }
  private void stopPlayer() {
    generation++;
    if (expiry != null) main.removeCallbacks(expiry);
    expiry = null;
    kind = "";
    if (player != null) { player.release(); player = null; }
    prepared = false;
    Vibrator v = vibrator();
    if (v != null) v.cancel();
  }
  @ReactMethod public void startTone(
      String id, String type, double remainingMs) {
    main.post(() -> {
      stopPlayer();
      if (remainingMs <= 0) return;
      boolean incoming = type.equals("incoming");
      setStream(id, incoming
        ? AudioManager.STREAM_RING : AudioManager.STREAM_VOICE_CALL);
      kind = type;
      long ticket = generation;
      expiry = () -> {
        stopPlayer();
        if (incoming) releaseNow(id);
        WritableMap event = Arguments.createMap();
        event.putString("callId", id);
        getReactApplicationContext().getJSModule(
          DeviceEventManagerModule.RCTDeviceEventEmitter.class)
          .emit("rbz:call:ringExpired", event);
      };
      main.postDelayed(expiry, Math.min(30000L, (long) remainingMs));
      try {
        int resource = getReactApplicationContext().getResources()
          .getIdentifier(incoming ? "rbz_incoming" : "rbz_outgoing",
            "raw", getReactApplicationContext().getPackageName());
        if (resource == 0)
          throw new IllegalStateException("Bundled call tone missing");
        MediaPlayer next = new MediaPlayer();
        player = next;
        next.setAudioAttributes(new AudioAttributes.Builder()
          .setUsage(incoming
            ? AudioAttributes.USAGE_NOTIFICATION_RINGTONE
            : AudioAttributes.USAGE_VOICE_COMMUNICATION)
          .setContentType(AudioAttributes.CONTENT_TYPE_SONIFICATION)
          .build());
        try (android.content.res.AssetFileDescriptor file =
            getReactApplicationContext().getResources()
              .openRawResourceFd(resource)) {
          next.setDataSource(file.getFileDescriptor(),
            file.getStartOffset(), file.getLength());
        }
        RomBuzzToneLoop.attach(next, main,
          () -> generation == ticket && player == next,
          () -> { prepared = true; applyRingerMode(); });
        next.setOnErrorListener((failed, what, extra) -> {
          android.util.Log.e("RomBuzzCallAudio",
            "Playback error: " + what + "/" + extra);
          if (generation == ticket) {
            failed.release();
            player = null;
          }
          return true;
        });
        next.prepareAsync();
      } catch (Exception error) {
        android.util.Log.e("RomBuzzCallAudio",
          "Could not start call tone", error);
      }
    });
  }
  @ReactMethod public void stopTone(String id) {
    main.post(() -> {
      if (!owner.equals(id)) return;
      boolean incoming = kind.equals("incoming");
      stopPlayer();
      if (incoming) releaseNow(id);
    });
  }
  @ReactMethod public void setCallActive(String id) {
    main.post(() -> {
      if (!owner.isEmpty() && !owner.equals(id)) return;
      stopPlayer();
      setStream(id, audio().isWiredHeadsetOn()
        ? AudioManager.STREAM_MUSIC : AudioManager.STREAM_VOICE_CALL);
    });
  }
  private void releaseNow(String id) {
    if (!owner.equals(id)) return;
    stopPlayer();
    owner = "";
    targetStream = previousStream;
    Activity activity = getCurrentActivity();
    if (activity != null)
      activity.setVolumeControlStream(previousStream);
  }
  @ReactMethod public void releaseCall(String id) {
    main.post(() -> releaseNow(id));
  }
  @ReactMethod public void addListener(String event) {}
  @ReactMethod public void removeListeners(double count) {}
  @Override public void onHostResume() {
    if (!owner.isEmpty() && getCurrentActivity() != null)
      getCurrentActivity().setVolumeControlStream(targetStream);
  }
  @Override public void onHostPause() {}
  @Override public void onHostDestroy() {
    main.post(() -> releaseNow(owner));
  }
  @Override public void invalidate() {
    getReactApplicationContext().unregisterReceiver(modeReceiver);
    getReactApplicationContext().removeLifecycleEventListener(this);
    main.post(() -> releaseNow(owner));
    super.invalidate();
  }
  public static final class Package implements ReactPackage {
    @Override public List<NativeModule> createNativeModules(
        ReactApplicationContext context) {
      return Collections.singletonList(new RomBuzzCallAudio(context));
    }
    @Override public List<ViewManager> createViewManagers(
        ReactApplicationContext context) {
      return Collections.emptyList();
    }
  }
}