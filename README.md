# Brawl Web

A 3D Multiplayer Brawl Stars clone built with Next.js, Babylon.js, and PartyKit.

## Getting Started (Local)

1. **Install dependencies**:
   `bash
   npm install
   ```

2. **Start everything**:
   `bash
   npm run dev
   ```
   This starts the Next.js app on `localhost:3000` and the PartyKit server on `localtost:1999`.


## Deployment (Production)

### 1. Deploy the Multiplayer Server
Run the following command:
``bash
  npx partykit deploy
```
After deployment, the terminal will show your **Project URL**, for example:
`brawl-stars-party.jules.partykit.dev`

### 2. Deploy the Frontend to Vercel
1. Connect your repository to Vercel.
2. Add an **Environment Variable**:
   - **Key**: `NEXT_PUBLIC_PARTYKIT_HOST`
   - **Value**: Your Project URL from step 1 (e.g., `brawl-stars-party.your-username.partykit.dev`)
   - *Note: Do not include https:// in the value.*


## Troubleshooting
If you see an **ERROR** in the matchmaking screen:
1. Click the **Gear Icon** (Settings) in the top right of the Lobby.
2. Ensure the "PartyKit Host" matches your server URL (default `localhost:1999` for local dev).


## Controls
- **WASD**: Move
- **Mouse**: Aim
- **Left Click**: Attack
- **Shift + Click**: Super Ability
- **G**: Gadget (Heal)