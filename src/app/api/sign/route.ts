import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const rawText = await req.text();
    const cleanText = rawText.replace(/[^\x20-\x7E]/g, "");
    const addressMatch = cleanText.match(/0x[a-fA-F0-9]{40}/);
    
    if (!addressMatch) {
      return NextResponse.json({ error: "INVALID_ADDRESS_FORMAT" }, { status: 400 });
    }
    
    const address = addressMatch[0];
    const privateKey = (process.env.SIGNER_PRIVATE_KEY || "").replace(/[^a-fA-F0-9]/g, "").trim();

    if (privateKey.length < 64) {
      return NextResponse.json({ error: "SIGNER_KEY_NOT_CONFIGURED" }, { status: 500 });
    }

    const wallet = new ethers.Wallet(privateKey);
    // Standard signature for 1 NFT mint
    const messageHash = ethers.solidityPackedKeccak256(["address", "uint256"], [address, 1]);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    console.log(`// AUTH_GRANTED: ${address}`);
    return NextResponse.json({ signature, status: "AUTHORIZED" });
  } catch (err: any) {
    return NextResponse.json({ error: "SERVER_ERROR", detail: err.message }, { status: 500 });
  }
}