"use client"

import { useState, useRef, useCallback } from "react"
import { TransformWrapper, TransformComponent, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"
import { MiniMap } from "./mini-map"
import Image from "next/image"

const imageGallery = [

  {
    id: 1,
    name: "KFC Menu Vietnamese",
    url: "/kfc-menu-vietnamese.png",
    thumbnail: "/kfc-menu-vietnamese.png",
  },
]

export function ZoomPanPinchViewer() {
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  })

  const [currentImageId, setCurrentImageId] = useState(1)
  const currentImage = imageGallery.find((img) => img.id === currentImageId) || imageGallery[0]

  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const { state } = ref
    setTransformState({
      scale: state.scale,
      positionX: state.positionX,
      positionY: state.positionY,
    })
  }, [])

  const handleMiniMapClick = useCallback(
    (x: number, y: number) => {
      if (transformRef.current) {
        
        // Convert mini map coordinates to main view coordinates
        const targetX = -x * transformState.scale
        const targetY = -y * transformState.scale

        transformRef.current.setTransform(targetX, targetY, transformState.scale, 200)
      }
    },
    [transformState.scale],
  )

  const handleImageSelect = useCallback((imageId: number) => {
    setCurrentImageId(imageId)
    // Reset transform when switching images
    if (transformRef.current) {
      transformRef.current.resetTransform()
    }
  }, [])

  return (
    <div className="h-full flex flex-col space-y-4">
      {/* Main Image Viewer */}
      <div
        className="relative rounded-lg overflow-hidden flex-1 min-h-0 max-w-4xl mx-auto w-full flex items-center justify-center"
        style={{ aspectRatio: "3/4" }}
      >
        <TransformWrapper
          ref={transformRef}
          initialScale={1} // reset initial scale to 1 (100%)
          minScale={1} // set minimum scale to 1 to prevent zooming below 100%
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "reset" }}
          onTransformed={handleTransform}
          limitToBounds={true}
          centerZoomedOut={true}
          panning={{ disabled: transformState.scale <= 1 }} // updated panning threshold to match new minScale
          key={currentImageId} // Force re-render when image changes
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            <Image
              src={currentImage.url || "/placeholder.svg"}
              alt={currentImage.name}
              width={800}
              height={600}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          </TransformComponent>
        </TransformWrapper>
      </div>

      {/* Image Gallery & Mini Maps */}
      <div className="bg-card rounded-lg p-4 flex-shrink-0">
        {" "}
        {/* removed border border-border */}
        <h3 className="text-sm font-medium text-card-foreground mb-4">Image Gallery & Mini Maps</h3>
        <MiniMap
          images={imageGallery}
          currentImageId={currentImageId}
          scale={transformState.scale}
          positionX={transformState.positionX}
          positionY={transformState.positionY}
          onImageSelect={handleImageSelect}
          onPositionChange={handleMiniMapClick}
        />
      </div>
    </div>
  )
}
