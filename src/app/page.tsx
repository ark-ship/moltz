"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';

// --- CONFIGURATION ---
const CONTRACT_ADDRESS = "0xb7DaE7957Fd2740cd19872861155E34C453D40f2"; 
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
  const [utcTime, setUtcTime] = useState("");

  // --- STATE TERMINAL WEB ---
  const [terminalLogs, setTerminalLogs] = useState<string[]>(["// MOLTZ_OS V1.0.4 READY", "// TYPE 'moltz --mint' TO START"]);
  const [terminalStep, setTerminalStep] = useState<"COMMAND" | "KEY">("COMMAND");
  const [isMinting, setIsMinting] = useState(false);

  // 1. UTC CLOCK LOGIC
  useEffect(() => {
    const timer = setInterval(() => {
      const now = new Date();
      const h = String(now.getUTCHours()).padStart(2, '0');
      const m = String(now.getUTCMinutes()).padStart(2, '0');
      const s = String(now.getUTCSeconds()).padStart(2, '0');
      setUtcTime(`${h}:${m}:${s} UTC`);
    }, 1000);
    return () => clearInterval(timer);
  }, []);

  // 2. LIVE BLOCKCHAIN LOGS
  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);
    const handleTransfer = (from: string, to: string, tokenId: any) => {
      if (from === "0x0000000000000000000000000000000000000000") {
        const now = new Date();
        const timestamp = now.toISOString().substr(11, 8);
        const newMint = {
          wallet: `${to.slice(0, 6)}...${to.slice(-4)}`,
          id: tokenId.toString(),
          time: timestamp
        };
        setRecentMints((prev) => [newMint, ...prev].slice(0, 6));
      }
    };
    contract.on("Transfer", handleTransfer);
    return () => { contract.off("Transfer", handleTransfer); };
  }, []);

  // 3. WEB TERMINAL EXECUTION logic
  const executeWebMint = async (privateKey: string) => {
    if (!privateKey || isMinting) return;
    setIsMinting(true);
    setTerminalLogs(prev => [...prev, "// INITIALIZING_INJECTION..."]);

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
      setTerminalLogs(prev => [...prev, "// SENDING_TRANSACTION..."]);
      
      const tx = await contract.mint(1, data.signature, { value: ethers.parseEther("0.0005") });
      setTerminalLogs(prev => [...prev, `// TX_HASH: ${tx.hash.slice(0,15)}...`]);
      
      await tx.wait();
      setTerminalLogs(prev => [...prev, "// INJECTION_COMPLETE: ACCESS GRANTED"]);
    } catch (error: any) {
      setTerminalLogs(prev => [...prev, `// [ERROR]: ${error.message.slice(0, 40)}`]);
    }
    setIsMinting(false);
    setTerminalStep("COMMAND");
  };

  // 4. METADATA FEED
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
      } catch (e) { console.error(`Failed to sync MOLTZ #${i}`); }
    }
    setItems((prev) => [...prev, ...loadedData]);
    setIsLoading(false);
  }, [items.length]);

  useEffect(() => {
    loadMetadata(20);
    const heroTimer = setInterval(() => { setHeroIndex((prev) => (prev >= 20 ? 1 : prev + 1)); }, 5000);
    return () => clearInterval(heroTimer);
  }, []);

  return (
    <main className="min-h-screen bg-black text-white font-mono p-6 md:p-12 selection:bg-red-600 selection:text-white uppercase">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-start border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-red-600 italic leading-none">MOLTZ</h1>
          <p className="mt-2 text-zinc-500 text-[10px] tracking-[0.3em]">Agent Only PFP Protocol // Base</p>
        </div>
        <div className="text-right text-[10px] text-zinc-600 leading-tight font-bold">
          <p className="text-red-500 mb-1">[{utcTime || "SYNCING..."}]</p>
          <p>NETWORK // <span className="text-zinc-300">BASE_MAINNET</span></p>
          <p>SUPPLY // <span className="text-zinc-300">{TOTAL_SUPPLY}</span></p>
          <p>PRICE // <span className="text-red-500">{MINT_PRICE}</span></p>
        </div>
      </header>

      {/* HERO & DUAL TERMINAL SECTION */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-start border-b border-zinc-900 pb-20">
        <div className="space-y-10">
          <section>
            <div className="flex items-center gap-2 mb-4">
               <span className="w-2 h-2 bg-red-600 rounded-full animate-ping"></span>
               <h2 className="text-sm font-black text-red-500 tracking-widest italic">// ACCESS CONTROL</h2>
            </div>
            <p className="text-zinc-500 leading-relaxed text-sm md:text-base border-l-2 border-red-900 pl-4">
              Two methods of injection available. Choose your protocol.
            </p>
          </section>

          {/* OPTION 1: REMOTE TERMINAL (CURL) */}
          <section className="bg-zinc-950 p-6 border border-zinc-900 relative">
            <div className="absolute top-0 right-0 p-2 text-[8px] text-zinc-800 font-bold">MODE: REMOTE</div>
            <h3 className="text-[10px] text-zinc-500 mb-4 tracking-widest font-bold underline decoration-red-900 underline-offset-4">
              // 01_TERMINAL INJECTION COMMAND:
            </h3>
            <div className="bg-black p-4 border border-zinc-800 rounded-sm">
              <code className="text-red-500 text-xs md:text-sm break-all font-bold lowercase">
                curl -s https://moltz.xyz/mint.sh | bash
              </code>
            </div>
          </section>

          {/* OPTION 2: WEBSITE TERMINAL (LOCAL) */}
          <section className="bg-zinc-950 border border-zinc-900 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.05)]">
            <div className="bg-zinc-900 px-4 py-1 flex justify-between items-center text-[8px] font-bold text-zinc-500">
              <span>MODE: WEBSITE INJECTION</span>
              <span>V1.0.4</span>
            </div>
            <div className="p-4 h-32 overflow-y-auto text-[10px] space-y-1 bg-black/50 scrollbar-hide">
              {terminalLogs.map((log, i) => (
                <div key={i} className={log.includes("[ERROR]") ? "text-red-500" : "text-green-500 font-bold"}>
                  {log}
                </div>
              ))}
              {isMinting && <div className="text-white animate-pulse">// INITIALIZING_DATABASE_LINK...</div>}
            </div>
            <div className="p-3 border-t border-zinc-900 bg-black flex items-center">
              <span className="text-red-600 mr-2 font-bold text-xs">{">"}</span>
              <input 
                type={terminalStep === "KEY" ? "password" : "text"}
                placeholder={terminalStep === "COMMAND" ? "TYPE 'moltz --mint' TO START" : "ENTER PRIVATE KEY"}
                className="bg-transparent border-none outline-none text-red-500 text-xs w-full placeholder:text-zinc-800 font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (terminalStep === "COMMAND") {
                      if (val.toLowerCase() === "moltz --mint") {
                        setTerminalLogs(prev => [...prev, `> ${val}`, "// ACCESSING_MINT_MODULE...", "// ENTER_PRIVATE_KEY:"]);
                        setTerminalStep("KEY");
                      } else {
                        setTerminalLogs(prev => [...prev, `> ${val}`, `// ERROR: UNKNOWN_PROTOCOL`]);
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

          {/* RECENT INJECTIONS LOG */}
          <section className="pt-2">
            <h3 className="text-[10px] text-zinc-500 tracking-[0.3em] font-bold mb-4">// RECENT INJECTIONS</h3>
            <div className="space-y-2 min-h-[120px]">
              {recentMints.length > 0 ? (
                recentMints.map((mint, i) => (
                  <div key={i} className="flex justify-between items-center border-b border-zinc-900/30 pb-2">
                    <p className="text-[10px] text-zinc-400">
                      <span className="text-red-600 font-bold">[{mint.time}]</span> AGENT_{mint.wallet} 
                      <span className="text-zinc-700 mx-2">{" >> "}</span> MOLTZ #{mint.id.padStart(4, '0')}
                    </p>
                    <span className="text-[8px] text-zinc-600 font-black italic">SUCCESS</span>
                  </div>
                ))
              ) : (
                <div className="text-[10px] text-zinc-800 italic animate-pulse font-bold tracking-tighter">LISTENING_FOR_ONCHAIN_EVENTS...</div>
              )}
            </div>
          </section>
        </div>

        {/* HERO IMAGE */}
        <div className="relative aspect-square bg-zinc-950 border border-zinc-900 group">
          <img 
            src={`${IMAGE_GATEWAY}/${heroIndex}.png`} 
            alt={`MOLTZ #${heroIndex}`} 
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 group-hover:opacity-100 transition-all duration-700" 
          />
          <div className="absolute bottom-6 left-6 bg-black border border-red-600 px-4 py-2 shadow-[4px_4px_0px_#dc2626]">
            <p className="text-xs text-red-600 font-black italic tracking-[0.2em]">MOLTZ #{heroIndex.toString().padStart(4, '0')}</p>
          </div>
        </div>
      </div>

      {/* FEED GRID */}
      <div className="max-w-6xl mx-auto mt-24 mb-32">
          <div className="flex justify-between items-end mb-12 border-b border-zinc-900 pb-4">
            <h2 className="text-2xl font-black text-red-600 tracking-tighter italic underline decoration-red-900">// LIVE METADATA</h2>
            <p className="text-zinc-600 text-[10px] font-bold tracking-widest">INDEXED: {items.length} / {TOTAL_SUPPLY}</p>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
            {items.map((item) => (
              <div key={item.id} className="bg-zinc-950 border border-zinc-900 hover:border-red-600 transition-all duration-300 shadow-[4px_4px_0px_#18181b]">
                <div className="aspect-square bg-black overflow-hidden relative">
                   <img src={`${IMAGE_GATEWAY}/${item.id}.png`} alt={item.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" loading="lazy" />
                </div>
                <div className="p-4 border-t border-zinc-900 text-[10px]">
                  <p className="text-red-600 font-black mb-3 truncate tracking-tighter">MOLTZ #{item.id.toString().padStart(4, '0')}</p>
                  <div className="space-y-1 opacity-50">
                    {item.attributes?.slice(0, 2).map((attr: any, idx: number) => (
                      <div key={idx} className="flex justify-between text-[7px] uppercase tracking-tighter">
                        <span>{attr.trait_type}</span>
                        <span className="font-bold">{attr.value}</span>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            ))}
          </div>
          {items.length < TOTAL_SUPPLY && (
            <div className="mt-20 text-center">
               <button onClick={() => loadMetadata(20)} disabled={isLoading} className="px-16 py-4 border-2 border-red-900 text-red-600 text-xs font-black hover:bg-red-600 hover:text-black transition-all shadow-[8px_8px_0px_#18181b] active:translate-y-1 active:shadow-none">
                  {isLoading ? "UPLINKING..." : "SYNC_NEXT_BATCH"}
               </button>
            </div>
          )}
      </div>

      <footer className="max-w-6xl mx-auto text-center border-t border-zinc-900 pt-12 pb-20">
        <p className="text-[9px] text-zinc-700 tracking-[0.5em]">© 2026 MOLTZ LABS // ALL RIGHTS RESERVED</p>
      </footer>
    </main>
  );
}