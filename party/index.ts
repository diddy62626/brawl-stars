import type { Party, PartyServer, PartyConnection } from "partykit/server";

interface PlayerState {
  id: string; x: number; z: number; rotation: number;
  health: number; maxHealth: number; brawlerId: string;
  score: number; team: number; isDead: boolean; gems: number; isBot?: boolean;
}

interface GameState {
  players: Record<string, PlayerState>;
  gems: { id: string, x: number, z: number }[];
  safeHealth: Record<number, number>;
  status: "lobby" | "playing" | "ended";
  timer: number;
  lobbyTimer: number;
}

export default class Server implements PartyServer {
  state: GameState = {
    players: {}, gems: [], safeHealth: { 0: 30000, 1: 30000 },
    status: "lobby", timer: 120, lobbyTimer: 60,
  };

  constructor(public readonly party: Party) {
    this.setupGameLoop();
  }

  setupGameLoop() {
    // Fast tick for bots and game state
    setInterval(() => {
      if (this.state.status === "playing") {
        this.updateBots();
      }
    }, 100);

    // Slow tick for countdowns
    setInterval(() => {
      if (this.state.status === "lobby") {
        this.state.lobbyTimer -= 1;
        const playerCount = Object.keys(this.state.players).length;
        const required = this.getRequiredPlayers();
        if (this.state.lobbyTimer <= 0 || playerCount >= required) this.startMatch();
        else this.party.broadcast(JSON.stringify({ type: "lobbySync", count: playerCount, required, timer: this.state.lobbyTimer }));
      } else if (this.state.status === "playing") {
        this.state.timer -= 1;
        if (this.party.id.includes("gem_grab") && this.state.gems.length < 10 && Math.random() < 0.1) {
           const newGem = { id: Math.random().toString(), x: (Math.random() - 0.5) * 40, z: (Math.random() - 0.5) * 40 };
           this.state.gems.push(newGem);
           this.party.broadcast(JSON.stringify({ type: "gemSpawn", gem: newGem }));
        }
        if (this.state.timer <= 0) {
          this.state.status = "ended";
          this.party.broadcast(JSON.stringify({ type: "gameOver", winner: this.getWinner() }));
        }
      }
    }, 1000);
  }

  updateBots() {
    const botIds = Object.keys(this.state.players).filter(id => this.state.players[id].isBot);
    botIds.forEach(id => {
      const bot = this.state.players[id];
      if (bot.isDead) return;

      // Target selection: Heist safe or nearest player
      let targetX = 0, targetZ = 0;
      if (this.party.id.includes("heist")) {
         targetX = bot.team === 0 ? 60 : -60;
         targetZ = 0;
      } else {
         // Default target center
         targetX = 0; targetZ = 0;
      }

      const dx = targetX - bot.x;
      const dz = targetZ - bot.z;
      const dist = Math.sqrt(dx*dx + dz*dz);

      if (dist > 5) {
        const speed = 0.5;
        bot.x += (dx / dist) * speed;
        bot.z += (dz / dist) * speed;
        bot.rotation = Math.atan2(dx, dz);
      }

      // Randomly shoot
      if (Math.random() < 0.05) {
         this.party.broadcast(JSON.stringify({
            type: "shoot",
            projectile: {
               id: Math.random().toString(36).substr(2, 9),
               ownerId: bot.id, team: bot.team,
               x: bot.x + Math.sin(bot.rotation) * 2,
               z: bot.z + Math.cos(bot.rotation) * 2,
               vx: Math.sin(bot.rotation) * 0.4,
               vz: Math.cos(bot.rotation) * 0.4,
               damage: 300, range: 8, isSuper: false
            }
         }));
      }
    });

    this.party.broadcast(JSON.stringify({ type: "botUpdate", bots: this.state.players }));
  }

  getRequiredPlayers() {
    if (this.party.id.includes("solo")) return 10;
    if (this.party.id.includes("1v1")) return 2;
    return 6;
  }

  startMatch() {
    if (this.state.status === "playing") return;
    this.state.status = "playing";
    const required = this.getRequiredPlayers();
    const currentCount = Object.keys(this.state.players).length;
    for (let i = currentCount; i < required; i++) {
       const botId = "bot_" + i;
       const team = i % 2;
       this.state.players[botId] = {
         id: botId, x: team === 0 ? -40 : 40, z: (Math.random() - 0.5) * 20, rotation: 0,
         health: 3600, maxHealth: 3600, brawlerId: "shellie", score: 0, team, isDead: false, gems: 0, isBot: true
       };
    }
    this.party.broadcast(JSON.stringify({ type: "matchStart", state: this.state }));
  }

  getWinner() {
    if (this.party.id.includes("heist")) return this.state.safeHealth[0] > this.state.safeHealth[1] ? 0 : 1;
    return 0;
  }

  onConnect(connection: PartyConnection) {
    const playerCount = Object.keys(this.state.players).filter(id => !this.state.players[id].isBot).length;
    const team = playerCount % 2;
    this.state.players[connection.id] = {
      id: connection.id, x: team === 0 ? -40 : 40, z: 0, rotation: 0,
      health: 3600, maxHealth: 3600, brawlerId: "shellie", score: 0, team, isDead: false, gems: 0
    };
    if (this.state.status === "playing") connection.send(JSON.stringify({ type: "matchStart", state: this.state }));
    else this.party.broadcast(JSON.stringify({ type: "lobbySync", count: Object.keys(this.state.players).length, required: this.getRequiredPlayers(), timer: this.state.lobbyTimer }));
  }

  onClose(connection: PartyConnection) {
    delete this.state.players[connection.id];
    if (Object.keys(this.state.players).filter(id => !this.state.players[id].isBot).length === 0) {
       this.state.status = "lobby"; this.state.players = {}; this.state.lobbyTimer = 60;
    }
  }

  onMessage(message: string, sender: PartyConnection) {
    const data = JSON.parse(message);
    if (data.type === "update") {
      if (this.state.players[sender.id] && !this.state.players[sender.id].isDead) {
        Object.assign(this.state.players[sender.id], data.state);
        this.party.broadcast(JSON.stringify({ type: "update", id: sender.id, state: data.state }), [sender.id]);
      }
    } else if (data.type === "shoot" || data.type === "gadget") {
       this.party.broadcast(message, [sender.id]);
    } else if (data.type === "hit") {
       const { victimId, damage, isSafe, team } = data;
       if (isSafe) {
          this.state.safeHealth[team] -= damage;
          this.party.broadcast(JSON.stringify({ type: "safeUpdate", team, health: this.state.safeHealth[team] }));
          if (this.state.safeHealth[team] <= 0) { this.state.status = "ended"; this.party.broadcast(JSON.stringify({ type: "gameOver", winner: 1 - team })); }
       } else if (this.state.players[victimId]) {
         const victim = this.state.players[victimId];
         victim.health -= damage;
         if (victim.health <= 0) {
           victim.health = 0; victim.isDead = true;
           this.party.broadcast(JSON.stringify({ type: "death", id: victimId, killerId: sender.id }));
           setTimeout(() => {
             if (this.state.players[victimId]) {
               this.state.players[victimId].health = this.state.players[victimId].maxHealth;
               this.state.players[victimId].isDead = false;
               this.state.players[victimId].x = this.state.players[victimId].team === 0 ? -40 : 40;
               this.state.players[victimId].z = 0;
               this.party.broadcast(JSON.stringify({ type: "respawn", id: victimId, state: this.state.players[victimId] }));
             }
           }, 5000);
         }
         this.party.broadcast(JSON.stringify({ type: "healthUpdate", id: victimId, health: victim.health }));
       }
    }
  }
}
