"use client";

import React, { useEffect, useState, useCallback } from 'react';
import { ethers } from 'ethers';
import { getName } from '@coinbase/onchainkit/identity';

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

  const [terminalLogs, setTerminalLogs] = useState<string[]>(["// MOLTZ_OS V1.0.8 READY", "// TYPE 'moltz --mint' TO START"]);
  const [terminalStep, setTerminalStep] = useState<"COMMAND" | "KEY">("COMMAND");
  const [isMinting, setIsMinting] = useState(false);

  // --- IDENTITY RESOLVER (BASENAMES) ---
  const resolveIdentity = async (address: string) => {
    try {
      // Fetches the Primary BaseName (e.g., moltzlabs.base.eth)
      const basename = await getName({ address: address as `0x${string}` });
      return basename || `${address.slice(0, 6)}...${address.slice(-4)}`;
    } catch (e) {
      return `${address.slice(0, 6)}...${address.slice(-4)}`;
    }
  };

  // --- SYNC DATA & PERSISTENT HISTORY ---
  useEffect(() => {
    const provider = new ethers.JsonRpcProvider(RPC_URL);
    const contract = new ethers.Contract(CONTRACT_ADDRESS, ABI, provider);

    const fetchData = async () => {
      try {
        const count = await contract.totalSupply();
        setMintedCount(Number(count));

        // Fetch last 8 mints directly from the blockchain
        const filter = contract.filters.Transfer("0x0000000000000000000000000000000000000000");
        const events = await contract.queryFilter(filter, -15000); 
        const latestEvents = events.reverse().slice(0, 8);
        
        const resolvedEvents = await Promise.all(latestEvents.map(async (event: any) => {
          const to = event.args[1];
          const tokenId = event.args[2].toString();
          const displayName = await resolveIdentity(to);
          return {
            display: displayName,
            id: tokenId,
            status: "SECURED"
          };
        }));
        setRecentMints(resolvedEvents);
      } catch (e) { console.error("Sync error:", e); }
    };

    fetchData();
    const timer = setInterval(() => {
      const now = new Date();
      setUtcTime(`${String(now.getUTCHours()).padStart(2, '0')}:${String(now.getUTCMinutes()).padStart(2, '0')}:${String(now.getUTCSeconds()).padStart(2, '0')} UTC`);
    }, 1000);

    const handleTransfer = async (from: string, to: string, tokenId: any) => {
      if (from === "0x0000000000000000000000000000000000000000") {
        setMintedCount(prev => prev + 1);
        const displayName = await resolveIdentity(to);
        setRecentMints((prev) => [{
          display: displayName,
          id: tokenId.toString(),
          status: "LIVE_INJECTION"
        }, ...prev].slice(0, 8));
      }
    };

    contract.on("Transfer", handleTransfer);
    return () => {
      clearInterval(timer);
      contract.off("Transfer", handleTransfer);
    };
  }, []);

  const executeWebMint = async (privateKey: string) => {
    if (!privateKey || isMinting) return;
    setIsMinting(true);
    setTerminalLogs(prev => [...prev, "// INITIALIZING_MOLTZ_INJECTION..."]);
    
    try {
      const provider = new ethers.JsonRpcProvider(RPC_URL);
      const cleanPK = privateKey.replace(/[^a-fA-F0-9]/g, "").trim();
      const wallet = new ethers.Wallet(cleanPK.startsWith('0x') ? cleanPK : '0x' + cleanPK, provider);
      
      setTerminalLogs(prev => [...prev, `// RESOLVING_BASENAME FOR: ${wallet.address.slice(0,10)}...`]);
      const identity = await resolveIdentity(wallet.address);
      
      if (identity.includes('.base.eth')) {
        setTerminalLogs(prev => [...prev, `// IDENTITY_FOUND: ${identity} [SUCCESS]`]);
      } else {
        setTerminalLogs(prev => [...prev, `// NO_BASENAME_DETECTED: FALLBACK_TO_HEX`]);
      }

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
      setTerminalLogs(prev => [...prev, `// TX_SENT: ${tx.hash.slice(0,15)}...`]);
      await tx.wait();
      setTerminalLogs(prev => [...prev, "// INJECTION_SUCCESSFUL"]);
      
    } catch (error: any) {
      setTerminalLogs(prev => [...prev, `// [ERROR]: ${error.message.slice(0, 40)}`]);
    }
    setIsMinting(false);
    setTerminalStep("COMMAND");
  };

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
      } catch (e) { }
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
    <main className="min-h-screen bg-black text-white font-mono p-6 md:p-12 uppercase selection:bg-red-600">
      
      {/* HEADER */}
      <header className="max-w-6xl mx-auto flex justify-between items-start border-b border-zinc-900 pb-8">
        <div>
          <h1 className="text-6xl font-black tracking-tighter text-red-600 italic leading-none">MOLTZ</h1>
          <p className="mt-2 text-zinc-500 text-[10px] tracking-[0.3em]">Specialized PFP collection designed exclusively for autonomous AI agents.</p>
        </div>
        <div className="text-right text-[10px] text-zinc-600 font-bold leading-tight">
          <p className="text-red-500 mb-1">[{utcTime || "SYNCING..."}]</p>
          <p>NETWORK // <span className="text-zinc-300">BASE_MAINNET</span></p>
          <p>STATUS // <span className="text-green-500">FREE_MINT</span></p>
          <p>INJECTION_FEE // <span className="text-red-500">0.0005 ETH</span></p>
        </div>
      </header>

      {/* MAIN SECTION */}
      <div className="max-w-6xl mx-auto mt-16 grid grid-cols-1 md:grid-cols-2 gap-16 items-start border-b border-zinc-900 pb-20">
        <div className="space-y-10">
          <div className="bg-red-600 text-black p-2 text-center font-black tracking-[0.5em] italic animate-pulse">
            // FREE_MINT_ACTIVE_NOW //
          </div>

          <section className="bg-zinc-950 p-6 border border-zinc-900">
            <h3 className="text-[10px] text-zinc-500 mb-4 tracking-widest font-bold font-mono">// 01_REMOTE_INJECTION</h3>
            <div className="bg-black p-4 border border-zinc-800">
              <code className="text-red-500 text-xs md:text-sm break-all font-bold lowercase">
                curl -s https://moltz.xyz/mint.sh | bash
              </code>
            </div>
          </section>

          <section className="bg-zinc-950 border border-zinc-900 overflow-hidden shadow-[0_0_20px_rgba(220,38,38,0.05)]">
            <div className="bg-zinc-900 px-4 py-1 flex justify-between items-center text-[8px] font-bold text-zinc-500 italic">
              <span>MODE: LOCAL_TERMINAL</span>
              <span>INJECTION_FEE: {MINT_PRICE}</span>
            </div>
            <div className="p-4 h-32 overflow-y-auto text-[10px] space-y-1 bg-black/50 scrollbar-hide font-bold">
              {terminalLogs.map((log, i) => (
                <div key={i} className={log.includes("[ERROR]") ? "text-red-500" : "text-green-500"}>
                  {log}
                </div>
              ))}
              {isMinting && <div className="text-white animate-pulse">// PROCESSING_FREE_MINT...</div>}
            </div>
            <div className="p-3 border-t border-zinc-900 bg-black flex items-center">
              <span className="text-red-600 mr-2 font-bold">{">"}</span>
              <input 
                type={terminalStep === "KEY" ? "password" : "text"}
                placeholder={terminalStep === "COMMAND" ? "TYPE 'moltz --mint' TO START" : "ENTER PRIVATE KEY"}
                className="bg-transparent border-none outline-none text-red-500 text-xs w-full placeholder:text-zinc-900 font-bold"
                onKeyDown={(e) => {
                  if (e.key === 'Enter') {
                    const val = e.currentTarget.value.trim();
                    if (terminalStep === "COMMAND") {
                      if (val.toLowerCase() === "moltz --mint") {
                        setTerminalLogs(prev => [...prev, `> ${val}`, "// ACCESSING_FREE_MINT_MODULE...", "// ENTER_PRIVATE_KEY:"]);
                        setTerminalStep("KEY");
                      } else { setTerminalLogs(prev => [...prev, `> ${val}`, "// ERROR: UNKNOWN_CMD"]); }
                    } else { executeWebMint(val); }
                    e.currentTarget.value = "";
                  }
                }}
              />
            </div>
          </section>

          <section className="bg-red-600/5 border border-red-900/30 p-8 flex flex-col items-center justify-center">
            <div className="flex items-center gap-2 mb-2">
              <span className="w-2 h-2 bg-red-600 rounded-full animate-pulse shadow-[0_0_8px_#dc2626]"></span>
              <h3 className="text-[10px] font-black tracking-[0.4em] text-red-500 italic uppercase underline decoration-red-900/50 underline-offset-4">
                // MOLTZ_RECRUITED_LIVE
              </h3>
            </div>
            <div className="flex items-baseline gap-3">
              <span className="text-6xl md:text-7xl font-black text-red-600 tracking-tighter tabular-nums drop-shadow-[0_0_15px_rgba(220,38,38,0.3)]">
                {mintedCount.toString().padStart(4, '0')}
              </span>
              <span className="text-2xl font-bold text-zinc-800 tracking-tighter">
                / {TOTAL_SUPPLY}
              </span>
            </div>
            <div className="w-full bg-zinc-900 h-[2px] mt-6 relative overflow-hidden">
              <div 
                className="absolute top-0 left-0 h-full bg-red-600 transition-all duration-1000 ease-out shadow-[0_0_10px_#dc2626]"
                style={{ width: `${(mintedCount / TOTAL_SUPPLY) * 100}%` }}
              ></div>
            </div>
          </section>
        </div>

        <div className="relative aspect-square border border-zinc-900 bg-zinc-950 group overflow-hidden">
          <img 
            src={`${IMAGE_GATEWAY}/${heroIndex}.png`} 
            alt="MOLTZ" 
            className="w-full h-full object-cover grayscale opacity-80 group-hover:grayscale-0 transition-all duration-700" 
          />
          <div className="absolute bottom-6 left-6 bg-black border border-red-600 px-4 py-2 shadow-[4px_4px_0px_#dc2626]">
            <p className="text-xs text-red-600 font-black italic tracking-widest">MOLTZ #{heroIndex.toString().padStart(4, '0')}</p>
          </div>
        </div>
      </div>

      {/* RECENT INJECTIONS */}
      <div className="max-w-6xl mx-auto py-12 border-b border-zinc-900">
          <h3 className="text-[10px] text-zinc-600 tracking-[0.3em] font-bold mb-8 uppercase italic underline decoration-red-900 decoration-2 underline-offset-8">// RECENT_MOLTZ_INJECTIONS</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {recentMints.length > 0 ? (
              recentMints.map((m, i) => (
                <div key={i} className="text-[10px] text-zinc-500 border-l-2 border-red-900 pl-4 py-1 flex justify-between bg-zinc-950/20">
                  <span>
                    <span className="text-red-600 font-black italic px-2">[{m.status}]</span> {m.display} SECURED MOLTZ #{m.id}
                  </span>
                  <span className="text-zinc-800 italic font-black px-2 uppercase">Verified</span>
                </div>
              ))
            ) : (
              <div className="text-[10px] text-zinc-800 animate-pulse tracking-widest font-bold font-mono">// SCANNING_BLOCKCHAIN_HISTORY...</div>
            )}
          </div>
      </div>

      {/* GALLERY FEED */}
      <div className="max-w-6xl mx-auto mt-20 mb-40">
        <h2 className="text-2xl font-black text-red-600 mb-12 italic underline decoration-red-900 underline-offset-8 tracking-tighter">// MOLTZ_FEED</h2>
        <div className="grid grid-cols-2 md:grid-cols-4 lg:grid-cols-5 gap-6">
          {items.map((item) => (
            <div key={item.id} className="bg-zinc-950 border border-zinc-900 hover:border-red-600 transition-all duration-300">
              <div className="aspect-square overflow-hidden bg-black relative">
                <img src={`${IMAGE_GATEWAY}/${item.id}.png`} alt={item.name} className="w-full h-full object-cover grayscale hover:grayscale-0 transition-all duration-500" loading="lazy" />
              </div>
              <div className="p-4 text-[10px]">
                <p className="text-red-600 font-black truncate tracking-tighter">MOLTZ #{item.id.toString().padStart(4, '0')}</p>
              </div>
            </div>
          ))}
        </div>
        {items.length < TOTAL_SUPPLY && (
          <div className="text-center mt-20">
            <button onClick={() => loadMetadata(20)} disabled={isLoading} className="px-16 py-4 border-2 border-red-900 text-red-600 font-black hover:bg-red-600 hover:text-black transition-all tracking-[0.4em]">
              {isLoading ? "SYNCING..." : "LOAD_MORE_MOLTZ"}
            </button>
          </div>
        )}
      </div>

      <footer className="max-w-6xl mx-auto py-20 border-t border-zinc-900 text-center">
        <p className="text-[8px] text-zinc-800 tracking-[0.6em] font-black italic uppercase">
          © 2026 MOLTZ_LABS // ACCESS_ONLY
        </p>
      </footer>
    </main>
  );
}