export interface PlayerState {
  id: string;
  name: string;
  x: number;
  z: number;
  rotation: number;
  health: number;
  maxHealth: number;
  ammo: number;
  maxAmmo: number;
  brawlerId: string;
  isShooting: boolean;
  team: number;
  score: number;
}

export interface ProjectileState {
  id: string;
  ownerId: string;
  x: number;
  z: number;
  vx: number;
  vz: number;
  damage: number;
  range: number;
  traveled: number;
}

export interface GameState {
  players: Record<string, PlayerState>;
  projectiles: Record<string, ProjectileState>;
  mode: string;
}
