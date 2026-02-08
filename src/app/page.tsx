"use client";

import { useState, useEffect } from "react";

// Definisikan tipe sederhana untuk metadata Moltz
interface MoltzMetadata {
  name: string;
  image: string;
  description?: string;
  attributes?: any[];
}

export default function MoltzHome() {
  const [specimens, setSpecimens] = useState<MoltzMetadata[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  
  const TOTAL_SUPPLY = 3333; // Sesuai kontrak Moltz kamu

  const loadMetadata = async (limit: number) => {
    setIsLoading(true);
    
    // PERBAIKAN: Menambahkan tipe data agar Vercel tidak error
    const loadedData: MoltzMetadata[] = [];

    // Logika untuk meload data (Sesuaikan dengan path IPFS atau folder public kamu)
    const start = specimens.length + 1;
    const end = Math.min(start + limit - 1, TOTAL_SUPPLY);

    try {
      for (let i = start; i <= end; i++) {
        // Jika kamu menggunakan file lokal sementara di public/metadata
        const response = await fetch(`/metadata/${i}.json`);
        if (response.ok) {
          const json = await response.json();
          loadedData.push(json);
        }
      }
      setSpecimens((prev) => [...prev, ...loadedData]);
    } catch (error) {
      console.error("Error loading Moltz metadata:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    loadMetadata(20); // Load 20 item pertama saat pertama kali buka
  }, []);

  return (
    <main className="min-h-screen p-8 bg-black text-white">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-4xl font-bold mb-4 text-center">MOLTZ COLLECTION</h1>
        <p className="text-center mb-8">Contract: 0xb7DaE7957Fd2740cd19872861155E34C453D40f2</p>
        
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {specimens.map((nft, index) => (
            <div key={index} className="border border-zinc-800 rounded-lg overflow-hidden bg-zinc-900">
              <img 
                src={nft.image.replace("ipfs://", "https://ipfs.io/ipfs/")} 
                alt={nft.name} 
                className="w-full h-auto aspect-square object-cover"
              />
              <div className="p-3">
                <p className="font-semibold text-sm">{nft.name}</p>
              </div>
            </div>
          ))}
        </div>

        {isLoading && <p className="text-center mt-8">Loading more Moltz...</p>}
        
        {!isLoading && specimens.length < TOTAL_SUPPLY && (
          <div className="flex justify-center mt-12">
            <button 
              onClick={() => loadMetadata(20)}
              className="bg-white text-black px-6 py-2 rounded-full font-bold hover:bg-zinc-200 transition"
            >
              Load More
            </button>
          </div>
        )}
      </div>
    </main>
  );
}