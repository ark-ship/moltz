import { NextResponse } from "next/server";
import { ethers } from "ethers";

export async function POST(req: Request) {
  try {
    const { address, amount } = await req.json();
    
    // Server-side Private Key (Store this in .env file!)
    const privateKey = process.env.SIGNER_PRIVATE_KEY || "";
    if (!privateKey) throw new Error("Signer key not configured");

    const wallet = new ethers.Wallet(privateKey);

    // Create the same hash as the Smart Contract
    const messageHash = ethers.solidityPackedKeccak256(
      ["address", "uint256"],
      [address, amount]
    );

    // Sign the message
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    return NextResponse.json({ signature });
  } catch (error) {
    console.error("Signing Error:", error);
    return NextResponse.json({ error: "Authorization Failed" }, { status: 500 });
  }
}