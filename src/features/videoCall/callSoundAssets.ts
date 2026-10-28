/** Bundled default call sounds and their Cloudinary originals for future sound choices. */
import { Asset } from "expo-asset";

const cloud = "https://res.cloudinary.com/dn3mhtbb3/video/upload/";
export const CALL_SOUND_URLS = {
  incoming: cloud + "v1793120390/Incoming_isqrlq.wav",
  outgoing: cloud + "v1793120391/outgoing_hy95q7.wav",
  connected: cloud + "v1793120390/call_connected_jzpbfm.wav",
  ended: cloud + "v1793120391/call_ended_bvyfnd.wav",
} as const;

export const CALL_SOUND_ASSETS = {
  incoming: require("../../../assets/sounds/defaults/incoming.wav"),
  outgoing: require("../../../assets/sounds/defaults/outgoing.wav"),
  connected: require("../../../assets/sounds/defaults/call_connected.wav"),
  ended: require("../../../assets/sounds/defaults/call_ended.wav"),
} as const;

export async function getCallSoundPath(name: keyof typeof CALL_SOUND_ASSETS) {
  const asset = Asset.fromModule(CALL_SOUND_ASSETS[name]);
  await asset.downloadAsync();
  if (!asset.localUri) throw new Error(`Call sound unavailable: ${name}`);
  return asset.localUri.replace(/^file:\/\//, "");
}