"use client"

import { ZoomPanPinchViewer } from "@/components/zoom-pan-pinch-viewer"

export default function Home() {
  return (
    <main className="h-screen bg-background flex flex-col">
      <div className="flex-1 flex flex-col overflow-auto">
        <h1 className="text-2xl font-bold text-center mb-4 text-foreground flex-shrink-0">Mobile Image Viewer</h1>
        <div className="flex-1 overflow-hidden">
          <ZoomPanPinchViewer />
        </div>
      </div>
    </main>
  )
}
