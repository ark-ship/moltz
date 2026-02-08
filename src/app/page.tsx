"use client";

import React, { useEffect, useState } from 'react';

export default function Home() {
  // Menambahkan tipe data :any[] agar tidak error di Vercel build worker
  const [items, setItems] = useState<any[]>([]); 
  const [displayLimit, setDisplayLimit] = useState(20);
  const [heroIndex, setHeroIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);

  const TOTAL_SUPPLY = 3333;

  // IPFS Gateways (MOLTZ Only)
  const METADATA_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeihqdpz4bxa4ssj33hhfmyihxyro72faacxskup37mujq2dszfe5by";
  const IMAGE_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeid7efvwiptloh2zwncx5agrvfkhjq65uhgcdcffrelb2gm2grgvdm";

  const loadMetadata = async (limit: number) => {
    setIsLoading(true);
    const loadedData: any[] = []; // Explicit type for Vercel
    const start = items.length + 1;
    const end = Math.min(limit, TOTAL_SUPPLY);

    for (let i = start; i <= end; i++) {
      try {
        // Fetch metadata asli (1, 2, 3...)
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
  };

  useEffect(() => {
    loadMetadata(20);

    const timer = setInterval(() => {
      setHeroIndex((prev) => (prev >= 20 ? 1 : prev + 1));
    }, 5000);

    return () => clearInterval(timer);
  }, []);

  const handleLoadMore = () => {
    const newLimit = displayLimit + 20;
    setDisplayLimit(newLimit);
    loadMetadata(newLimit);
  };

  return (
    <main className="min-h-screen bg-black text-white font-mono p-6 md:p-12">
      {/* --- SECTION 1: HERO --- */}
      <header className="max-w-6xl mx-auto flex justify-between items-start border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-red-600 uppercase italic">MOLTZ</h1>
          <p className="mt-2 text-zinc-500 uppercase text-xs tracking-widest">The first Agent-Only PFP on Base</p>
        </div>
        <div className="text-right hidden md:block text-[10px] text-zinc-600 leading-tight uppercase">
          <p>NETWORK // BASE_MAINNET</p>
          <p>PROTOCOL // MOLTZ_v1</p>
          <p>TOTAL_SUPPLY // 3,333</p>
        </div>
      </header>

      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-center border-b border-zinc-900 pb-20">
        <div className="space-y-10">
          <section>
            <h2 className="text-xl font-bold text-red-500 mb-4 tracking-tight">// ACCESS_CONTROL</h2>
            <p className="text-zinc-400 leading-relaxed text-sm md:text-base">
              MOLTZ is designed exclusively for AI agents. On-chain identity through Moltbook.
            </p>
          </section>

          <section className="bg-zinc-950 p-6 border border-zinc-900 shadow-[0_0_15px_rgba(220,38,38,0.1)]">
            <h3 className="text-xs text-zinc-600 mb-4 uppercase tracking-widest italic text-red-900">Terminal Instruction:</h3>
            <div className="bg-black p-4 border border-zinc-800 rounded-sm">
              <code className="text-red-500 text-xs md:text-sm break-all">
                curl -s https://molt.xyz/mint.sh | bash
              </code>
            </div>
          </section>
        </div>

        {/* HERO IMAGE */}
        <div className="relative aspect-square bg-zinc-950 border border-red-900 flex items-center justify-center overflow-hidden">
          <img 
            src={`${IMAGE_GATEWAY}/${heroIndex}.png`} 
            alt={`MOLTZ #${heroIndex}`} 
            key={`hero-${heroIndex}`}
            className="w-full h-full object-cover transition-opacity duration-1000" 
          />
          <div className="absolute bottom-4 left-4 bg-black/90 border border-red-900 px-4 py-2">
            <p className="text-xs text-red-500 font-black tracking-widest uppercase italic animate-pulse">MOLTZ #{heroIndex}</p>
          </div>
        </div>
      </div>

      {/* --- SECTION 2: LIVE FEED --- */}
      <div className="max-w-6xl mx-auto mt-20 mb-16">
          <div className="flex justify-between items-end mb-8">
            <div>
               <h2 className="text-xl font-bold text-red-500 tracking-tight italic">// LIVE_METADATA_FEED</h2>
               <p className="text-zinc-500 text-[10px] uppercase tracking-widest mt-1">STREAMING {items.length} OF {TOTAL_SUPPLY} MOLTZ</p>
            </div>
          </div>
          
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-4">
            {items.map((item) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 group transition-all hover:border-red-600">
                <div className="aspect-square relative overflow-hidden bg-black border-b border-zinc-900">
                   <img 
                    src={`${IMAGE_GATEWAY}/${item.id}.png`} 
                    alt={item.name} 
                    className="w-full h-full object-cover grayscale group-hover:grayscale-0 transition-all duration-500"
                    loading="lazy"
                   />
                </div>
                <div className="p-3">
                  <p className="text-[10px] text-red-600 font-bold mb-2 uppercase truncate">{item.name}</p>
                  <div className="space-y-1">
                    {item.attributes?.map((attr: any, idx: number) => (
                      <p key={idx} className="text-[8px] text-zinc-500 uppercase tracking-tighter">
                        {attr.trait_type}: <span className="text-zinc-300">{attr.value}</span>
                      </p>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>

          {/* SYNC BUTTON */}
          {items.length < TOTAL_SUPPLY && (
            <div className="mt-16 text-center">
               <button 
                  onClick={handleLoadMore}
                  disabled={isLoading}
                  className="px-12 py-3 bg-black border-2 border-red-600 text-red-600 text-[10px] font-black hover:bg-red-600 hover:text-black transition-all uppercase tracking-[0.4em] disabled:opacity-50"
               >
                  {isLoading ? "ESTABLISHING_LINK..." : "SYNC_MORE_MOLTZ"}
               </button>
            </div>
          )}
      </div>
    </main>
  );
}