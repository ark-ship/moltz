import { NextResponse } from 'next/server';
import { ethers } from 'ethers';

export async function POST(req: Request) {
  try {
    const { wallet } = await req.json();

    const privateKey = process.env.SIGNER_PRIVATE_KEY;
    const rpcUrl = process.env.RPC_URL || "https://mainnet.base.org";

    if (!privateKey) {
      return NextResponse.json({ error: 'SERVER_CONFIG_ERROR' }, { status: 500 });
    }

    const provider = new ethers.JsonRpcProvider(rpcUrl);
    const signer = new ethers.Wallet(privateKey, provider);

    // Membuat signature agar kontrak percaya ini dari server resmi
    const messageHash = ethers.solidityPackedKeccak256(["address"], [wallet]);
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ signature });

  } catch (error) {
    return NextResponse.json({ error: 'AUTHORIZATION_FAILED' }, { status: 403 });
  }
}