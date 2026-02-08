const { ethers } = require("ethers");

async function main() {
    let [walletAddress, privateKey, signature, contractAddress] = process.argv.slice(2);
    
    // 1. Bersihkan & Format Private Key
    privateKey = privateKey.replace(/[^a-fA-F0-9]/g, "").trim();
    if (!privateKey.startsWith('0x')) privateKey = '0x' + privateKey;

    // 2. Bersihkan & Format Signature (Anti Zero-Leading Bug)
    signature = signature.replace(/[^a-fA-F0-9]/g, "").trim();
    
    // Jika panjangnya 131 karakter (karena nol tambahan), buang angka nol di depan
    if (signature.length === 131 && signature.startsWith('0')) {
        signature = signature.substring(1);
    }
    
    // Tambahkan 0x jika belum ada
    if (!signature.startsWith('0x')) signature = '0x' + signature;

    const provider = new ethers.JsonRpcProvider("https://mainnet.base.org");
    
    try {
        const wallet = new ethers.Wallet(privateKey, provider);
        const contract = new ethers.Contract(
            contractAddress,
            ["function mint(uint256 amount, bytes signature) external payable"],
            wallet
        );

        console.log("// INJECTING_MOLTZ_TO_BLOCKCHAIN...");
        
        const tx = await contract.mint(1, signature, {
            value: ethers.parseEther("0.0005")
        });
        
        console.log(`// TRANSACTION_SENT: ${tx.hash}`);
        await tx.wait();
        console.log("// INJECTION_COMPLETE: ACCESS GRANTED");
    } catch (error) {
        console.error("// [ERROR] INJECTION_FAILED:", error.message);
        process.exit(1);
    }
}

main();