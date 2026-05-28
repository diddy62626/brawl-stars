"use client";

import React, { useState, useCallback } from "react";
import Lobby from "@/components/Lobby";
import GameScene from "@/components/GameScene";

export default function Home() {
  const [gameState, setGameState] = useState<{
    inGame: boolean;
    brawlerId: string;
    mode: string;
    roomId: string;
  }>({
    inGame: false,
    brawlerId: "shellie",
    mode: "solo",
    roomId: "",
  });

  const handleStart = useCallback((brawlerId: string, mode: string, roomId: string) => {
    setGameState({ inGame: true, brawlerId, mode, roomId });
  }, []);

  if (!gameState.inGame) {
    return <Lobby onStart={handleStart} />;
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-between overflow-hidden">
      <GameScene brawlerId={gameState.brawlerId} mode={gameState.mode} roomId={gameState.roomId} />
    </main>
  );
}
