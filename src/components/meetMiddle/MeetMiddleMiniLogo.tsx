// src/components/meetMiddle/MeetMiddleMiniLogo.tsx
//
// RomBuzz Meet in the Middle mini logo.
//
// Purpose:
// - Reusable Meet in the Middle logo for chat/header/thread-info buttons.
// - Clearly communicates two people/paths meeting at a center heart.
// - No boring map pin.
// - Uses RomBuzz pink/purple colors and works on light or gradient buttons.

import React from "react";
import Svg, {
  Circle,
  Defs,
  LinearGradient as SvgLinearGradient,
  Path,
  Stop,
} from "react-native-svg";

type MeetMiddleMiniLogoProps = {
  size?: number;
};

export default function MeetMiddleMiniLogo({
  size = 26,
}: MeetMiddleMiniLogoProps) {
  return (
    <Svg width={size} height={size} viewBox="0 0 64 64">
      <Defs>
        <SvgLinearGradient id="rbzMeetBg" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FF2F8E" />
          <Stop offset="0.55" stopColor="#D8345F" />
          <Stop offset="1" stopColor="#B5179E" />
        </SvgLinearGradient>

        <SvgLinearGradient id="rbzMeetPath" x1="0" y1="0" x2="1" y2="1">
          <Stop offset="0" stopColor="#FFFFFF" />
          <Stop offset="1" stopColor="#FFE2F1" />
        </SvgLinearGradient>
      </Defs>

      {/* outer badge */}
      <Circle cx="32" cy="32" r="30" fill="url(#rbzMeetBg)" />

      {/* soft inner glow */}
      <Circle cx="32" cy="32" r="23" fill="rgba(255,255,255,0.16)" />

      {/* left person */}
      <Circle cx="17.5" cy="19" r="5.5" fill="#FFFFFF" />
      <Path
        d="M9.5 34 C10.8 27.5 14 24.5 17.5 24.5 C21 24.5 24.2 27.5 25.5 34"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* right person */}
      <Circle cx="46.5" cy="19" r="5.5" fill="#FFFFFF" />
      <Path
        d="M38.5 34 C39.8 27.5 43 24.5 46.5 24.5 C50 24.5 53.2 27.5 54.5 34"
        stroke="#FFFFFF"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* paths meeting in center */}
      <Path
        d="M14 45 C20 39 24.5 37 29 35"
        stroke="url(#rbzMeetPath)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />
      <Path
        d="M50 45 C44 39 39.5 37 35 35"
        stroke="url(#rbzMeetPath)"
        strokeWidth="4"
        strokeLinecap="round"
        fill="none"
      />

      {/* center heart = meeting point */}
      <Path
        d="M32 30.8 C29.9 27.8 25.2 28.8 25.2 32.8 C25.2 37 30.5 40.5 32 42 C33.5 40.5 38.8 37 38.8 32.8 C38.8 28.8 34.1 27.8 32 30.8 Z"
        fill="#FFFFFF"
      />

      {/* tiny center dot to make the middle obvious */}
      <Circle cx="32" cy="35.5" r="2.2" fill="#FF2F8E" />
    </Svg>
  );
}