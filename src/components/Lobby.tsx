"use client";

import React, { useState, useEffect, useRef } from "react";
import { BRAWLERS } from "@/game/brawlers";
import { Trophy, Users, Shield, Zap, Search, AlertCircle, Settings } from "lucide-react";
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
  const [status, setStatus] = useState("disconnected");
  const [customHost, setCustomHost] = useState(PARTYKIT_HOST);
  const [showSettings, setShowSettings] = useState(false);

  const socketRef = useRef<PartySocket | null>(null);

  useEffect(() => {
    if (isMatching) {
      const room = "matchmaking-" + selectedMode;
      const socket = new PartySocket({
        host: customHost,
        room: room,
      });
      socketRef.current = socket;

      socket.onopen = () => setStatus("connected");
      socket.onclose = () => setStatus("disconnected");
      socket.onerror = () => setStatus("error");

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
            onStart(selectedBrawler, selectedMode, room);
          }
        } catch (e) {
          console.error("Lobby parse error", e);
        }
      };

      return () => {
        socket.close();
        socketRef.current = null;
      };
    }
  }, [isMatching, selectedMode, onStart, selectedBrawler, customHost]);

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

        <div className="flex flex-col items-center gap-2 mb-10">
           <p className="text-2xl text-slate-400 font-bold tracking-wide">
             Players: <span className="text-white">{matchInfo.count} / {matchInfo.required}</span>
           </p>
           <div className="flex items-center gap-2">
             <div className={`w-2 h-2 rounded-full ${status === 'connected' ? 'bg-green-500' : 'bg-red-500 animate-pulse'}`} />
             <span className="text-[10px] font-black uppercase tracking-widest opacity-40">{status}</span>
           </div>
        </div>

        {status === "error" && (
          <div className="bg-red-500/10 border-2 border-red-500/50 p-6 rounded-[2rem] mb-10 max-w-md text-center">
             <div className="flex items-center justify-center gap-2 text-red-500 mb-2">
                <AlertCircle size={24} />
                <h3 className="font-black italic uppercase tracking-tight">Connection Error</h3>
             </div>
             <p className="text-xs text-slate-400 font-bold leading-relaxed mb-4">
               Failed to connect to <code className="text-white">{customHost}</code>. Ensure your PartyKit server is running (`npx partykit dev`) or deploy it (`npx partykit deploy`).
             </p>
          </div>
        )}

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
        <h1 className="text-4xl font-black italic text-amber-400 tracking-tighter">BRAWL WEB</h1>
        <div className="flex items-center gap-5">
           <button onClick={() => setShowSettings(!showSettings)} className="text-white/40 hover:text-white transition-colors">
              <Settings size={24} />
           </button>
           <div className="w-12 h-12 bg-blue-600 rounded-2xl border-4 border-white/10 shadow-lg"></div>
        </div>
      </div>

      <main className="flex-1 flex flex-col md:flex-row p-8 gap-8 overflow-hidden relative">
        {showSettings && (
           <div className="absolute top-0 right-8 z-50 bg-slate-900 border-2 border-white/10 p-6 rounded-3xl shadow-2xl w-80 animate-in slide-in-from-top-4">
              <h3 className="font-black italic uppercase text-amber-500 text-sm mb-4">Server Settings</h3>
              <div className="flex flex-col gap-2">
                 <label className="text-[10px] font-black uppercase opacity-40">PartyKit Host</label>
                 <input
                   type="text"
                   value={customHost}
                   onChange={(e) => setCustomHost(e.target.value)}
                   className="bg-black/40 border border-white/10 rounded-xl px-4 py-2 text-sm font-mono focus:outline-none focus:border-amber-500/50 text-white"
                 />
              </div>
           </div>
        )}

        <div className="flex-1 flex flex-col items-center justify-center relative bg-gradient-to-br from-slate-900 via-slate-800 to-slate-950 rounded-[3rem] border-2 border-white/5 shadow-2xl overflow-hidden group">
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

          <div className="w-56 h-80 rounded-[2.5rem] shadow-2xl transform group-hover:scale-105 transition-all duration-700 flex flex-col items-center justify-center p-6 border-4 border-white/10"
               style={{ backgroundColor: current.color }}>
             <div className="w-24 h-24 bg-black/30 rounded-full mb-6"></div>
             <div className="w-40 h-48 bg-black/20 rounded-3xl"></div>
          </div>

          <div className="mt-12 text-center">
            <h2 className="text-7xl font-black italic tracking-tighter uppercase mb-3">{current.name}</h2>
            <p className="text-slate-500 font-bold uppercase tracking-widest text-xs">{current.description}</p>
          </div>
        </div>

        <div className="w-full md:w-[450px] flex flex-col gap-8">
          <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border-2 border-white/5 backdrop-blur-md flex-1 overflow-hidden flex flex-col shadow-xl">
             <h3 className="font-black italic uppercase text-slate-500 text-sm tracking-[0.3em] mb-6">Brawlers</h3>
             <div className="grid grid-cols-4 gap-3 overflow-y-auto pr-2 custom-scrollbar">
                {brawlers.map(b => (
                   <button
                     key={b.id}
                     onClick={() => setSelectedBrawler(b.id)}
                     className={`aspect-square rounded-2xl border-[4px] transition-all ${selectedBrawler === b.id ? "border-amber-400 bg-amber-400/20" : "border-transparent bg-slate-800/40 hover:bg-slate-800/80"}`}
                     style={{ backgroundColor: selectedBrawler === b.id ? b.color : b.color + '66' }}
                   >
                     <span className="text-[11px] font-black italic drop-shadow-md">{b.name}</span>
                   </button>
                ))}
             </div>
          </div>

          <div className="bg-slate-900/50 rounded-[2.5rem] p-8 border-2 border-white/5 shadow-2xl">
             <h3 className="font-black italic uppercase text-slate-500 text-sm tracking-[0.3em] mb-6">Event</h3>
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
                     className={`flex items-center gap-6 p-4 rounded-[1.5rem] transition-all ${selectedMode === m.id ? "bg-white/10 ring-2 ring-amber-500/50" : "hover:bg-white/5"}`}
                   >
                     <div className={`w-14 h-14 ${m.color} rounded-2xl shadow-xl flex items-center justify-center font-black italic text-xl`}>{m.name[0]}</div>
                     <div className="flex flex-col text-left">
                        <span className="font-black italic tracking-tighter text-2xl uppercase">{m.name}</span>
                        <span className="text-[10px] font-black tracking-widest uppercase opacity-40">{m.desc}</span>
                     </div>
                   </button>
                ))}
             </div>
          </div>

          <button
            onClick={() => setIsMatching(true)}
            className="w-full py-8 bg-amber-400 hover:bg-amber-300 text-slate-950 font-black text-5xl rounded-[2.5rem] shadow-[0_12px_0_rgb(180,83,9)] active:translate-y-2 active:shadow-none transition-all uppercase italic tracking-tighter"
          >
            Play
          </button>
        </div>
      </main>
    </div>
  );
}
