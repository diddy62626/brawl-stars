"use client";

import React, { useState, useEffect, useCallback } from "react";
import { BRAWLERS } from "@/game/brawlers";
import { Trophy, Users, Shield, Zap, Search } from "lucide-react";

interface LobbyProps {
  onStart: (brawlerId: string, mode: string) => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  const [selectedBrawler, setSelectedBrawler] = useState("shellie");
  const [selectedMode, setSelectedMode] = useState("solo");
  const [isMatching, setIsMatching] = useState(false);
  const [matchTime, setMatchTime] = useState(0);

  useEffect(() => {
    let interval: NodeJS.Timeout;
    let timeout: NodeJS.Timeout;
    if (isMatching) {
      interval = setInterval(() => setMatchTime(t => t + 1), 1000);
      timeout = setTimeout(() => {
        onStart(selectedBrawler, selectedMode);
      }, 2000 + Math.random() * 3000);
    }
    return () => {
      if (interval) clearInterval(interval);
      if (timeout) clearTimeout(timeout);
    };
  }, [isMatching, onStart, selectedBrawler, selectedMode]);

  const brawlers = Object.values(BRAWLERS);
  const current = BRAWLERS[selectedBrawler];

  const handlePlayClick = useCallback(() => {
    setMatchTime(0);
    setIsMatching(true);
  }, []);

  const handleCancelClick = useCallback(() => {
    setIsMatching(false);
  }, []);

