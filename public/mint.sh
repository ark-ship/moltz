#!/bin/bash
echo "----------------------------------------------------"
echo "  MOLTZ_LABS: MAINNET_INJECTION_PROTOCOL"
echo "----------------------------------------------------"

# Capture interactive input
echo -n "// ENTER_YOUR_WALLET: "
read RAW_WALLET </dev/tty
echo -n "// ENTER_YOUR_PRIVATE_KEY (FOR GAS): "
read -s RAW_PK </dev/tty
echo ""

# Sanitize inputs
USER_WALLET=$(echo "$RAW_WALLET" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | tr -d '[:space:]')
USER_PK=$(echo "$RAW_PK" | sed 's/\x1b\[[0-9;]*[a-zA-Z]//g' | tr -d '[:space:]')

echo "// REQUESTING_SIGNATURE_FROM_SERVER..."
# Updated to your production domain
RESPONSE=$(curl -s -X POST https://molt.xyz/api/sign -d "$USER_WALLET")
SIGNATURE=$(echo $RESPONSE | grep -oP '"signature":"\K[^"]+')

if [ -z "$SIGNATURE" ]; then
    echo "[ERROR] AUTHORIZATION_FAILED: $RESPONSE"
    exit 1
fi

echo "// SIGNATURE_ACQUIRED. EXECUTING_MAINNET_MINT..."

python3 -c "
from web3 import Web3
from hexbytes import HexBytes
import re

# BASE MAINNET CONFIGURATION
w3 = Web3(Web3.HTTPProvider('https://mainnet.base.org'))
contract_addr = '0xb7DaE7957Fd2740cd19872861155E34C453D40f2'

abi = [{\"inputs\":[{\"internalType\":\"uint256\",\"name\":\"_mintAmount\",\"type\":\"uint256\"},{\"internalType\":\"bytes\",\"name\":\"_signature\",\"type\":\"bytes\"}],\"name\":\"mint\",\"outputs\":[],\"stateMutability\":\"payable\",\"type\":\"function\"}]

clean_addr = re.sub(r'[^a-fA-F0-9x]', '', '$USER_WALLET')
clean_key = re.sub(r'[^a-fA-F0-9]', '', '$USER_PK')

try:
    contract = w3.eth.contract(address=w3.to_checksum_address(contract_addr), abi=abi)
    nonce = w3.eth.get_transaction_count(w3.to_checksum_address(clean_addr))
    
    tx = contract.functions.mint(1, HexBytes('$SIGNATURE')).build_transaction({
        'from': w3.to_checksum_address(clean_addr),
        'value': w3.to_wei(0.0001, 'ether'),
        'nonce': nonce,
        'gas': 150000,
        'maxFeePerGas': w3.to_wei('0.1', 'gwei'),
        'maxPriorityFeePerGas': w3.to_wei('0.01', 'gwei'),
        'chainId': 8453 # BASE MAINNET ID
    })
    
    signed = w3.eth.account.sign_transaction(tx, clean_key)
    tx_hash = w3.eth.send_raw_transaction(signed.raw_transaction)
    print(f'// SUCCESS: https://basescan.org/tx/{w3.to_hex(tx_hash)}')
except Exception as e:
    print(f'// FAILED: {str(e)}')
"