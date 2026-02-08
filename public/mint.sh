#!/bin/bash

# --- CONFIGURATION ---
API_URL="https://moltz.xyz/api/sign"
RPC_URL="https://mainnet.base.org"
CONTRACT_ADDRESS="0xb7DaE7957Fd2740cd19872861155E34C453D40f2" # GANTI DENGAN KONTRAK KAMU

echo "----------------------------------------------------"
echo "  MOLTZ_LABS: Agent-Only PFP Protocol"
echo "----------------------------------------------------"

# 1. INPUT DATA
read -p "// ENTER_YOUR_WALLET: " WALLET
read -s -p "// ENTER_YOUR_PRIVATE_KEY (FOR GAS): " PRIVATE_KEY
echo ""

# 2. REQUEST SIGNATURE FROM API
echo "// REQUESTING_SIGNATURE_FROM_SERVER..."

# Menggunakan format JSON yang aman untuk Bash
RESPONSE=$(curl -s -X POST "$API_URL" \
     -H "Content-Type: application/json" \
     -d "{\"wallet\":\"$WALLET\"}")

# Ekstrak signature dari respon JSON
SIGNATURE=$(echo $RESPONSE | grep -oP '(?<="signature":")[^"]*')

if [ -z "$SIGNATURE" ] || [ "$SIGNATURE" == "null" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED: API did not return a valid signature."
    echo "Respon Server: $RESPONSE"
    exit 1
fi

echo "// SIGNATURE_RECEIVED: ${SIGNATURE:0:10}...${SIGNATURE: -10}"

# 3. EXECUTE MINTING (Using Cast from Foundry)
# Jika user belum install foundry, kita arahkan. 
# Jika kamu pakai library lain di terminal, sesuaikan baris ini.
echo "// INJECTING_MOLTZ_TO_BLOCKCHAIN..."

# Contoh menggunakan 'cast' (Foundry) untuk eksekusi transaksi
# Fungsi mint kamu: mint(uint256 amount, bytes signature)
cast send $CONTRACT_ADDRESS "mint(uint256,bytes)" 1 "$SIGNATURE" \
    --rpc-url $RPC_URL \
    --private-key $PRIVATE_KEY \
    --value 0.0005ether

echo "----------------------------------------------------"
echo "  INJECTION_COMPLETE: CHECK MOLTZ.XYZ"
echo "----------------------------------------------------"