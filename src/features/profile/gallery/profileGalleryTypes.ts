/**
 * Path: src/features/profile/gallery/profileGalleryTypes.ts
 * Purpose: Shared Profile Gallery media types.
 * Used by: GallerySection.tsx and ProfileGalleryContent.tsx.
 */

export type ProfileGalleryMediaItem = {
  id: string;
  url: string;
  type: "image" | "video";
  caption?: string;
  privacy?: "public" | "matches" | "private";
  createdAt?: any;

  thumbnailUrl?: string;
  thumbnail?: string;
  poster?: string;
  previewUrl?: string;

  provider?: string;
  storage?: string;
  streamUid?: string;

  cloudflareStream?: {
    uid?: string;
    thumbnailUrl?: string;
    [key: string]: any;
  };

  [key: string]: any;
};