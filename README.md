# Brawl Web

A 3D Multiplayer Brawl Stars clone built with Next.js, Babylon.js, and PartyKit.

## Deployment

### 1. Deploy PartyKit Server
Run the following command to deploy your multiplayer backend:
```bash
npx partykit deploy
```
Take note of your deployment URL (e.g., `brawl-stars-party.your-username.partykit.dev`).

### 2. Deploy Frontend to Vercel
1. Push this repository to GitHub.
2. Connect your repository to Vercel.
3. Set the following environment variable in the Vercel dashboard:
   - `NEXT_PUBLIC_PARTYKIT_HOST`: Your PartyKit deployment URL (without `https://`).

## Local Development

1. Install dependencies: `npm install`
2. Start PartyKit locally: `npx partykit dev`
3. Start Next.js locally: `npm run dev`
4. Open `http://localhost:3000`

## Controls
- **WASD**: Move
- **Mouse**: Aim
- **Left Click**: Attack
- **Shift + Click**: Super Ability
- **G**: Gadget (Heal)
