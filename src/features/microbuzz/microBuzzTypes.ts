/**
 * Path: src/features/microbuzz/microBuzzTypes.ts
 * Purpose: Shared MicroBuzz request, menu, and gender types.
 */

export type MicroBuzzGender =
  | "male"
  | "female"
  | "everyone";

export type BuzzRequestPayload = {
  fromId: string;
  firstName?: string;
  lastName?: string;
  dob?: string;
  selfieUrl?: string;
};

export type MicroBuzzReportTarget = {
  id: string;
  name?: string;
  selfieUrl?: string;
  distanceMeters?: number;
  source:
    | "mobile_microbuzz_incoming_buzz"
    | "mobile_microbuzz_nearby_preview";
  context:
    | "incoming_buzz_request"
    | "nearby_selfie_preview";
};

export function buzzRequestName(
  req?: BuzzRequestPayload | null
) {
  return (
    [req?.firstName, req?.lastName]
      .filter(Boolean)
      .join(" ")
      .trim() ||
    "MicroBuzz user"
  );
}

export function normalizeBuzzRequest(
  data: any
): BuzzRequestPayload | null {
  if (!data?.fromId) return null;

  const nameParts =
    String(data?.name || "")
      .trim()
      .split(/\s+/)
      .filter(Boolean);

  return {
    fromId:
      String(data.fromId),

    firstName:
      String(
        data?.firstName ||
          nameParts[0] ||
          "Someone"
      ).trim(),

    lastName:
      String(
        data?.lastName ||
          nameParts
            .slice(1)
            .join(" ") ||
          ""
      ).trim(),

    dob:
      String(data?.dob || ""),

    selfieUrl:
      String(
        data?.selfieUrl || ""
      ),
  };
}