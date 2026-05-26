"use client";

import React, { useState } from "react";
import Lobby from "@/components/Lobby";
import GameScene from "@/components/GameScene";

export default function Home() {
  const [gameState, setGameState] = useState<{
    inGame: boolean;
    brawlerId: string;
    mode: string;
  }>({
    inGame: false,
    brawlerId: "shellie",
    mode: "solo",
  });

  const handleStart = (brawlerId: string, mode: string) => {
    setGameState({ inGame: true, brawlerId, mode });
  };

  if (!gameState.inGame) {
    return <Lobby onStart={handleStart} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden">
      <GameScene brawlerId={gameState.brawlerId} mode={gameState.mode} />
    </main>
  );
}
