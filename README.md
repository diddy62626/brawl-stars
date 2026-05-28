# Brawl Web

A 3D Multiplayer Brawl Stars clone built with Next.js, Babylon.js, and PartyKit.

## Getting Started

1. **Install dependencies**:
   ``bash
   npm install
   ```

2. **Start the game (Lobby + Multiplayer Server)**:
   ``bash
   npm run dev
   ```
   This command starts both the Next.js frontend and the PartyKit backend automatically.

3. **Open the game**:
   Navigate to [http://localhost:3000](http://localhost:3000).

## Deployment

### 1. Deploy PartyKit Server
   `bash
   np| partykit deploy
   ``` (note: use npx if not installed globally)
   Take note of your deployment URL.

### 2. Deploy Frontend to Vercel
   Set the following environment variable in Vercel:
   - `NEXT_PUBLIC_PARTYKIT_HOST`: Your PartyKit deployment URL (e.g., `brawl-stars-party.your-username.partykit.dev`).

## Controls
- **WASD**: Move
- **Mouse**: Aim
- **Left Click**: Attack
- **Shift + Click**: Super Ability
- **G**: Gadget (Heal)