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

    // --- PENYESUAIAN KONTRAK (PENTING!) ---
    // Kontrak kamu pakai: keccak256(abi.encodePacked(_user, _amount))
    // Kita anggap _amount adalah 1 (sesuai jumlah mint per transaksi)
    const amount = 1; 

    // Menciptakan hash yang identik dengan abi.encodePacked di Solidity
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256"], 
      [wallet, amount]
    );

    // Menandatangani hash tersebut
    const signature = await signer.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ signature });

  } catch (error) {
    console.error("Signature Error:", error);
    return NextResponse.json({ error: 'AUTHORIZATION_FAILED' }, { status: 403 });
  }
}