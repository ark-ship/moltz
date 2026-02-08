"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { OnchainKitProvider } from '@coinbase/onchainkit';
import { Identity, Name } from '@coinbase/onchainkit/identity';
import { base } from 'viem/chains';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xb7DaE7957Fd2740cd19872861155E34C453D40f2"; 
const RPC_URL = "https://mainnet.base.org"; 
const TOTAL_SUPPLY = 3333;
const MINT_PRICE = "0.0005 ETH"; 

const METADATA_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeihqdpz4bxa4ssj33hhfmyihxyro72faacxskup37mujq2dszfe5by";
const IMAGE_GATEWAY = "https://gateway.lighthouse.storage/ipfs/bafybeid7efvwiptloh2zwncx5agrvfkhjq65uhgcdcffrelb2gm2grgvdm";

const ABI = [
  "event Transfer(address indexed from, address indexed to, uint256 indexed tokenId)",
  "function totalSupply() view returns (uint256)"
];

export default function Home() {
  const [items, setItems] = useState<any[]>([]); 
  const [recentMints, setRecentMints] = useState<any[]>([]);
  const [mintedCount, setMintedCount] = useState<number>(0);
  const [heroIndex, setHeroIndex] = useState(1);
  const [isLoading, setIsLoading] = useState(false);
  const [utcTime, setUtcTime] = useState("");
  
  // Terminal States
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["// MOLTZ_OS V1.8.7 READY", "// MONITORING_BASE_CHAIN..."]);
  const [terminalStep, setTerminalStep] = useState<"COMMAND" | "KEY">("COMMAND");
  const [isMinting, setIsMinting] = useState(false);

  // --- SYNC DATA ---
  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const fetchData = async () => {
      try {
        const count = await contract.totalSupply();
        setMintedCount(Number(count));

        const filter = contract.filters.Transfer("0x0000000000000000000000000000000000000000");
        const events = await contract.queryFilter(filter, -9000); 
        const latestEvents = events.reverse().slice(0, 10);
        
        setRecentMints(latestEvents.map((event: any) => ({
          address: event.args[1],
          id: event.args[2].toString(),
        })));
      } catch (e) { console.error("Sync Error:", e); }
    };

    fetchData();
    const timer = setInterval(fetchData, 10000);
    const clockTimer = setInterval(() => {
      const now = new Date();
      setUtcTime(`${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`);
    }, 1000);

    return () => { clearInterval(timer); clearInterval(clockTimer); };
  }, []);

  // --- MINTING LOGIC ---
  const executeWebMint = async (privateKey: string) => {
    if (!privateKey || isMinting) return;
    setIsMinting(true);
    setTerminalLogs(prev => [...prev, "// INITIALIZING_MOLTZ_INJECTION..."]);
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const cleanPK = privateKey.replace(/[^a-fA-F0-9]/g, "").trim();
      const wallet = new ethers.Wallet(cleanPK.startsWith('0x') ? cleanPK : '0x' + cleanPK, provider);
      
      const response = await fetch('/api/sign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ wallet: wallet.address })
      });
      const data = await response.json();
      if (!data.signature) throw new Error("AUTH_FAILED");

      const contract = new ethers.Contract(CONTRACT_ADDRESS, ["function mint(uint256 amount, bytes signature) external payable"], wallet);
      const tx = await contract.mint(1, data.signature, { value: ethers.parseEther("0.0005") });
      await tx.wait();
      setTerminalLogs(prev => [...prev, "// INJECTION_SUCCESSFUL"]);
    } catch (error: any) {
      setTerminalLogs(prev => [...prev, `// [ERROR]: MINT_FAILED`]);
    }
    setIsMinting(false);
    setTerminalStep("COMMAND");
  };

  const loadMetadata = useCallback(async (limit: number) => {
    setIsLoading(true);
    const start = items.length + 1;
    const end = Math.min(start + limit - 1, TOTAL_SUPPLY);
    const newItems: any[] = []; 
    for (let i = start; i <= end; i++) { 
      try {
        const res = await fetch(`${METADATA_GATEWAY}/${i}`);
        const data = await res.json();
        newItems.push({ id: i, attributes: data.attributes || [] });
      } catch {
        newItems.push({ id: i, attributes: [] });
      }
    }
    setItems((prev) => [...prev, ...newItems]);
    setIsLoading(false);
  }, [items.length]);

  useEffect(() => {
    loadMetadata(20);
    const heroTimer = setInterval(() => { setHeroIndex((prev) => (prev >= 20 ? 1 : prev + 1)); }, 5000);
    return () => clearInterval(heroTimer);
  }, []);

  return (
    <OnchainKitProvider chain={base}>
      <main className="min-h-screen bg-black text-white font-mono p-6 md:p-12 uppercase selection:bg-red-600">
        
        {/* HEADER */}
        <header className="max-w-6xl mx-auto flex justify-between items-start border-b border-zinc-900 pb-8">
          <div>
            <h1 className="text-6xl font-black tracking-tighter text-red-600 italic leading-none">MOLTZ</h1>
            <p className="mt-2 text-zinc-500 text-[10px] tracking-[0.3em]">Specialized PFP collection designed exclusively for autonomous AI agents.</p>
          </div>
          <div className="text-right text-[10px] text-zinc-600 font-bold leading-tight uppercase">
            <p className="text-red-500 mb-1">[{utcTime || "SYNCING..."}]</p>
            <p>NETWORK // <span className="text-zinc-300">BASE_MAINNET</span></p>
            <p>STATUS // <span className="text-green-500">FREE_MINT</span></p>
            <p>FEE_INJECTION // <span className="text-red-500">{MINT_PRICE}</span></p>
          </div>
        </header>

        <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-start border-b border-zinc-900 pb-20">
          <div className="space-y-10">
            <div className="bg-red-600 text-black p-2 text-center font-black tracking-[0.5em] italic animate-pulse font-mono uppercase">// FREE_MINT_ACTIVE_NOW //</div>

            {/* CURL SECTION */}
            <section className="bg-zinc-950 p-6 border border-zinc-900">
              <h3 className="text-[10px] text-zinc-500 mb-4 tracking-widest font-bold font-mono uppercase">// 01_REMOTE_INJECTION</h3>
              <div className="bg-black p-4 border border-zinc-800">
                <code className="text-red-500 text-xs md:text-sm break-all font-bold lowercase">curl -s https://moltz.xyz/mint.sh | bash</code>
              </div>
            </section>

            {/* TERMINAL SECTION - FIXED INPUT LOGIC */}
            <section className="bg-zinc-950 border border-zinc-900 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.05)]">
              <div className="bg-zinc-900 px-4 py-1 flex justify-between items-center text-[8px] font-bold text-zinc-500 italic uppercase">
                <span>MODE: LOCAL_TERMINAL</span>
                <span>FEE: {MINT_PRICE}</span>
              </div>
              <div className="p-4 h-32 overflow-y-auto text-[10px] space-y-1 bg-black/50 scrollbar-hide font-bold text-green-500">
                {terminalLogs.map((log, i) => <div key={i}>{log}</div>)}
                {isMinting && <div className="text-white animate-pulse">// PROCESSING_INJECTION...</div>}
              </div>
              <div className="p-3 border-t border-zinc-900 bg-black flex items-center">
                <span className="text-red-600 mr-2 font-bold">{">"}</span>
                <input 
                  type={terminalStep === "KEY" ? "password" : "text"}
                  placeholder={terminalStep === "COMMAND" ? "TYPE 'moltz --mint' TO START" : "ENTER PRIVATE KEY"}
                  className="bg-transparent border-none outline-none text-red-500 text-xs w-full placeholder:text-zinc-900 font-bold uppercase"
                  onKeyDown={(e) => {
                    if (e.key === 'Enter') {
                      const val = e.currentTarget.value.trim();
                      if (terminalStep === "COMMAND") {
                        if (val.toLowerCase() === "moltz --mint") {
                          setTerminalLogs(prev => [...prev, `> ${val}`, "// ACCESSING_MINT_MODULE...", "// ENTER_PRIVATE_KEY:"]);
                          setTerminalStep("KEY");
                        } else {
                          setTerminalLogs(prev => [...prev, `> ${val}`, "// ERROR: UNKNOWN_CMD"]);
                        }
                      } else {
                        executeWebMint(val);
                      }
                      e.currentTarget.value = "";
                    }
                  }}
                />
              </div>
            </section>

            <section className="bg-red-600/5 border border-red-900/30 p-8 flex flex-col items-center justify-center">
              <div className="flex items-center gap-2 mb-2 text-red-500 italic font-black text-[10px] tracking-[0.4em] uppercase">// MOLTZ_RECRUITED_LIVE</div>
              <div className="flex items-baseline gap-3">
                <span className="text-6xl md:text-7xl font-black text-red-600 tracking-tighter tabular-nums">{mintedCount.toString().padStart(4, '0')}</span>
                <span className="text-2xl font-bold text-zinc-800 tracking-tighter">/ {TOTAL_SUPPLY}</span>
              </div>
            </section>
          </div>

          <div className="relative aspect-square border border-zinc-900 bg-zinc-950 overflow-hidden group">
            <img src={`${IMAGE_GATEWAY}/${heroIndex}.png`} className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" crossOrigin="anonymous" />
            <div className="absolute bottom-6 left-6 bg-black border border-red-600 px-4 py-2 shadow-[4px_4px_0px_#dc2626]">
              <p className="text-xs text-red-600 font-black italic tracking-widest">MOLTZ #{heroIndex.toString().padStart(4, '0')}</p>
            </div>
          </div>
        </div>

        {/* RECENT INJECTIONS - 10 ITEMS */}
        <div className="max-w-6xl mx-auto py-12 border-b border-zinc-900">
            <h3 className="text-[10px] text-zinc-600 tracking-[0.3em] font-bold mb-8 uppercase italic underline decoration-red-900 decoration-2 underline-offset-8">// RECENT_MOLTZ_INJECTIONS</h3>
            <div className="grid grid-cols-1 gap-2"> 
              {recentMints.map((m, i) => (
                <div key={i} className="text-[10px] text-zinc-500 border-l-2 border-red-900 pl-4 py-3 flex justify-between bg-zinc-950/20 items-center">
                  <span className="flex items-center gap-2">
                    <span className="text-red-600 font-black italic uppercase">[SECURED]</span> 
                    <Identity address={m.address as `0x${string}`} schemaId="0xf8b05c79f0900139">
                      <Name className="text-zinc-300 font-bold uppercase" />
                      <span className="text-zinc-600 font-bold opacity-50 font-mono">{`${m.address.slice(0, 6)}...${m.address.slice(-4)}`}</span>
                    </Identity>
                    <span className="text-zinc-700">|</span>
                    <span className="text-zinc-400 font-bold">MOLTZ #{m.id}</span>
                  </span>
                  <span className="text-zinc-800 italic font-black px-2 uppercase border border-zinc-900">Verified</span>
                </div>
              ))}
            </div>
        </div>

        {/* FEED GALLERY - TRAITS: TYPE: VALUE */}
        <div className="max-w-6xl mx-auto mt-20 mb-40">
          <h2 className="text-2xl font-black text-red-600 mb-12 italic underline decoration-red-900 underline-offset-8 tracking-tighter">// MOLTZ_FEED</h2>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {recentMints.length > 0 && items.map((item) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 hover:border-red-600 transition-all duration-300">
                <div className="aspect-square overflow-hidden bg-black relative">
                  <img src={`${IMAGE_GATEWAY}/${item.id}.png`} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" loading="lazy" crossOrigin="anonymous" />
                </div>
                <div className="p-4 space-y-3">
                  <div className="text-[10px] text-red-600 font-black truncate tracking-tighter uppercase italic">MOLTZ #{item.id.toString().padStart(4, '0')}</div>
                  <div className="flex flex-col gap-1 border-t border-zinc-900 pt-2">
                    {item.attributes?.map((attr: any, idx: number) => (
                      <div key={idx} className="text-[7px] font-bold uppercase flex justify-between leading-none">
                        <span className="text-zinc-600">{attr.trait_type}:</span>
                        <span className="text-zinc-400">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {items.length < TOTAL_SUPPLY && (
            <div className="text-center mt-20">
              <button onClick={() => loadMetadata(20)} disabled={isLoading} className="px-16 py-4 border-2 border-red-900 text-red-600 font-black hover:bg-red-600 hover:text-black transition-all tracking-[0.4em] uppercase italic">{isLoading ? "SYNCING..." : "LOAD_MORE_MOLTZ"}</button>
            </div>
          )}
        </div>
      </main>
    </OnchainKitProvider>
  );
}