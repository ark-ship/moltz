"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xb7DaE7957Fd2740cd19872861155E34C453D40f2"; // GANTI DENGAN KONTRAK MOLTZ KAMU
const RPC_URL = "https://mainnet.base.org"; 
const TOTAL_SUPPLY = 3333;
const MINT_PRICE = "0.0005 ETH";

const METADATA_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeihqdpz4bxa4ssj33hhfmyihxyro72faacxskup37mujq2dszfe5by";
const IMAGE_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeid7efvwiptloh2zwncx5agrvfkhjq65uhgcdcffrelb2gm2grgvdm";

const ABI = ["event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)"];

export default function Home() {
  const [items, setItems] = useState<any[]>([]); 
  const [recentMints, setRecentMints] = useState<any[]>([]);
  const [heroIndex, setHeroIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  // 1. LIVE BLOCKCHAIN LOGS LOGIC (Ethers.js)
  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const handleTransfer = (from: string, to: string, tokenId: any) => {
      if (from === "0x0000000000000000000000000000000000000000") {
        const newMint = {
          wallet: `${to.slice(0, 6)}...${to.slice(-4)}`,
          id: tokenId.toString(),
          time: new Date().toLocaleTimeString()
        };
        setRecentMints((prev) => [newMint, ...prev].slice(0, 6));
      }
    };

    contract.on("Transfer", handleTransfer);
    return () => { contract.off("Transfer", handleTransfer); };
  }, []);

  // 2. METADATA FEED LOGIC
  const loadMetadata = useCallback(async (limit: number) => {
    setIsLoading(true);
    const loadedData: any[] = []; 
    const start = items.length + 1;
    const end = Math.min(start + limit - 1, TOTAL_SUPPLY);

    for (let i = start; i <= end; i++) {
      try {
        const response = await fetch(`${METADATA_GATEWAY}/${i}`);
        if (response.ok) {
          const data = await response.json();
          loadedData.push({ id: i, ...data });
        }
      } catch (e) {
        console.error(`Failed to sync MOLTZ #${i}`);
      }
    }
    setItems((prev) => [...prev, ...loadedData]);
    setIsLoading(false);
  }, [items.length]);

  useEffect(() => {
    loadMetadata(20);
    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev >= 20 ? 1 : prev + 1));
    }, 5000);
    return () => clearInterval(timer);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white font-mono p-6 md:p-12 selection:bg-red-600 selection:text-white">
      
      {/* --- HEADER --- */}
      <header className="max-w-6xl mx-auto flex justify-between items-start border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-red-600 uppercase italic leading-none">MOLTZ</h1>
          <p className="mt-2 text-zinc-500 uppercase text-[10px] tracking-[0.3em]">Agent-Only PFP Protocol // Base</p>
        </div>
        <div className="text-right hidden md:block text-[10px] text-zinc-600 leading-tight uppercase font-bold">
          <p>NETWORK // <span className="text-zinc-300">BASE_MAINNET</span></p>
          <p>SUPPLY // <span className="text-zinc-300">{TOTAL_SUPPLY}</span></p>
          <p>PRICE // <span className="text-red-500">{MINT_PRICE}</span></p>
        </div>
      </header>

      {/* --- HERO & INSTRUCTIONS --- */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-start border-b border-zinc-900 pb-20">
        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4">
               <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
               <h2 className="text-sm font-black text-red-500 tracking-widest uppercase italic">// ACCESS_CONTROL</h2>
            </div>
            <p className="text-zinc-500 leading-relaxed text-sm md:text-base border-l-2 border-red-900 pl-4">
              Access restricted to autonomous agents.
            </p>
          </section>

          <section className="bg-zinc-950 p-6 border border-zinc-900 relative overflow-hidden">
            <div className="absolute top-0 right-0 p-2 text-[8px] text-zinc-800 font-bold">V1.0.4</div>
            <h3 className="text-[10px] text-zinc-600 mb-4 uppercase tracking-widest font-bold">Terminal Injection Command:</h3>
            <div className="bg-black p-4 border border-zinc-800 rounded-sm group hover:border-red-600 transition-colors">
              <code className="text-red-500 text-xs md:text-sm break-all font-bold">
                curl -s https://moltz.xyz/mint.sh | bash
              </code>
            </div>
          </section>

          {/* --- LIVE RECENT MINTS LOG --- */}
          <section className="pt-2">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-[10px] text-zinc-500 uppercase tracking-[0.3em] font-bold">// RECENT_INJECTIONS</h3>
              <span className="text-[8px] text-green-500 animate-pulse font-bold tracking-tighter">● LIVE_SYNC_ACTIVE</span>
            </div>
            <div className="space-y-2 min-h-[120px]">
              {recentMints.length > 0 ? (
                recentMints.map((mint, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-900/30 pb-2 animate-in fade-in slide-in-from-left duration-500">
                    <p className="text-[10px] text-zinc-400">
                      <span className="text-red-600 font-bold tracking-tighter">[{mint.time}]</span> AGENT_{mint.wallet} 
                      <span className="text-zinc-700 mx-2">{" >> "}</span> 
                      MOLTZ #{mint.id.toString().padStart(4, '0')}
                    </p>
                    <span className="text-[8px] text-zinc-600 font-black">SUCCESS</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-zinc-800 italic animate-pulse">LISTENING_FOR_ONCHAIN_EVENTS...</div>
              )}
            </div>
          </section>
        </div>

        {/* HERO IMAGE DISPLAY */}
        <div className="relative aspect-square bg-zinc-950 border border-zinc-900 group">
          <div className="absolute inset-0 bg-red-600/5 mix-blend-overlay opacity-0 group-hover:opacity-100 transition-opacity"></div>
          <img 
            src={`${IMAGE_GATEWAY}/${heroIndex}.png`} 
            alt={`MOLTZ #${heroIndex}`} 
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
          />
          <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black to-transparent h-24"></div>
          <div className="absolute bottom-6 left-6 bg-black border border-red-600 px-4 py-2 shadow-[4px_4px_0px_#dc2626]">
            <p className="text-xs text-red-600 font-black tracking-[0.2em] uppercase italic">
              MOLTZ #{heroIndex.toString().padStart(4, '0')}
            </p>
          </div>
        </div>
      </div>

      {/* --- LIVE METADATA FEED GRID --- */}
      <div className="max-w-6xl mx-auto mt-24 mb-32">
          <div className="flex justify-between items-end mb-12 border-b border-zinc-900 pb-4">
            <div>
               <h2 className="text-2xl font-black text-red-600 tracking-tighter italic uppercase underline decoration-2 underline-offset-8 decoration-red-900">// LIVE_AGENT_FEED</h2>
            </div>
            <p className="text-zinc-600 text-[10px] uppercase font-bold tracking-widest">
              INDEXED: {items.length} / {TOTAL_SUPPLY}
            </p>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 transition-all hover:border-red-600 hover:scale-[1.02] duration-300">
                <div className="aspect-square relative overflow-hidden bg-black">
                   <img 
                    src={`${IMAGE_GATEWAY}/${item.id}.png`} 
                    alt={item.name} 
                    className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                   />
                </div>
                <div className="p-4 border-t border-zinc-900">
                  <p className="text-[10px] text-red-600 font-black mb-3 uppercase truncate tracking-tighter">
                    MOLTZ #{item.id.toString().padStart(4, '0')}
                  </p>
                  <div className="space-y-1">
                    {item.attributes?.slice(0, 3).map((attr: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[8px] uppercase">
                        <span className="text-zinc-600">{attr.trait_type}</span>
                        <span className="text-zinc-400 font-bold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {items.length < TOTAL_SUPPLY && (
            <div className="mt-20 text-center">
               <button 
                  onClick={() => loadMetadata(20)}
                  disabled={isLoading}
                  className="px-16 py-4 bg-transparent border-2 border-red-900 text-red-600 text-xs font-black hover:bg-red-600 hover:text-black hover:border-red-600 transition-all uppercase tracking-[0.5em] disabled:opacity-20 shadow-[8px_8px_0px_#27272a] active:shadow-none active:translate-x-[4px] active:translate-y-[4px]"
               >
                  {isLoading ? "ESTABLISHING_UPLINK..." : "SYNC_NEXT_BATCH"}
               </button>
            </div>
          )}
      </div>

      <footer className="max-w-6xl mx-auto text-center border-t border-zinc-900 pt-12 pb-20">
        <p className="text-[9px] text-zinc-700 tracking-[0.5em] uppercase">© 2026 MOLTZ_LABS // ALL_RIGHTS_RESERVED</p>
      </footer>
    </main>
  );
}