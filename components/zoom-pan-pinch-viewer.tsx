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
  const [currentImageId, setCurrentImageId] = useState(1)
  const currentImage = imageGallery.find((img) => img.id === currentImageId) || imageGallery[0]

  // Pan/drag state for image navigation
  const [panStart, setPanStart] = useState<{ x: number; y: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)

  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const handleImageSelect = useCallback((imageId: number) => {
    setCurrentImageId(imageId)
    // Reset transform when switching images
    if (transformRef.current) {
      transformRef.current.resetTransform()
    }
  }, [])

  // Pan event handlers for image navigation using react-zoom-pan-pinch callbacks
  const handlePanningStart = useCallback((ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => {
    setIsPanning(true)
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    setPanStart({ x: clientX, y: clientY })
  }, [])

  const handlePanningStop = useCallback((ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => {
    if (!isPanning || !panStart) {
      setIsPanning(false)
      setPanStart(null)
      return
    }

    const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX
    const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY

    const deltaX = panStart.x - clientX
    const deltaY = panStart.y - clientY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    
    // Increase swipe threshold and require clear horizontal movement
    const swipeThreshold = 150 // Increased from 50 to 150px
    const isLeftSwipe = deltaX > swipeThreshold
    const isRightSwipe = deltaX < -swipeThreshold
    const isHorizontalDominant = absDeltaX > absDeltaY * 1.5 // Horizontal must be 1.5x more than vertical

    // Only handle horizontal swipes when movement is clearly horizontal
    if (isHorizontalDominant && (isLeftSwipe || isRightSwipe)) {
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
    }

    setIsPanning(false)
    setPanStart(null)
  }, [isPanning, panStart, currentImageId, handleImageSelect])

  return (
    <div className="h-full flex flex-col space-y-2">
      {/* Main Image Viewer */}
      <div className="relative flex-col rounded-lg  min-h-0 max-w-4xl mx-auto w-full flex items-center justify-center">
        <TransformWrapper
          ref={transformRef}
          initialScale={1} // reset initial scale to 1 (100%)
          minScale={1} // set minimum scale to 1 to prevent zooming below 100%
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "reset" }}
          onPanningStart={handlePanningStart}
          onPanningStop={handlePanningStop}
          limitToBounds={true}
          centerZoomedOut={true}
          panning={{ disabled: false }} // Enable panning for both zoom and navigation
          key={currentImageId} // Force re-render when image changes
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            <Image
              src={currentImage.url || "/placeholder.svg"}
              alt={currentImage.name}
              width={380}
              height={600}
              className="w-auto h-auto max-w-full max-h-full object-contain select-none"
              draggable={false}
            />
          </TransformComponent>
          <div className="bg-card rounded-lg mt-5 flex-shrink-0">
        
            <div className="flex gap-2 overflow-x-auto">
              {imageGallery.map((image) => (
                <div
                  key={image.id}
                  className={`relative flex-shrink-0 cursor-pointer rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageId === image.id
                      ? "border-primary ring-2 ring-primary/20"
                      : "border-border hover:border-primary/50"
                  }`}
                  onClick={() => handleImageSelect(image.id)}
                >
                  {currentImageId === image.id ? (
                  <MiniMap width={200} height={200}>
                    <Image
                      src={image.url || "/placeholder.svg"}
                      alt={image.name}
                      width={120}
                      height={200}
                      className="w-full h-full object-cover select-none"
                      draggable={true}
                    />
                  </MiniMap>
                  ) : (
                    <Image
                      src={image.thumbnail || image.url || "/placeholder.svg"}
                      alt={image.name}
                      width={120}
                      height={90}
                      className="w-full h-full object-cover select-none"
                      draggable={false}
                    />
                  )}
                  {currentImageId === image.id && (
                    <div className="absolute inset-0 bg-primary/10 flex items-center justify-center">
                      <div className="w-2 h-2 bg-primary rounded-full"></div>
                    </div>
                  )}
                </div>
              ))}
            </div>
          </div>
        </TransformWrapper>
      </div>
    </div>
  )
}
