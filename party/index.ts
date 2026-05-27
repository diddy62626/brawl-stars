import type { Party, PartyServer, PartyConnection } from "partykit/server";

interface PlayerState {
  id: string;
  x: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  brawlerId: string;
  score: number;
  team: number;
  isDead: boolean;
  gems: number;
}

interface Gem {
  id: string;
  x: number;
  z: number;
}

interface GameState {
  players: Record<string, PlayerState>;
  gems: Gem[];
  safeHealth: Record<number, number>; // team -> health
  status: "waiting" | "playing" | "ended";
  timer: number;
}

export default class Server implements PartyServer {
  state: GameState = {
    players: {},
    gems: [],
    safeHealth: { 0: 30000, 1: 30000 },
    status: "playing",
    timer: 120,
  };

  constructor(public readonly party: Party) {
    this.setupGameLoop();
  }

  setupGameLoop() {
    setInterval(() => {
      if (this.state.status === "playing") {
        this.state.timer -= 1;

        if (this.party.id.includes("gem_grab") && this.state.gems.length < 10 && Math.random() < 0.1) {
           const newGem = { id: Math.random().toString(), x: (Math.random() - 0.5) * 20, z: (Math.random() - 0.5) * 20 };
           this.state.gems.push(newGem);
           this.party.broadcast(JSON.stringify({ type: "gemSpawn", gem: newGem }));
        }

        if (this.state.timer <= 0) {
          this.state.status = "ended";
          this.party.broadcast(JSON.stringify({ type: "gameOver", winner: this.getWinner(), state: this.state }));
        }
      }
    }, 1000);
  }

  getWinner() {
    if (this.party.id.includes("heist")) {
      return this.state.safeHealth[0] > this.state.safeHealth[1] ? 0 : 1;
    }
    return 0; // Default
  }

  onConnect(connection: PartyConnection) {
    const team = Object.keys(this.state.players).length % 2;
    this.state.players[connection.id] = {
      id: connection.id,
      x: team === 0 ? -30 : 30,
      z: 0,
      rotation: 0,
      health: 3600,
      maxHealth: 3600,
      brawlerId: "shellie",
      score: 0,
      team,
      isDead: false,
      gems: 0
    };
    connection.send(JSON.stringify({ type: "init", id: connection.id, state: this.state }));
    this.party.broadcast(JSON.stringify({ type: "sync", state: this.state }));
  }

  onClose(connection: PartyConnection) {
    delete this.state.players[connection.id];
    this.party.broadcast(JSON.stringify({ type: "sync", state: this.state }));
  }

  onMessage(message: string, sender: PartyConnection) {
    const data = JSON.parse(message);

    if (data.type === "update") {
      if (this.state.players[sender.id] && !this.state.players[sender.id].isDead) {
        Object.assign(this.state.players[sender.id], data.state);
        this.party.broadcast(JSON.stringify({ type: "update", id: sender.id, state: data.state }), [sender.id]);

        if (this.party.id.includes("gem_grab")) {
          this.state.gems = this.state.gems.filter(gem => {
            const dist = Math.sqrt((gem.x - data.state.x)**2 + (gem.z - data.state.z)**2);
            if (dist < 2.5) {
              this.state.players[sender.id].gems += 1;
              this.party.broadcast(JSON.stringify({ type: "gemCollect", id: sender.id, gemId: gem.id, total: this.state.players[sender.id].gems }));
              return false;
            }
            return true;
          });
        }
      }
    } else if (data.type === "shoot" || data.type === "gadget") {
       this.party.broadcast(message);
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
           victim.health = 0;
           victim.isDead = true;

           if (this.party.id.includes("gem_grab") && victim.gems > 0) {
              for(let i=0; i<victim.gems; i++) {
                this.state.gems.push({ id: Math.random().toString(), x: victim.x + (Math.random()-0.5)*3, z: victim.z + (Math.random()-0.5)*3 });
              }
              victim.gems = 0;
              this.party.broadcast(JSON.stringify({ type: "sync", state: this.state }));
           }

           this.party.broadcast(JSON.stringify({ type: "death", id: victimId, killerId: sender.id }));
           setTimeout(() => {
             if (this.state.players[victimId]) {
               this.state.players[victimId].health = this.state.players[victimId].maxHealth;
               this.state.players[victimId].isDead = false;
               this.state.players[victimId].x = this.state.players[victimId].team === 0 ? -30 : 30;
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
