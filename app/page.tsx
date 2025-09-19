"use client"

import { ZoomPanPinchViewer } from "@/components/zoom-pan-pinch-viewer"

export default function Home() {
  return (
    <main className="h-full bg-background flex flex-col overflow-hidden">
      <div className="flex-1 flex flex-col min-h-0">
        <h1 className="text-2xl font-bold text-center mb-4 text-foreground flex-shrink-0">Mobile Image Viewer</h1>
        <div className="flex-1 min-h-0">
          <ZoomPanPinchViewer />
        </div>
      </div>
    </main>
  )
}