  if (isMatching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-900 text-white p-8 animate-in fade-in duration-500">
        <div className="relative w-48 h-48 mb-8">
           <div className="absolute inset-0 border-8 border-yellow-400/20 rounded-full"></div>
           <div className="absolute inset-0 border-8 border-yellow-400 rounded-full border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Search size={64} className="text-yellow-400 animate-pulse" />
           </div>
        </div>
        <h2 className="text-4xl font-black italic mb-2 uppercase tracking-tighter">Matchmaking</h2>
        <p className="text-xl text-slate-400 font-bold mb-8">Searching for players in {selectedMode.replace('_', ' ')}...</p>
        <div className="text-2xl font-mono bg-black/40 px-6 py-2 rounded-full border border-white/10">
          00:{matchTime.toString().padStart(2, '0')}
        </div>
        <button
          onClick={handleCancelClick}
          className="mt-12 text-slate-400 hover:text-white font-bold uppercase tracking-widest text-sm transition-colors"
        >
          Cancel
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#0f172a] text-white overflow-hidden font-sans">
      <div className="flex justify-between items-center p-4 bg-black/20 backdrop-blur-md border-b border-white/5">
        <div className="flex items-center gap-4">
           <div className="bg-yellow-500 p-1 rounded-lg">
             <Trophy size={20} className="text-slate-900" />
           </div>
           <span className="font-black text-xl italic tracking-tighter">12,450</span>
        </div>
        <h1 className="text-3xl font-black italic text-yellow-400 tracking-tighter drop-shadow-md">BRAWL WEB</h1>
        <div className="flex items-center gap-4">
           <span className="font-bold opacity-60">Guest_429</span>
           <div className="w-10 h-10 bg-blue-500 rounded-full border-2 border-white/20"></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row p-6 gap-6 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-b from-slate-800 to-slate-900 rounded-3xl border-2 border-white/5 shadow-2xl overflow-hidden group">
          <div className="absolute top-8 left-8 flex flex-col gap-2">
             <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                <Shield size={16} className="text-green-400" />
                <span className="font-black italic text-lg">{current.health}</span>
             </div>
             <div className="flex items-center gap-2 bg-black/40 px-4 py-2 rounded-xl backdrop-blur-md">
                <Zap size={16} className="text-orange-400" />
                <span className="font-black italic text-lg">{current.attackDamage}</span>
             </div>
          </div>

          <div className="w-64 h-64 rounded-full bg-yellow-400/10 blur-3xl absolute"></div>

          <div
            className="w-48 h-72 rounded-2xl shadow-2xl transform hover:scale-110 transition-all duration-500 flex flex-col items-center justify-center p-4 border-4 border-white/10"
            style={{ backgroundColor: current.color }}
          >
             <div className="w-20 h-20 bg-black/20 rounded-full mb-4"></div>
             <div className="w-32 h-40 bg-black/10 rounded-xl"></div>
          </div>

          <div className="mt-8 text-center">
            <h2 className="text-5xl font-black italic tracking-tighter uppercase mb-2">{current.name}</h2>
            <p className="text-slate-400 font-bold uppercase tracking-widest text-sm">{current.description}</p>
          </div>

          <button
             className="absolute bottom-8 right-8 bg-white/10 hover:bg-white/20 p-4 rounded-2xl backdrop-blur-md transition-all active:scale-95 border border-white/10"
          >
             <Users size={24} />
          </button>
        </div>

        <div className="w-full md:w-96 flex flex-col gap-6">
          <div className="bg-slate-800/50 rounded-3xl p-6 border-2 border-white/5 backdrop-blur-sm flex-1">
             <div className="flex justify-between items-center mb-4">
                <h3 className="font-black italic uppercase text-slate-400 text-sm tracking-widest">Select Brawler</h3>
                <span className="text-xs font-bold bg-white/10 px-2 py-1 rounded">20 / 20</span>
             </div>
             <div className="grid grid-cols-4 gap-2 overflow-y-auto max-h-[300px] pr-2 custom-scrollbar">
                {brawlers.map(b => (
                   <button
                     key={b.id}
                     onClick={() => setSelectedBrawler(b.id)}
                     className={`aspect-square rounded-xl border-4 transition-all ${
                       selectedBrawler === b.id ? "border-yellow-400 scale-105 shadow-[0_0_15px_rgba(234,179,8,0.4)]" : "border-transparent bg-slate-700/50 hover:bg-slate-700"
                     }`}
                     style={{ backgroundColor: selectedBrawler === b.id ? b.color : b.color + '88' }}
                   >
                     <span className="text-[10px] font-black italic drop-shadow-md">{b.name}</span>
                   </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-800/50 rounded-3xl p-6 border-2 border-white/5 backdrop-blur-sm">
             <h3 className="font-black italic uppercase text-slate-400 text-sm tracking-widest mb-4">Event</h3>
             <div className="flex flex-col gap-3">
                {[
                  { id: 'solo', name: 'Showdown', color: 'bg-green-500' },
                  { id: 'gem_grab', name: 'Gem Grab', color: 'bg-purple-500' },
                  { id: 'heist', name: 'Heist', color: 'bg-red-500' },
                  { id: '1v1', name: '1v1 Dual', color: 'bg-blue-500' }
                ].map(m => (
                   <button
                     key={m.id}
                     onClick={() => setSelectedMode(m.id)}
                     className={`flex items-center gap-4 p-3 rounded-2xl transition-all ${
                       selectedMode === m.id ? "bg-white/10 ring-2 ring-white/20" : "hover:bg-white/5"
                     }`}
                   >
                     <div className={`w-12 h-12 ${m.color} rounded-xl shadow-lg flex items-center justify-center font-black italic`}>
                        {m.name[0]}
                     </div>
                     <span className="font-black italic tracking-tighter text-lg uppercase">{m.name}</span>
                   </button>
                ))}
             </div>
          </div>

          <button
            onClick={handlePlayClick}
            className="w-full py-6 bg-yellow-400 hover:bg-yellow-300 text-slate-900 font-black text-4xl rounded-3xl shadow-[0_10px_0_rgb(161,98,7)] active:translate-y-2 active:shadow-none transition-all uppercase italic tracking-tighter"
          >
            Play
          </button>
        </div>
      </main>
    </div>
  );
}
