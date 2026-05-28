"use client";

import React, { useState, useEffect } from "react";
import { BRAWLERS } from "@/game/brawlers";
import { Trophy, Users, Shield, Zap, Search } from "lucide-react";
import PartySocket from "partysocket";
import { PARTYKIT_HOST } from "@/lib/env";

interface LobbyProps {
  onStart: (brawlerId: string, mode: string, roomId: string) => void;
}

export default function Lobby({ onStart }: LobbyProps) {
  const [selectedBrawler, setSelectedBrawler] = useState("shellie");
  const [selectedMode, setSelectedMode] = useState("solo");
  const [isMatching, setIsMatching] = useState(false);
  const [matchInfo, setMatchInfo] = useState({ count: 0, required: 0, timer: 60 });

  useEffect(() => {
    let socket: PartySocket | null = null;
    if (isMatching) {
      socket = new PartySocket({
        host: PARTYKIT_HOST,
        room: "matchmaking-" + selectedMode,
      });

      socket.onmessage = (event) => {
        try {
          const data = JSON.parse(event.data);
          if (data.type === "lobbySync") {
            setMatchInfo({
              count: data.count || 0,
              required: data.required || 0,
              timer: typeof data.timer === 'number' ? data.timer : 60
            });
          } else if (data.type === "matchStart") {
            onStart(selectedBrawler, selectedMode, "matchmaking-" + selectedMode);
          }
        } catch (e) {
          console.error("Failed to parse message", e);
        }
      };
    }

    return () => {
      if (socket) socket.close();
    };
  }, [isMatching, selectedMode, onStart, selectedBrawler]);

  const brawlers = Object.values(BRAWLERS);
  const current = BRAWLERS[selectedBrawler];

  if (isMatching) {
    return (
      <div className="flex flex-col items-center justify-center min-h-screen bg-slate-950 text-white p-8 animate-in fade-in duration-500">
        <div className="relative w-56 h-56 mb-10">
           <div className="absolute inset-0 border-[10px] border-amber-500/20 rounded-full"></div>
           <div className="absolute inset-0 border-[10px] border-amber-500 rounded-full border-t-transparent animate-spin"></div>
           <div className="absolute inset-0 flex items-center justify-center">
             <Search size={80} className="text-amber-500 animate-pulse" />
           </div>
        </div>
        <h2 className="text-5xl font-black italic mb-4 uppercase tracking-tighter text-amber-400">Matchmaking</h2>
        <p className="text-2xl text-slate-400 font-bold mb-10 tracking-wide">
          Searching for players: <span className="text-white">{matchInfo.count} / {matchInfo.required}</span>
        </p>
        <div className="text-3xl font-black bg-white/5 px-10 py-4 rounded-3xl border-2 border-white/10 tabular-nums">
          00:{matchInfo.timer.toString().padStart(2, '0')}
        </div>
        <button
          onClick={() => setIsMatching(false)}
          className="mt-16 text-slate-500 hover:text-white font-black uppercase tracking-[0.2em] text-sm transition-all hover:scale-105 active:scale-95"
        >
          Cancel Search
        </button>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-[#020617] text-white overflow-hidden font-sans select-none">
      <div className="flex justify-between items-center p-6 bg-black/40 backdrop-blur-xl border-b-2 border-white/5 shadow-2xl">
        <div className="flex items-center gap-6">
           <div className="bg-amber-500 p-2 rounded-xl shadow-[0_0_15px_rgba(245,158,11,0.4)]">
             <Trophy size={24} className="text-slate-900" />
           </div>
           <span className="font-black text-2xl italic tracking-tighter text-amber-500">12,450</span>
        </div>
        <h1 className="text-4xl font-black italic text-amber-400 tracking-tighter drop-shadow-[0_4px_4px_rgba(0,0,0,0.5)]">BRAWL WEB</h1>
        <div className="flex items-center gap-5">
           <span className="font-black opacity-50 tracking-widest text-sm">GUEST_429</span>
           <div className="w-12 h-12 bg-blue-600 rounded-2xl border-4 border-white/10 shadow-lg rotate-3 hover:rotate-0 transition-transform cursor-pointer"></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row p-8 gap-8 overflow-hidden">
        <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-[3rem] border-2 border-white/5 shadow-[0_30px_60px_-15px_rgba(0,0,0,0.7)] overflow-hidden group">
          <div className="absolute top-10 left-10 flex flex-col gap-3">
             <div className="flex items-center gap-3 bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/5">
                <Shield size={20} className="text-emerald-400" />
                <span className="font-black italic text-2xl tracking-tighter">{current.health}</span>
             </div>
             <div className="flex items-center gap-3 bg-black/50 px-6 py-3 rounded-2xl backdrop-blur-xl border border-white/5">
                <Zap size={20} className="text-amber-500" />
                <span className="font-black italic text-2xl tracking-tighter">{current.attackDamage}</span>
             </div>
          </div>

          <div className="w-[500px] h-[500px] rounded-full bg-amber-500/5 blur-[120px] absolute pointer-events-none"></div>

          <div
            className="w-56 h-80 rounded-[2.5rem] shadow-[0_40px_80px_-20px_rgba(0,0,0,0.8)] transform group-hover:scale-105 transition-all duration-700 flex flex-col items-center justify-center p-6 border-4 border-white/10 relative overflow-hidden"
            style={{ backgroundColor: current.color }}
          >
             <div className="w-24 h-24 bg-black/30 rounded-full mb-6 shadow-inner"></div>
             <div className="w-40 h-48 bg-black/20 rounded-3xl shadow-inner"></div>
             <div className="absolute inset-0 bg-gradient-to-t from-black/40 to-transparent"></div>
          </div>

          <div className="mt-12 text-center relative z-10">
            <h2 className="text-7xl font-black italic tracking-tighter uppercase mb-3 drop-shadow-2xl">{current.name}</h2>
            <div className="flex gap-2 justify-center">
              <span className="bg-amber-500/20 text-amber-500 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-amber-500/30">Legendary</span>
              <span className="bg-blue-500/20 text-blue-400 px-4 py-1 rounded-full text-xs font-black tracking-widest uppercase border border-blue-500/30">Fighter</span>
            </div>
          </div>

          <button className="absolute bottom-10 right-10 bg-white/5 hover:bg-amber-500 hover:text-slate-950 p-6 rounded-[2rem] backdrop-blur-xl transition-all active:scale-90 border-2 border-white/5 hover:border-amber-400 shadow-2xl">
             <Users size={32} />
          </button>
        </div>

        <div className="w-full md:w-[450px] flex flex-col gap-8">
          <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border-2 border-white/5 backdrop-blur-md flex-1 shadow-2xl">
             <div className="flex justify-between items-center mb-6">
                <h3 className="font-black italic uppercase text-slate-500 text-sm tracking-[0.3em]">Selection</h3>
                <span className="text-xs font-black bg-amber-500 text-slate-950 px-3 py-1 rounded-lg shadow-lg">20 / 20</span>
             </div>
             <div className="grid grid-cols-4 gap-3 overflow-y-auto max-h-[380px] pr-3 custom-scrollbar">
                {brawlers.map(b => (
                   <button
                     key={b.id}
                     onClick={() => setSelectedBrawler(b.id)}
                     className={`aspect-square rounded-2xl border-[4px] transition-all relative overflow-hidden ${
                       selectedBrawler === b.id ? "border-amber-400 scale-105 shadow-[0_0_25px_rgba(245,158,11,0.5)]" : "border-transparent bg-slate-800/40 hover:bg-slate-800/80"
                     }`}
                     style={{ backgroundColor: selectedBrawler === b.id ? b.color : b.color + '66' }}
                   >
                     <span className="text-[11px] font-black italic drop-shadow-[0_2px_2px_rgba(0,0,0,0.8)] relative z-10 leading-tight">{b.name}</span>
                     {selectedBrawler === b.id && <div className="absolute inset-0 bg-white/10 animate-pulse" />}
                   </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border-2 border-white/5 backdrop-blur-md shadow-2xl">
             <h3 className="font-black italic uppercase text-slate-500 text-sm tracking-[0.3em] mb-6">Current Event</h3>
             <div className="flex flex-col gap-4">
                {[
                  { id: 'solo', name: 'Showdown', color: 'bg-emerald-500', desc: '10 Players' },
                  { id: 'gem_grab', name: 'Gem Grab', color: 'bg-indigo-600', desc: '3 VS 3' },
                  { id: 'heist', name: 'Heist', color: 'bg-rose-600', desc: '3 VS 3' },
                  { id: '1v1', name: '1v1 Dual', color: 'bg-sky-600', desc: '1 VS 1' }
                ].map(m => (
                   <button
                     key={m.id}
                     onClick={() => setSelectedMode(m.id)}
                     className={`flex items-center gap-6 p-4 rounded-[1.5rem] transition-all group ${
                       selectedMode === m.id ? "bg-white/10 ring-2 ring-amber-500/50" : "hover:bg-white/5"
                     }`}
                   >
                     <div className={`w-16 h-16 ${m.color} rounded-2xl shadow-2xl flex items-center justify-center font-black italic text-2xl group-hover:scale-110 transition-transform`}>
                        {m.name[0]}
                     </div>
                     <div className="flex flex-col text-left">
                        <span className="font-black italic tracking-tighter text-2xl uppercase leading-none mb-1">{m.name}</span>
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-40">{m.desc}</span>
                     </div>
                   </button>
                ))}
             </div>
          </div>

          <button
            onClick={() => setIsMatching(true)}
            className="w-full py-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-5xl rounded-[2.5rem] shadow-[0_12px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none transition-all uppercase italic tracking-tighter ring-4 ring-black/20"
          >
            Play
          </button>
        </div>
      </main>
    </div>
  );
}
