/**
 * Shares Android picture-in-picture state and its explicit hang-up action.
 */
import { useEffect, useRef, useState } from "react";
import { DeviceEventEmitter, Platform } from "react-native";

let inSystemPip = false;
const subscribers = new Set<(value: boolean) => void>();

if (Platform.OS === "android") {
  DeviceEventEmitter.addListener("rbz:pip:state", (value: boolean) => {
    inSystemPip = value === true;
    subscribers.forEach((listener) => listener(inSystemPip));
  });
}

export default function useSystemCallPip(onEnd: () => void) {
  const [inPip, setInPip] = useState(inSystemPip);
  const endRef = useRef(onEnd);
  endRef.current = onEnd;

  useEffect(() => {
    if (Platform.OS !== "android") return;

    subscribers.add(setInPip);
    setInPip(inSystemPip);

    const subscription = DeviceEventEmitter.addListener("rbz:pip:end", () => {
      endRef.current();
    });

    return () => {
      subscribers.delete(setInPip);
      subscription.remove();
    };
  }, []);

  return inPip;
}