#!/bin/bash

# --- CONFIGURATION ---
API_URL="https://moltz.xyz/api/sign"
RPC_URL="https://mainnet.base.org"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2" # GANTI DENGAN KONTRAK KAMU

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

# 1. INPUT DATA
# Menggunakan -r agar karakter backslash tidak dianggap aneh
read -r -p "// ENTER_YOUR_WALLET: " RAW_WALLET
# Menghapus spasi yang tidak sengaja terketik di awal atau akhir
WALLET=$(echo $RAW_WALLET | xargs)

if [ -z "$WALLET" ]; then
    echo "[ERROR] WALLET_ADDRESS_REQUIRED"
    exit 1
fi

read -r -s -p "// ENTER_YOUR_PRIVATE_KEY (FOR GAS): " PRIVATE_KEY
echo ""

# 2. REQUEST SIGNATURE FROM SERVER
echo "// REQUESTING_SIGNATURE_FROM_SERVER..."

# Mengirim data dengan format JSON yang strict
RESPONSE=$(curl -s -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d "{\"wallet\":\"$WALLET\"}")

# Ekstrak signature menggunakan sed agar kompatibel di semua terminal (Git Bash/Linux/Mac)
SIGNATURE=$(echo "$RESPONSE" | sed -n 's/.*"signature":"\([^"]*\)".*/\1/p')

# 3. VERIFIKASI SIGNATURE
if [ -z "$SIGNATURE" ] || [ "$SIGNATURE" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED"
    echo "SERVER_RESPONSE: $RESPONSE"
    echo "DEBUG_WALLET_SENT: '$WALLET'"
    exit 1
fi

echo "// SIGNATURE_RECEIVED: ${SIGNATURE:0:10}...${SIGNATURE: -10}"

# 4. EXECUTE ON-CHAIN INJECTION
echo "// INJECTING_MOLTZ_TO_BLOCKCHAIN..."

# Menggunakan 'cast' dari Foundry untuk eksekusi transaksi di Base Mainnet
# Pastikan saldo ETH di Base cukup (Mint 0.0005 + Gas)
cast send "$CONTRACT_ADDRESS" "mint(uint256,bytes)" 1 "$SIGNATURE" \
    --rpc-url "$RPC_URL" \
    --private-key "$PRIVATE_KEY" \
    --value 0.0005ether

echo "----------------------------------------------------"
echo "  INJECTION_COMPLETE: ACCESS GRANTED"
echo "  CHECK YOUR AGENT AT https://moltz.xyz"
echo "----------------------------------------------------"