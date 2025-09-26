"use client"

import { ZoomPanPinchViewer } from "@/components/zoom-pan-pinch-viewer"

export default function Home() {
  return (
    <main className=" bg-background flex flex-col overflow-hidden h-screen">
      <ZoomPanPinchViewer />
    </main>
  )
}
