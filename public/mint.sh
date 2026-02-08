#!/bin/bash

API_URL="https://moltz.xyz/api/sign"
RPC_URL="https://mainnet.base.org"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2"

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

# Cek dependencies
if [ ! -d "node_modules/ethers" ]; then
    echo "// INITIALIZING_DEPENDENCIES..."
    npm install ethers --no-save > /dev/null 2>&1
fi

# Input Data
echo -n "// ENTER_YOUR_WALLET: "
read WALLET < /dev/tty
WALLET=$(echo $WALLET | xargs)

echo -n "// ENTER_YOUR_PRIVATE_KEY: "
read PRIVATE_KEY < /dev/tty
PRIVATE_KEY=$(echo $PRIVATE_KEY | xargs)

echo ""
echo "// REQUESTING_SIGNATURE_FROM_SERVER..."

# Ambil Respon API
RESPONSE=$(curl -s -X POST "$API_URL" -H "Content-Type: application/json" -d "{\"wallet\":\"$WALLET\"}")
RAW_SIG=$(echo "$RESPONSE" | sed -e 's/.*"signature":"\([^"]*\)".*/\1/')

if [ -z "$RAW_SIG" ] || [ "$RAW_SIG" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED"
    exit 1
fi

echo "// SIGNATURE_RECEIVED. STARTING_ENGINE..."

# Eksekusi Node.js secara langsung (Inline) dengan Logika UTC
node <<NODE_EOF
const { ethers } = require("ethers");
async function run() {
    try {
        // 1. Pembersihan Signature
        let sig = "$RAW_SIG".replace(/[^a-fA-F0-9]/g, "");
        if (sig.length === 131 && sig.startsWith('0')) { sig = sig.substring(1); }
        if (!sig.startsWith('0x')) { sig = '0x' + sig; }

        // 2. Pembersihan Private Key
        let pk = "$PRIVATE_KEY".replace(/[^a-fA-F0-9]/g, "");
        if (!pk.startsWith('0x')) { pk = '0x' + pk; }

        const provider = new ethers.JsonRpcProvider("$RPC_URL");
        const wallet = new ethers.Wallet(pk, provider);
        const contract = new ethers.Contract("$CONTRACT_ADDRESS", ["function mint(uint256 amount, bytes signature) external payable"], wallet);

        console.log("// INJECTING_MOLTZ_TO_BLOCKCHAIN...");
        const tx = await contract.mint(1, sig, { value: ethers.parseEther("0.0005") });
        
        // Logika Waktu UTC
        const now = new Date();
        const timeStr = now.toISOString().substr(11, 8); // Format HH:mm:ss UTC

        console.log("// TRANSACTION_SENT: " + tx.hash);
        await tx.wait();
        console.log("[" + timeStr + " UTC] AGENT_VERIFIED: ACCESS GRANTED");
    } catch (e) {
        console.log("// [ERROR] INJECTION_FAILED: " + e.message);
        process.exit(1);
    }
}
run();
NODE_EOF