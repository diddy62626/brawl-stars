export const PARTYKIT_HOST = process.env.NEXT_PUBLIC_PARTYKIT_HOST || (
  typeof window !== "undefined"
    ? (window.location.hostname.match(/localhost|127\.0\.0\.1/) ? "localhost:1999" : "brawl-stars-party.jules.partykit.dev")
    : "localhost:1999"
);
