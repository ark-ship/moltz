import { NextRequest, NextResponse } from "next/server";

const BASE_URL = "https://moltz.xyz"; // Ganti domain asli

export async function POST(req: NextRequest) {
  // Ini HTML sederhana buat ngasih tau Farcaster gambar baru
  const html = `
    <!DOCTYPE html>
    <html>
      <head>
        <meta property="fc:frame" content="vNext" />
        <meta property="fc:frame:image" content="${BASE_URL}/preview.png" />
        <meta property="fc:frame:button:1" content="WELCOME AGENT (VIEW DOSSIER)" />
        <meta property="fc:frame:button:1:action" content="link" />
        <meta property="fc:frame:button:1:target" content="${BASE_URL}" />
      </head>
      <body>
        <h1>RECRUITMENT SUCCESSFUL</h1>
      </body>
    </html>
  `;

  return new NextResponse(html, {
    status: 200,
    headers: { "Content-Type": "text/html" },
  });
}