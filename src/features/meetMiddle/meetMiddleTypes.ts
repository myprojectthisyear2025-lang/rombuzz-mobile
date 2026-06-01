// src/features/meetMiddle/meetMiddleTypes.ts
//
// RomBuzz Meet in the Middle types.
//
// Purpose:
// - Shared TypeScript types for the Meet in the Middle mobile frontend.
// - Keeps API payloads, session shapes, coordinates, and place shapes out of screen files.
// - Used by meetMiddleApi.ts, hooks, socket handlers, and future UI components.

export type MeetMiddleCoords = {
  lat: number;
  lng: number;
};

export type MeetMiddleUserLite = {
  id?: string;
  _id?: string;
  firstName?: string;
  lastName?: string;
  name?: string;
  avatar?: string;
};

export type MeetMiddlePlace = {
  id?: string;
  name: string;
  address?: string;
  category?: string;
  lat?: number;
  lng?: number;
  distanceMeters?: number;
  provider?: string;
  isMidpoint?: boolean;
  raw?: any;
};

export type MeetMiddleApproximateParticipant = {
  userId?: string;
  id?: string;
  name?: string;
  avatar?: string;
  gender?: string;
  coords?: MeetMiddleCoords | null;
  approximateCoords?: MeetMiddleCoords | null;
};

export type MeetMiddleSessionStatus =
  | "requested"
  | "waiting_location"
  | "suggestions_ready"
  | "place_selected"
  | "confirmation_needed"
  | "final_confirmed"
  | "declined"
  | "cancelled"
  | "completed"
  | "expired"
  | string;

export type MeetMiddleSession = {
  id?: string;
  _id?: string;
  sessionId?: string;
  status?: MeetMiddleSessionStatus;
  from?: string | MeetMiddleUserLite;
  to?: string | MeetMiddleUserLite;
  requester?: string | MeetMiddleUserLite;
  receiver?: string | MeetMiddleUserLite;
  participants?: Array<string | MeetMiddleUserLite>;
  approximateParticipants?: MeetMiddleApproximateParticipant[];
  midpoint?: MeetMiddleCoords | null;
  midpointPlace?: MeetMiddlePlace | null;
  places?: MeetMiddlePlace[];
  suggestions?: MeetMiddlePlace[];
  selectedPlace?: MeetMiddlePlace | null;
  radiusUsedMeters?: number;
  radiusUsedMiles?: number;
  radiusStepsTriedMeters?: number[];
  canExpandMore?: boolean;
  placesSearchExhausted?: boolean;
  createdAt?: string;
  updatedAt?: string;
  raw?: any;
};

export type MeetMiddleApiResponse<T = any> = {
  ok?: boolean;
  message?: string;
  error?: string;
  session?: MeetMiddleSession;
  data?: T;
  raw?: any;
};

export type RequestMeetMiddleResponse = MeetMiddleApiResponse<{
  session?: MeetMiddleSession;
}>;

export type ShareLocationResponse = MeetMiddleApiResponse<{
  session?: MeetMiddleSession;
  suggestions?: MeetMiddlePlace[];
}>;

export type PlaceActionResponse = MeetMiddleApiResponse<{
  session?: MeetMiddleSession;
  place?: MeetMiddlePlace;
}>;

export type MeetMiddleRequestState =
  | "idle"
  | "loading"
  | "sent"
  | "error";