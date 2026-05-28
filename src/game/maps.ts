export interface MapCell {
  x: number;
  z: number;
  type: "wall" | "bush" | "spawn" | "safe";
}

export interface MapData {
  id: string;
  name: string;
  cells: MapCell[];
}

export const MAPS: Record<string, MapData> = {
  default: {
    id: "default",
    name: "Stone Fort",
    cells: [
      // Some walls
      { x: -5, z: 5, type: "wall" }, { x: -4, z: 5, type: "wall" }, { x: -3, z: 5, type: "wall" },
      { x: 5, z: -5, type: "wall" }, { x: 4, z: -5, type: "wall" }, { x: 3, z: -5, type: "wall" },
      { x: 0, z: 10, type: "wall" }, { x: 0, z: -10, type: "wall" },
      // Some bushes
      { x: -10, z: 0, type: "bush" }, { x: -11, z: 0, type: "bush" }, { x: -10, z: 1, type: "bush" },
      { x: 10, z: 0, type: "bush" }, { x: 11, z: 0, type: "bush" }, { x: 10, z: -1, type: "bush" },
    ]
  }
};

export function generateRandomMap(width: number, height: number): MapCell[] {
  const cells: MapCell[] = [];
  for (let x = -width / 2; x < width / 2; x += 2) {
    for (let z = -height / 2; z < height / 2; z += 2) {
      if (Math.abs(x) < 5 && Math.abs(z) < 5) continue; // Clear center
      const r = Math.random();
      if (r < 0.1) cells.push({ x, z, type: "wall" });
      else if (r < 0.2) cells.push({ x, z, type: "bush" });
    }
  }
  return cells;
}
