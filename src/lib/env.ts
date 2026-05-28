// Environment variable for production, fallback for local dev.
export const PARTYKIT_HOST =
  process.env.NEXT_PUBLIC_PARTYKIT_HOST ||
  "localhost:1999";
