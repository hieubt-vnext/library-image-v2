"use client"

import { useState, useRef, useCallback } from "react"
import { TransformWrapper, TransformComponent, MiniMap, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

import Image from "next/image"

const imageGallery = [
  {
    id: 1,
    name: "Menu 1",
    url: "/image-4.png",
    thumbnail: "/image-4.png",
  },
  {
    id: 2,
    name: "Menu 2",
    url: "/image-5.png",
    thumbnail: "/image-5.png",
  }
]

export function ZoomPanPinchViewer() {
  const [transformState, setTransformState] = useState({
    scale: 1,
    positionX: 0,
    positionY: 0,
  })

  const [currentImageId, setCurrentImageId] = useState(1)
  const currentImage = imageGallery.find((img) => img.id === currentImageId) || imageGallery[0]

  // Touch/swipe state
  const [touchStart, setTouchStart] = useState<{ x: number; y: number } | null>(null)
  const [touchEnd, setTouchEnd] = useState<{ x: number; y: number } | null>(null)

  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const handleTransform = useCallback((ref: ReactZoomPanPinchRef) => {
    const { state } = ref
    setTransformState({
      scale: state.scale,
      positionX: state.positionX,
      positionY: state.positionY,
    })
  }, [])



  const handleImageSelect = useCallback((imageId: number) => {
    setCurrentImageId(imageId)
    // Reset transform when switching images
    if (transformRef.current) {
      transformRef.current.resetTransform()
    }
  }, [])

  // Touch event handlers for swipe navigation
  const handleTouchStart = useCallback((e: React.TouchEvent) => {
    setTouchEnd(null)
    setTouchStart({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }, [])

  const handleTouchMove = useCallback((e: React.TouchEvent) => {
    setTouchEnd({
      x: e.targetTouches[0].clientX,
      y: e.targetTouches[0].clientY,
    })
  }, [])

  const handleTouchEnd = useCallback(() => {
    if (!touchStart || !touchEnd) return

    const deltaX = touchStart.x - touchEnd.x
    const deltaY = touchStart.y - touchEnd.y
    const isLeftSwipe = deltaX > 50
    const isRightSwipe = deltaX < -50
    const isVerticalSwipe = Math.abs(deltaY) > Math.abs(deltaX)

    // Only handle horizontal swipes when not zoomed in
    if (isVerticalSwipe || transformState.scale > 1) return

    if (isLeftSwipe) {
      // Swipe left - go to next image
      const currentIndex = imageGallery.findIndex((img) => img.id === currentImageId)
      const nextIndex = (currentIndex + 1) % imageGallery.length
      handleImageSelect(imageGallery[nextIndex].id)
    } else if (isRightSwipe) {
      // Swipe right - go to previous image
      const currentIndex = imageGallery.findIndex((img) => img.id === currentImageId)
      const prevIndex = currentIndex === 0 ? imageGallery.length - 1 : currentIndex - 1
      handleImageSelect(imageGallery[prevIndex].id)
    }
  }, [touchStart, touchEnd, currentImageId, transformState.scale, handleImageSelect])

  return (
    <div className="h-full flex flex-col space-y-2">
      {/* Main Image Viewer */}
      <div
        className="relative flex-col rounded-lg flex-1 min-h-0 max-w-4xl mx-auto w-full flex items-center justify-center"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
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
              className="w-auto h-auto max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </TransformComponent>
          <div className="bg-card rounded-lg p-2 flex-shrink-0">
        <h3 className="text-sm font-medium text-card-foreground mb-2">Image Gallery</h3>
        <MiniMap width={200}>
            <Image
              src={currentImage.url || "/placeholder.svg"}
              alt={currentImage.name}
              width={200}
              height={150}
              className="w-full h-full object-cover select-none"
              draggable={false}
            />
          </MiniMap>
      </div>
        </TransformWrapper>
      </div>
    </div>
  )
}
