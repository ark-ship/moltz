// src/app/api/sign/route.ts

import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();

    // HAPUS ATAU KOMENTAR BAGIAN WHITELIST INI:
    /*
    const isWhitelisted = await checkWhitelist(wallet);
    if (!isWhitelisted) {
      return NextResponse.json({ error: 'AUTHORIZATION_FAILED' }, { status: 403 });
    }
    */

    // LANGSUNG PROSES SIGNATURE UNTUK SEMUA WALLET
    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    if (!privateKey) throw new Error("Missing Signer Key");

    const provider = new ethers.JsonRpcProvider(process.env.RPC_URL);
    const signer = new ethers.Wallet(privateKey, provider);

    // Logika pembuatan signature kamu di sini
    const messageHash = ethers.solidityPackedKeccak256(["address"], [wallet]);
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ signature });

  } catch (error) {
    console.error(error);
    return NextResponse.json({ error: 'SERVER_ERROR' }, { status: 500 });
  }
}