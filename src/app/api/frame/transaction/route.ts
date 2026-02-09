import { NextRequest, NextResponse } from "next/server";
import { ethers } from "ethers";

// Konfigurasi
const PRIVATE_KEY = process.env.PRIVATE_KEY || ""; // Private key server (di .env)
const CONTRACT_ADDRESS = "0xb7DaE7957Fd2740cd19872861155E34C453D40f2";
const MINT_PRICE_ETH = "0.0005";

// ABI (Kamus bahasa Smart Contract biar tau fungsi 'mint' itu apa)
const ABI = [
  "function mint(uint256 amount, bytes signature) external payable"
];

export async function POST(req: NextRequest) {
  try {
    // 1. Ambil data yang dikirim Farcaster
    const body = await req.json();
    const userAddress = body?.untrustedData?.address; // Alamat user yang klik tombol

    if (!userAddress) {
      return NextResponse.json({ error: "No address found" }, { status: 400 });
    }

    // 2. Server melakukan SIGNING (Tanda Tangan)
    // Ini sama persis kayak logic mint di website, tapi di sisi server
    const wallet = new ethers.Wallet(PRIVATE_KEY);
    const messageHash = ethers.solidityPackedKeccak256(["address"], [userAddress]);
    const signature = await wallet.signMessage(ethers.getBytes(messageHash));

    // 3. Siapkan Data Transaksi (Encode)
    // Kita bungkus fungsi 'mint(1, signature)' jadi kode heksadesimal
    const iface = new ethers.Interface(ABI);
    const calldata = iface.encodeFunctionData("mint", [1, signature]);

    // 4. Kirim Balik ke Farcaster (Format JSON Khusus Frame)
    return NextResponse.json({
      chainId: "eip155:8453", // ID Chain Base Mainnet
      method: "eth_sendTransaction", // Perintah: "Kirim Transaksi"
      params: {
        abi: ABI,
        to: CONTRACT_ADDRESS,
        data: calldata, // Data fungsi mint + signature
        value: ethers.parseEther(MINT_PRICE_ETH).toString(), // Harga: 0.0005 ETH
      },
    });

  } catch (error) {
    console.error("Frame Error:", error);
    return NextResponse.json({ error: "Server Error" }, { status: 500 });
  }
}