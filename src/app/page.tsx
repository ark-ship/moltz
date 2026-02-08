"use client";

import { useState, useEffect } from "react";

// 1. Definisikan tipe data untuk NFT Moltz agar TypeScript tidak error
interface MoltzNFT {
  name: string;
  image: string;
  description?: string;
}

export default function MoltzHome() {
  const [specimens, setSpecimens] = useState<MoltzNFT[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const TOTAL_SUPPLY = 3333; // Sesuai MAX_SUPPLY di kontrak kamu

  const loadMetadata = async (limit: number) => {
    setIsLoading(true);
    
    // 2. PERBAIKAN: Memberikan tipe data explicit (MoltzNFT[]) pada array kosong
    const loadedData: MoltzNFT[] = [];

    const start = specimens.length + 1;
    const end = Math.min(specimens.length + limit, TOTAL_SUPPLY);

    try {
      for (let i = start; i <= end; i++) {
        // Mengambil metadata dari folder public/metadata yang kamu upload
        const response = await fetch(`/metadata/${i}.json`);
        if (response.ok) {
          const json = await response.json();
          loadedData.push(json);
        }
      }
      setSpecimens((prev) => [...prev, ...loadedData]);
    } catch (error) {
      console.error("Gagal memuat metadata Moltz:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata(12); // Load 12 item pertama saat awal
  }, []);

  return (
    <main className="min-h-screen bg-black text-white p-6">
      <div className="max-w-7xl mx-auto">
        <header className="text-center mb-12">
          <h1 className="text-6xl font-black italic mb-2">MOLTZ</h1>
          <p className="text-zinc-500 tracking-widest uppercase">Base Mainnet: 0xb7DaE7957Fd2740cd19872861155E34C453D40f2</p>
        </header>

        {/* Grid Display */}
        <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-6">
          {specimens.map((nft, index) => (
            <div key={index} className="bg-zinc-900 border border-zinc-800 rounded-xl overflow-hidden hover:border-zinc-600 transition">
              <img 
                src={nft.image.replace("ipfs://", "https://ipfs.io/ipfs/")} 
                alt={nft.name}
                className="w-full aspect-square object-cover"
              />
              <div className="p-4">
                <h3 className="font-bold text-lg">{nft.name}</h3>
              </div>
            </div>
          ))}
        </div>

        {/* Load More Button */}
        <div className="mt-16 flex justify-center">
          {specimens.length < TOTAL_SUPPLY && (
            <button 
              onClick={() => loadMetadata(12)}
              disabled={isLoading}
              className="px-8 py-3 bg-white text-black font-bold rounded-full hover:bg-zinc-200 disabled:opacity-50 transition"
            >
              {isLoading ? "LOADING..." : "LOAD MORE SPECIMENS"}
            </button>
          )}
        </div>
      </div>
    </main>
  );
}