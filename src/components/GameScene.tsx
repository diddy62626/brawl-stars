"use client";

import React, { useEffect, useRef, useState } from "react";
import * as BABYLON from "@babylonjs/core";
import PartySocket from "partysocket";
import { BRAWLERS } from "@/game/brawlers";
import { MAPS, generateRandomMap } from "@/game/maps";

const PARTYKIT_HOST = "localhost:1999";

interface GameSceneProps {
  brawlerId: string;
  mode: string;
}

export default function GameScene({ brawlerId, mode }: GameSceneProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [hudData, setHudData] = useState({
    health: 0,
    maxHealth: 0,
    ammo: 0,
    maxAmmo: 0,
    superCharge: 0,
    gadgets: 3,
    isDead: false,
    gems: 0,
    teamGems: [0, 0],
    safeHealth: [30000, 30000],
    timeLeft: 120,
    gameOver: false,
    winner: null as number | null
  });

  const brawlerConfig = BRAWLERS[brawlerId];

  useEffect(() => {
    if (!canvasRef.current) return;

    const socket = new PartySocket({
      host: PARTYKIT_HOST,
      room: mode + "-room-" + Math.floor(Math.random() * 5),
    });

    const engine = new BABYLON.Engine(canvasRef.current, true);
    const scene = new BABYLON.Scene(engine);
    scene.clearColor = new BABYLON.Color4(0.1, 0.1, 0.1, 1);

    const glow = new BABYLON.GlowLayer("glow", scene);
    glow.intensity = 0.6;

    const camera = new BABYLON.FreeCamera("camera1", new BABYLON.Vector3(0, 55, -45), scene);
    camera.setTarget(BABYLON.Vector3.Zero());

    const light = new BABYLON.HemisphericLight("light1", new BABYLON.Vector3(0, 1, 0), scene);
    light.intensity = 1.0;

    const ground = BABYLON.MeshBuilder.CreateGround("ground", { width: 200, height: 200 }, scene);
    const groundMaterial = new BABYLON.StandardMaterial("groundMat", scene);
    groundMaterial.diffuseColor = BABYLON.Color3.FromHexString("#1e3a1e");
    ground.material = groundMaterial;

    const otherPlayers: Record<string, { container: BABYLON.TransformNode, body: BABYLON.Mesh, team: number }> = {};
    const safes: Record<number, BABYLON.Mesh> = {};
    const walls: BABYLON.Mesh[] = [];
    const bushes: BABYLON.Mesh[] = [];

    const createBrawlerMesh = (id: string, configId: string, isLocal: boolean, team: number) => {
      const config = BRAWLERS[configId] || brawlerConfig;
      const container = new BABYLON.TransformNode("container-" + id, scene);

      const body = BABYLON.MeshBuilder.CreateBox("body-" + id, { width: 1.4, height: 2.2, depth: 1.4 }, scene);
      body.position.y = 1.1;
      body.parent = container;
      const mat = new BABYLON.StandardMaterial("mat-" + id, scene);
      mat.diffuseColor = BABYLON.Color3.FromHexString(team === 0 ? "#2563eb" : "#dc2626");
      body.material = mat;

      const head = BABYLON.MeshBuilder.CreateBox("head-" + id, { size: 1.0 }, scene);
      head.position.y = 2.7;
      head.parent = container;
      head.material = mat;

      const eyeL = BABYLON.MeshBuilder.CreateBox("eyeL", { width: 0.25, height: 0.25, depth: 0.15 }, scene);
      eyeL.position.set(-0.25, 2.8, 0.5);
      eyeL.parent = container;
      const eyeMat = new BABYLON.StandardMaterial("eyeMat", scene);
      eyeMat.diffuseColor = BABYLON.Color3.Black();
      eyeL.material = eyeMat;

      const eyeR = eyeL.clone("eyeR");
      eyeR.position.set(0.25, 2.8, 0.5);
      eyeR.parent = container;

      const weapon = BABYLON.MeshBuilder.CreateBox("weapon", { width: 0.5, height: 0.5, depth: 1.8 }, scene);
      weapon.position.set(0.8, 1.8, 0.6);
      weapon.parent = container;
      const weaponMat = new BABYLON.StandardMaterial("weaponMat", scene);
      weaponMat.diffuseColor = new BABYLON.Color3(0.1, 0.1, 0.1);
      weapon.material = weaponMat;

      if (isLocal) {
        const indicator = BABYLON.MeshBuilder.CreateDisc("indicator", { radius: 2.2 }, scene);
        indicator.position.y = 0.05; indicator.rotation.x = Math.PI / 2; indicator.parent = container;
        const indMat = new BABYLON.StandardMaterial("indMat", scene);
        indMat.diffuseColor = new BABYLON.Color3(1, 1, 0); indMat.alpha = 0.3; indicator.material = indMat;
      }
      return { container, body, team };
    };

    const mapCells = mode === "random" ? generateRandomMap(100, 100) : MAPS.default.cells;
    mapCells.forEach(cell => {
      if (cell.type === "wall") {
        const wall = BABYLON.MeshBuilder.CreateBox("wall", { width: 2, height: 3.5, depth: 2 }, scene);
        wall.position.set(cell.x, 1.75, cell.z);
        const mat = new BABYLON.StandardMaterial("wallMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.6, 0.5, 0.4); wall.material = mat;
        walls.push(wall);
      } else if (cell.type === "bush") {
        const bush = BABYLON.MeshBuilder.CreateBox("bush", { width: 2, height: 1.8, depth: 2 }, scene);
        bush.position.set(cell.x, 0.9, cell.z);
        const mat = new BABYLON.StandardMaterial("bushMat", scene);
        mat.diffuseColor = new BABYLON.Color3(0.1, 0.6, 0.1); mat.alpha = 0.65; bush.material = mat;
        bushes.push(bush);
      }
    });

    if (mode === "heist") {
      const s0 = BABYLON.MeshBuilder.CreateBox("safe-0", { size: 6 }, scene);
      s0.position.set(-50, 3, 0);
      const m0 = new BABYLON.StandardMaterial("m0", scene); m0.diffuseColor = BABYLON.Color3.Blue(); s0.material = m0;
      safes[0] = s0;
      const s1 = BABYLON.MeshBuilder.CreateBox("safe-1", { size: 6 }, scene);
      s1.position.set(50, 3, 0);
      const m1 = new BABYLON.StandardMaterial("m1", scene); m1.diffuseColor = BABYLON.Color3.Red(); s1.material = m1;
      safes[1] = s1;
    }

    let myTeam = 0;
    const player = createBrawlerMesh("local", brawlerId, true, 0);
    let health = brawlerConfig.health;
    let ammo = brawlerConfig.maxAmmo;
    let superCharge = 0;
    let gadgets = 3;
    let isDead = false;
    let isInBush = false;
    let lastShootTime = 0;
    let lastReloadTime = Date.now();
    let lastSent = 0;

    setHudData(h => ({ ...h, health, maxHealth: brawlerConfig.health, ammo, maxAmmo: brawlerConfig.maxAmmo, superCharge, gadgets }));

    const createImpact = (pos: BABYLON.Vector3, color: BABYLON.Color3) => {
      const p = BABYLON.MeshBuilder.CreateSphere("impact", { diameter: 0.6 }, scene);
      p.position.copyFrom(pos);
      const m = new BABYLON.StandardMaterial("imat", scene);
      m.emissiveColor = color;
      p.material = m;
      let life = 1.0;
      const obs = scene.onBeforeRenderObservable.add(() => {
        life -= 0.08;
        p.scaling.scaleInPlace(0.85);
        if (life <= 0) { scene.onBeforeRenderObservable.remove(obs); p.dispose(); }
      });
    };

    const spawnProjectile = (pD: any) => {
      const pM = BABYLON.MeshBuilder.CreateSphere("p", { diameter: pD.isSuper ? 1.4 : 0.9 }, scene);
      // Start slightly in front of player
      pM.position.set(pD.x, 1.8, pD.z);
      const pMat = new BABYLON.StandardMaterial("pm", scene);
      const col = pD.team === myTeam ? new BABYLON.Color3(0.3, 0.7, 1) : new BABYLON.Color3(1, 0.3, 0.3);
      pMat.emissiveColor = col;
      pM.material = pMat;

      // Particle trail
      const ps = new BABYLON.ParticleSystem("ps", 20, scene);
      ps.particleTexture = new BABYLON.Texture("https://raw.githubusercontent.com/PatrickRyanMS/BabylonJS_VRExperience/master/assets/textures/flare.png", scene);
      ps.emitter = pM;
      ps.minSize = 0.1; ps.maxSize = 0.3;
      ps.color1 = BABYLON.Color4.FromColor3(col);
      ps.targetStopDuration = 2;
      ps.start();

      let tr = 0;
      const obs = scene.onBeforeRenderObservable.add(() => {
        const dt = engine.getDeltaTime() / 16.6;
        pM.position.x += pD.vx * dt; pM.position.z += pD.vz * dt;
        tr += Math.sqrt(pD.vx**2 + pD.vz**2) * dt;
        if (tr > pD.range) { scene.onBeforeRenderObservable.remove(obs); ps.stop(); pM.dispose(); return; }
        let hitWall = false; walls.forEach(w => { if (BABYLON.Vector3.Distance(pM.position, w.position) < 1.6) hitWall = true; });
        if (hitWall) { createImpact(pM.position, col); scene.onBeforeRenderObservable.remove(obs); ps.stop(); pM.dispose(); return; }

        if (pD.ownerId !== socket.id && !isDead && BABYLON.Vector3.Distance(pM.position, player.container.position.add(new BABYLON.Vector3(0, 1.8, 0))) < 1.8) {
          socket.send(JSON.stringify({ type: "hit", victimId: socket.id, damage: pD.damage }));
          createImpact(pM.position, col); scene.onBeforeRenderObservable.remove(obs); ps.stop(); pM.dispose();
        } else if (pD.ownerId === socket.id) {
          Object.keys(otherPlayers).forEach(oid => {
            if (otherPlayers[oid].team !== myTeam && BABYLON.Vector3.Distance(pM.position, otherPlayers[oid].container.position.add(new BABYLON.Vector3(0, 1.8, 0))) < 1.8) {
              superCharge = Math.min(100, superCharge + 15); setHudData(prev => ({ ...prev, superCharge }));
              createImpact(pM.position, col); scene.onBeforeRenderObservable.remove(obs); ps.stop(); pM.dispose();
            }
          });
          if (mode === "heist") {
            const enemySafe = safes[1 - myTeam];
            if (enemySafe && BABYLON.Vector3.Distance(pM.position, enemySafe.position) < 4) {
              socket.send(JSON.stringify({ type: "hit", isSafe: true, team: 1 - myTeam, damage: pD.damage }));
              createImpact(pM.position, col); scene.onBeforeRenderObservable.remove(obs); ps.stop(); pM.dispose();
            }
          }
        }
      });
    };

    const gadget = () => {
      if (isDead || gadgets <= 0) return;
      gadgets--;
      health = Math.min(brawlerConfig.health, health + 1200);
      setHudData(prev => ({ ...prev, gadgets, health }));
      socket.send(JSON.stringify({ type: "hit", victimId: socket.id, damage: -1200 }));
      createImpact(player.container.position.add(new BABYLON.Vector3(0, 1, 0)), BABYLON.Color3.Green());
    };

    const shoot = (isSuper = false) => {
      if (isDead || (isSuper ? superCharge < 100 : ammo <= 0)) return;
      const now = Date.now();
      if (now - lastShootTime < brawlerConfig.attackCooldown) return;

      if (isSuper) superCharge = 0; else ammo--;
      lastShootTime = now; lastReloadTime = now;
      setHudData(prev => ({ ...prev, ammo, superCharge }));

      const direction = player.container.forward;
      const count = (brawlerId === "shellie" || brawlerId === "bill" || brawlerId === "rose") ? 5 : 1;
      for (let i = 0; i < count; i++) {
        const spread = count > 1 ? (i - (count - 1) / 2) * 0.18 : 0;
        const vx = direction.x + spread * direction.z;
        const vz = direction.z - spread * direction.x;
        const mag = Math.sqrt(vx*vx + vz*vz);

        const pD = {
          id: Math.random().toString(36).substr(2, 9),
          ownerId: socket.id, team: myTeam,
          x: player.container.position.x + direction.x * 1.5,
          z: player.container.position.z + direction.z * 1.5,
          vx: (vx / mag) * (isSuper ? brawlerConfig.projectileSpeed * 1.6 : brawlerConfig.projectileSpeed),
          vz: (vz / mag) * (isSuper ? brawlerConfig.projectileSpeed * 1.6 : brawlerConfig.projectileSpeed),
          damage: isSuper ? brawlerConfig.attackDamage * 2.8 : brawlerConfig.attackDamage,
          range: isSuper ? brawlerConfig.attackRange * 1.8 : brawlerConfig.attackRange,
          isSuper
        };

        spawnProjectile(pD); // Immediate local spawn
        socket.send(JSON.stringify({ type: "shoot", projectile: pD }));
      }
    };

    const inputMap: Record<string, boolean> = {};
    const handleKeyDown = (e: KeyboardEvent) => { inputMap[e.key.toLowerCase()] = true; };
    const handleKeyUp = (e: KeyboardEvent) => {
      if (e.key.toLowerCase() === 'g' && inputMap['g']) gadget();
      inputMap[e.key.toLowerCase()] = false;
    };
    window.addEventListener("keydown", handleKeyDown);
    window.addEventListener("keyup", handleKeyUp);

    const onPointerDown = (e: PointerEvent) => { if (e.button === 0) shoot(inputMap["shift"]); };
    if (canvasRef.current) canvasRef.current.addEventListener("pointerdown", onPointerDown);

    scene.onBeforeRenderObservable.add(() => {
      if (isDead) return;
      let moved = false; const moveVector = BABYLON.Vector3.Zero();
      if (inputMap["w"]) moveVector.z += 1; if (inputMap["s"]) moveVector.z -= 1;
      if (inputMap["a"]) moveVector.x -= 1; if (inputMap["d"]) moveVector.x += 1;
      if (moveVector.length() > 0) {
        moveVector.normalize().scaleInPlace(brawlerConfig.speed);
        const nextPos = player.container.position.add(moveVector);
        let collided = false; walls.forEach(w => { if (BABYLON.Vector3.Distance(nextPos, w.position) < 2.2) collided = true; });
        if (!collided) {
          player.container.position.addInPlace(moveVector);
          camera.position.x = player.container.position.x;
          camera.position.z = player.container.position.z - 45;
          moved = true;
        }
      }
      isInBush = false;
      bushes.forEach(b => { if (BABYLON.Vector3.Distance(player.container.position, b.position) < 1.6) isInBush = true; });

      const visibility = isInBush ? 0.45 : 1.0;
      player.container.getChildMeshes().forEach(m => m.visibility = visibility);

      const pick = scene.pick(scene.pointerX, scene.pointerY);
      if (pick && pick.hit && pick.pickedPoint) {
        const diff = pick.pickedPoint.subtract(player.container.position);
        player.container.rotation.y = Math.atan2(diff.x, diff.z);
      }
      const now = Date.now();
      if (ammo < brawlerConfig.maxAmmo && now - lastReloadTime > brawlerConfig.reloadSpeed) {
        ammo++; lastReloadTime = now; setHudData(prev => ({ ...prev, ammo }));
      }
      if (moved || (now - lastSent > 60)) {
        socket.send(JSON.stringify({
          type: "update",
          state: { x: player.container.position.x, z: player.container.position.z, rotation: player.container.rotation.y, brawlerId, isInBush }
        }));
        lastSent = now;
      }
    });

    const handleMessage = (event: MessageEvent) => {
      const data = JSON.parse(event.data);
      if (data.type === "init") {
        myTeam = data.state.players[data.id].team;
        const pMat = new BABYLON.StandardMaterial("pMat", scene);
        pMat.diffuseColor = BABYLON.Color3.FromHexString(myTeam === 0 ? "#2563eb" : "#dc2626");
        player.container.getChildMeshes().forEach(m => {
          if (m.name.includes("body") || m.name.includes("head")) m.material = pMat;
        });
      } else if (data.type === "sync") {
        Object.keys(data.state.players).forEach(id => {
          if (id === socket.id) return;
          const pD = data.state.players[id];
          if (!otherPlayers[id]) otherPlayers[id] = createBrawlerMesh(id, pD.brawlerId, false, pD.team);
          otherPlayers[id].container.position.set(pD.x, 0, pD.z);
          otherPlayers[id].container.rotation.y = pD.rotation;
          otherPlayers[id].container.setEnabled(!pD.isDead);
          const isHidden = (pD.isInBush && myTeam !== pD.team);
          otherPlayers[id].container.getChildMeshes().forEach(m => m.visibility = isHidden ? 0 : 1);
        });
        setHudData(prev => ({ ...prev, timeLeft: data.state.timer }));
      } else if (data.type === "shoot") {
        if (data.projectile.ownerId !== socket.id) {
           spawnProjectile(data.projectile);
        }
      } else if (data.type === "healthUpdate" && data.id === socket.id) {
        health = data.health; setHudData(prev => ({ ...prev, health }));
      } else if (data.type === "death") {
        if (data.id === socket.id) { isDead = true; player.container.setEnabled(false); setHudData(prev => ({ ...prev, isDead: true })); }
        else if (otherPlayers[data.id]) otherPlayers[data.id].container.setEnabled(false);
      } else if (data.type === "respawn") {
        if (data.id === socket.id) { isDead = false; health = data.state.health; player.container.position.set(data.state.x, 0, data.state.z); player.container.setEnabled(true); setHudData(prev => ({ ...prev, health, isDead: false })); }
        else if (otherPlayers[data.id]) { otherPlayers[data.id].container.setEnabled(true); otherPlayers[data.id].container.position.set(data.state.x, 0, data.state.z); }
      } else if (data.type === "safeUpdate") {
        setHudData(prev => {
          const newS = [...prev.safeHealth]; newS[data.team] = data.health; return { ...prev, safeHealth: newS };
        });
      } else if (data.type === "gameOver") {
        setHudData(prev => ({ ...prev, gameOver: true, winner: data.winner }));
      }
    };

    socket.addEventListener("message", handleMessage);

    engine.runRenderLoop(() => scene.render());
    const resize = () => engine.resize();
    window.addEventListener("resize", resize);

    return () => {
      window.removeEventListener("resize", resize);
      window.removeEventListener("keydown", handleKeyDown);
      window.removeEventListener("keyup", handleKeyUp);
      socket.removeEventListener("message", handleMessage);
      socket.close();
      engine.dispose();
    };
  }, [brawlerId, mode, brawlerConfig]);

  return (
    <div className="relative w-full h-screen bg-slate-900 overflow-hidden font-sans">
      <canvas ref={canvasRef} className="w-full h-full touch-none outline-none" />
      {hudData.gameOver && (
        <div className="absolute inset-0 bg-black/80 flex flex-col items-center justify-center z-[60] backdrop-blur-md">
          <h2 className={`text-8xl font-black italic ${hudData.winner === 0 ? "text-blue-400" : "text-red-400"} mb-8 drop-shadow-2xl`}>
            {hudData.winner === 0 ? "VICTORY" : "DEFEAT"}
          </h2>
          <button onClick={() => window.location.reload()} className="px-12 py-4 bg-yellow-500 text-slate-900 font-black text-2xl rounded-2xl shadow-[0_8px_0_rgb(161,98,7)] transform hover:scale-105 active:scale-95 transition-all uppercase italic">Lobby</button>
        </div>
      )}
      {hudData.isDead && !hudData.gameOver && (
        <div className="absolute inset-0 bg-black/60 flex flex-col items-center justify-center z-50">
          <h2 className="text-7xl font-black italic text-red-500 mb-4 tracking-tighter drop-shadow-lg">DEFEATED</h2>
          <p className="text-white text-xl animate-pulse font-bold tracking-widest uppercase opacity-70">Respawning soon...</p>
        </div>
      )}
      <div className="absolute top-6 left-1/2 -translate-x-1/2 flex gap-8 items-center bg-black/40 backdrop-blur-md px-10 py-4 rounded-3xl border-2 border-white/20 shadow-2xl">
         {mode === "heist" && (
            <div className="flex gap-10 text-white font-black italic text-xl">
               <div className="text-blue-400 drop-shadow-md">{Math.round((hudData.safeHealth[0]/30000)*100)}%</div>
               <div className="opacity-40 tracking-tighter">VS</div>
               <div className="text-red-400 drop-shadow-md">{Math.round((hudData.safeHealth[1]/30000)*100)}%</div>
            </div>
         )}
         <div className="text-white font-black text-3xl tabular-nums tracking-tighter drop-shadow-md">{Math.floor(hudData.timeLeft/60)}:{(hudData.timeLeft%60).toString().padStart(2,'0')}</div>
      </div>
      <div className="absolute bottom-8 left-1/2 -translate-x-1/2 flex flex-col items-center gap-4 w-80">
        <div className="w-full h-10 bg-black/60 rounded-full border-[6px] border-white overflow-hidden relative shadow-2xl">
          <div className="h-full bg-green-500 transition-all duration-300 shadow-[inset_-2px_0_10px_rgba(0,0,0,0.3)]" style={{ width: `${(hudData.health / hudData.maxHealth) * 100}%` }} />
          <div className="absolute inset-0 flex items-center justify-center text-base font-black text-white italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] tracking-tight">{hudData.health} / {hudData.maxHealth}</div>
        </div>

        <div className="flex gap-4 w-full items-end">
          <div className="flex gap-1.5 flex-grow mb-1">
            {Array.from({ length: hudData.maxAmmo }).map((_, i) => (
              <div key={i} className="flex-1 h-5 bg-black/60 rounded-full border-[3px] border-white overflow-hidden shadow-lg">
                <div className={`h-full bg-orange-400 ${i < hudData.ammo ? "w-full" : "w-0"} transition-all duration-200 shadow-[inset_0_0_5px_rgba(0,0,0,0.2)]`} />
              </div>
            ))}
          </div>
          <div className={`w-18 h-18 rounded-2xl flex items-center justify-center transition-all border-[6px] relative shadow-xl ${hudData.gadgets > 0 ? "bg-green-600 border-white active:scale-90" : "bg-slate-800 border-slate-700 opacity-40"}`}>
             <div className="text-white font-black italic text-2xl drop-shadow-md">G</div>
             <div className="absolute -top-3 -right-3 bg-white text-slate-900 w-7 h-7 rounded-full flex items-center justify-center font-black text-sm shadow-md">{hudData.gadgets}</div>
          </div>
          <div className={`w-22 h-22 rounded-full border-[6px] flex flex-col items-center justify-center transition-all shadow-2xl relative ${hudData.superCharge >= 100 ? "bg-yellow-500 border-white scale-110 shadow-[0_0_30px_rgba(234,179,8,1)] active:scale-100" : "bg-slate-900/80 border-slate-700 scale-90"}`}>
             <div className="text-white font-black italic text-[11px] leading-none mb-1 drop-shadow-sm">SUPER</div>
             <div className="text-white font-black text-xl italic leading-none drop-shadow-md">{Math.floor(hudData.superCharge)}%</div>
             {hudData.superCharge >= 100 && <div className="absolute inset-0 rounded-full border-t-[6px] border-white animate-spin opacity-40" />}
          </div>
        </div>
      </div>
      <div className="absolute top-6 left-6 bg-black/50 backdrop-blur-md px-6 py-3 rounded-3xl border-2 border-white/20 shadow-2xl">
        <div className="text-3xl font-black italic text-yellow-400 tracking-widest uppercase drop-shadow-lg leading-none mb-1">{mode.replace('_', ' ')}</div>
        <div className="text-xs font-black text-white/70 uppercase tracking-[0.3em] leading-none">{BRAWLERS[brawlerId].name}</div>
      </div>
      <div className="absolute bottom-6 right-6 opacity-30 hover:opacity-100 transition-opacity pointer-events-none">
         <div className="bg-black/50 p-4 rounded-2xl text-white text-[10px] font-black uppercase tracking-widest leading-relaxed">
            WASD: MOVE<br/>
            MOUSE: AIM<br/>
            CLICK: ATTACK<br/>
            SHIFT: SUPER<br/>
            G: GADGET
         </div>
      </div>
    </div>
  );
}
