const { ethers } = require("ethers");

async function main() {
    let [walletAddress, privateKey, signature, contractAddress] = process.argv.slice(2);
    
    // Pembersihan Private Key
    privateKey = privateKey.replace(/[^a-fA-F0-9]/g, "");
    if (!privateKey.startsWith('0x')) privateKey = '0x' + privateKey;

    // PEMBERSIHAN SIGNATURE (PENTING!)
    // Menghapus spasi, enter, atau karakter aneh yang bikin BytesLike error
    signature = signature.replace(/[^a-fA-F0-9]/g, "");
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