import type { Party, PartyServer, PartyConnection } from "partykit/server";

interface PlayerState {
  id: string; x: number; z: number; rotation: number;
  health: number; maxHealth: number; brawlerId: string;
  team: number; isDead: boolean; isBot?: boolean;
}

interface GameState {
  players: Record<string, PlayerState>;
  safeHealth: Record<number, number>;
  status: "lobby" | "playing" | "ended";
  timer: number;
  lobbyTimer: number;
}

export default class Server implements PartyServer {
  state: GameState;

  constructor(public readonly party: Party) {
    this.state = {
      players: {},
      safeHealth: { 0: 30000, 1: 30000 },
      status: "lobby",
      timer: 120,
      lobbyTimer: 60,
    };
  }

  async onConnect(connection: PartyConnection) {
    console.log(`[${this.party.id}] Connection from ${connection.id}`);

    if (this.state.status === "ended") {
      this.state.status = "lobby";
      this.state.players = {};
      this.state.lobbyTimer = 60;
    }

    const realPlayers = Object.values(this.state.players).filter(p => !p.isBot);
    const team = realPlayers.length % 2;

    this.state.players[connection.id] = {
      id: connection.id, x: team === 0 ? -40 : 40, z: 0, rotation: 0,
      health: 3600, maxHealth: 3600, brawlerId: "shellie",
      team, isDead: false
    };

    const alarm = await this.party.storage.getAlarm();
    if (alarm === null) {
      await this.party.storage.setAlarm(Date.now() + 100);
    }

    this.broadcastLobbySync();

    if (this.state.status === "playing") {
      connection.send(JSON.stringify({ type: "matchStart", state: this.state }));
    }
  }

  async onAlarm() {
    this.tick();
    const connections = [...this.party.getConnections()];
    if (connections.length > 0 || this.state.status === "playing") {
      await this.party.storage.setAlarm(Date.now() + 1000);
    }
  }

  lastSecond = 0;

  tick() {
    const now = Date.now();
    const isSecond = now - this.lastSecond >= 1000;

    if (this.state.status === "lobby") {
      const realPlayers = Object.values(this.state.players).filter(p => !p.isBot);
      if (realPlayers.length > 0) {
        if (isSecond) {
          this.state.lobbyTimer -= 1;
          this.lastSecond = now;
          const required = this.getRequiredPlayers();
          if (this.state.lobbyTimer <= 0 || realPlayers.length >= required) {
            this.startMatch();
          } else {
            this.broadcastLobbySync();
          }
        }
      } else {
        this.state.lobbyTimer = 60;
      }
    } else if (this.state.status === "playing") {
      if (isSecond) {
        this.state.timer -= 1;
        this.lastSecond = now;
        if (this.state.timer <= 0) {
          this.state.status = "ended";
          this.party.broadcast(JSON.stringify({ type: "gameOver", winner: this.getWinner() }));
        }
      }
      this.updateBots();
    }
  }

  updateBots() {
    const bots = Object.values(this.state.players).filter(p => p.isBot);
    if (bots.length === 0) return;

    bots.forEach(bot => {
      if (bot.isDead) return;
      let tx = 0, tz = 0;
      if (this.party.id.toLowerCase().includes("heist")) {
         tx = bot.team === 0 ? 60 : -60;
      }
      const dx = tx - bot.x, dz = tz - bot.z;
      const d = Math.sqrt(dx*dx + dz*dz);
      if (d > 10) {
        bot.x += (dx/d) * 0.4;
        bot.z += (dz/d) * 0.4;
        bot.rotation = Math.atan2(dx, dz);
      }
      if (Math.random() < 0.05) {
         this.party.broadcast(JSON.stringify({
            type: "shoot",
            projectile: {
               id: "bot_p_" + Math.random().toString(36).substr(2, 5),
               ownerId: bot.id, team: bot.team, x: bot.x, z: bot.z,
               vx: Math.sin(bot.rotation) * 0.5, vz: Math.cos(bot.rotation) * 0.5,
               damage: 400, range: 15, isSuper: false
            }
         }));
      }
    });
    this.party.broadcast(JSON.stringify({ type: "botUpdate", bots: this.state.players }));
  }

  broadcastLobbySync() {
    const realPlayers = Object.values(this.state.players).filter(p => !p.isBot);
    this.party.broadcast(JSON.stringify({
      type: "lobbySync",
      count: realPlayers.length,
      required: this.getRequiredPlayers(),
      timer: Math.max(0, this.state.lobbyTimer)
    }));
  }

  getRequiredPlayers() {
    const id = this.party.id.toLowerCase();
    if (id.includes("solo")) return 10;
    if (id.includes("1v1")) return 2;
    return 6;
  }

  startMatch() {
    if (this.state.status === "playing") return;
    this.state.status = "playing";
    const required = this.getRequiredPlayers();
    const realPlayers = Object.values(this.state.players).filter(p => !p.isBot);
    for (let i = realPlayers.length; i < required; i++) {
       const botId = "bot_" + Math.random().toString(36).substr(2, 5);
       const team = i % 2;
       this.state.players[botId] = {
         id: botId, x: team === 0 ? -40 : 40, z: (Math.random() - 0.5) * 40, rotation: 0,
         health: 4000, maxHealth: 4000, brawlerId: "bill", team, isDead: false, isBot: true
       };
    }
    this.party.broadcast(JSON.stringify({ type: "matchStart", state: this.state }));
  }

  getWinner() {
    return this.state.safeHealth[0] > this.state.safeHealth[1] ? 0 : 1;
  }

  onClose(connection: PartyConnection) {
    delete this.state.players[connection.id];
    const realPlayers = Object.values(this.state.players).filter(p => !p.isBot);
    if (realPlayers.length === 0) {
      this.state.status = "lobby";
      this.state.players = {};
      this.state.lobbyTimer = 60;
    } else if (this.state.status === "lobby") {
      this.broadcastLobbySync();
    }
  }

  onMessage(message: string, sender: PartyConnection) {
    try {
      const data = JSON.parse(message);
      if (data.type === "update" && this.state.players[sender.id]) {
        Object.assign(this.state.players[sender.id], data.state);
        this.party.broadcast(JSON.stringify({ type: "update", id: sender.id, state: data.state }), [sender.id]);
      } else if (data.type === "shoot" || data.type === "gadget") {
        this.party.broadcast(message, [sender.id]);
      } else if (data.type === "hit") {
        const { victimId, damage, isSafe, team } = data;
        if (isSafe) {
          this.state.safeHealth[team] -= damage;
          this.party.broadcast(JSON.stringify({ type: "safeUpdate", team, health: this.state.safeHealth[team] }));
          if (this.state.safeHealth[team] <= 0) {
            this.state.status = "ended";
            this.party.broadcast(JSON.stringify({ type: "gameOver", winner: 1 - team }));
          }
        } else if (this.state.players[victimId]) {
          const victim = this.state.players[victimId];
          victim.health -= damage;
          if (victim.health <= 0) {
            victim.health = 0; victim.isDead = true;
            this.party.broadcast(JSON.stringify({ type: "death", id: victimId }));
            setTimeout(() => {
              if (this.state.players[victimId]) {
                this.state.players[victimId].health = this.state.players[victimId].maxHealth;
                this.state.players[victimId].isDead = false;
                this.party.broadcast(JSON.stringify({ type: "respawn", id: victimId, state: this.state.players[victimId] }));
              }
            }, 5000);
          }
          this.party.broadcast(JSON.stringify({ type: "healthUpdate", id: victimId, health: victim.health }));
        }
      }
    } catch (e) {
      console.error("Server Message Parse Error", e);
    }
  }
}
