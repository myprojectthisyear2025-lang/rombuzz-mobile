/** Keeps a prepared tone looping; stale players cannot restart after call cleanup. */
package __PACKAGE__;

import android.media.MediaPlayer;
import android.os.Handler;
import java.util.function.BooleanSupplier;

final class RomBuzzToneLoop {
  private RomBuzzToneLoop() {}

  static void attach(MediaPlayer player, Handler main,
      BooleanSupplier current, Runnable applyVolume) {
    player.setOnPreparedListener(ready -> {
      if (!current.getAsBoolean()) return;
      ready.setLooping(true);
      applyVolume.run();
      ready.start();
      main.postDelayed(new Runnable() {
        @Override public void run() {
          if (!current.getAsBoolean()) return;
          try {
            if (!player.isPlaying()) restart(player, current, applyVolume);
          } catch (IllegalStateException error) {
            android.util.Log.w("RomBuzzCallAudio", "Tone player unavailable", error);
            return;
          }
          main.postDelayed(this, 500);
        }
      }, 500);
    });
    player.setOnCompletionListener(ready -> restart(ready, current, applyVolume));
  }

  private static void restart(MediaPlayer player,
      BooleanSupplier current, Runnable applyVolume) {
    if (!current.getAsBoolean()) return;
    player.setLooping(true);
    applyVolume.run();
    player.seekTo(0);
    player.start();
  }
}