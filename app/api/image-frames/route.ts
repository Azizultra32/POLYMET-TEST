import { NextResponse } from "next/server"

export async function GET(request: Request) {
  const frameUrls = [
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_000.jpg-QcNKreMuOx8gkc9Dp4oTBQTS7fDPgx.jpeg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_001.jpg-IpDIkZeMSM5aQ446gUlGtr13u63cKl.jpeg",
    "https://hebbkx1anhila5yf.public.blob.vercel-storage.com/frame_002.jpg-IolriPy0ICHSLeBWqp9ngeYsDK3rck.jpeg",
    // Add more frames as needed
  ]

  return NextResponse.json({
    frameUrls,
    totalFrames: 46,
  })
}
