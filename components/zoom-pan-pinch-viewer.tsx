"use client"

import { useState, useRef, useCallback, useMemo } from "react"
import { TransformWrapper, TransformComponent, MiniMap, type ReactZoomPanPinchRef } from "react-zoom-pan-pinch"

import Image from "next/image"
import { Button } from "@/components/ui/button"

const imageGallery = [
  {
    id: 1,
    name: "Menu 1",
    url: "/menu_jp_1.jpg",
    thumbnail: "/menu_jp_1.jpg",
  },
  {
    id: 2,
    name: "Menu 2",
    url: "/menu_jp_2.jpg",
    thumbnail: "/menu_jp_2.jpg",
  }
]

export function ZoomPanPinchViewer() {
  const [currentImageId, setCurrentImageId] = useState(1)
  
  // Memoize current image to prevent unnecessary recalculations
  const currentImage = useMemo(() => 
    imageGallery.find((img) => img.id === currentImageId) || imageGallery[0],
    [currentImageId]
  )

  // Pan/drag state for image navigation
  const [panStart, setPanStart] = useState<{ x: number; y: number; time: number } | null>(null)
  const [isPanning, setIsPanning] = useState(false)
  

  const transformRef = useRef<ReactZoomPanPinchRef>(null)

  const handleImageSelect = useCallback((imageId: number) => {
    setCurrentImageId(imageId)
    // Optional: Reset transform when switching images (comment out if you want to keep zoom/pan state)
    if (transformRef.current) {
      transformRef.current.resetTransform()
    }
  }, [])


  // Pan event handlers for image navigation using react-zoom-pan-pinch callbacks
  const handlePanningStart = useCallback((ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => {
    setIsPanning(true)
    const clientX = 'touches' in event ? event.touches[0].clientX : event.clientX
    const clientY = 'touches' in event ? event.touches[0].clientY : event.clientY
    
    setPanStart({ x: clientX, y: clientY, time: Date.now() })
  }, [])

  const handlePanningStop = useCallback((ref: ReactZoomPanPinchRef, event: TouchEvent | MouseEvent) => {
    if (!isPanning || !panStart || !ref) {
      setIsPanning(false)
      setPanStart(null)
      return
    }

    const currentTime = Date.now()
    const clientX = 'changedTouches' in event ? event.changedTouches[0].clientX : event.clientX
    const clientY = 'changedTouches' in event ? event.changedTouches[0].clientY : event.clientY

    const deltaX = panStart.x - clientX
    const deltaY = panStart.y - clientY
    const absDeltaX = Math.abs(deltaX)
    const absDeltaY = Math.abs(deltaY)
    const timeDelta = currentTime - panStart.time
    
    // Get current transform state
    const { state } = ref
    const { scale, positionX } = state
    
    // Swipe detection với khoảng cách và thời gian
    const minSwipeDistance = 100 // Tăng khoảng cách tối thiểu để trigger
    const maxSwipeTime = 500 // Thời gian tối đa cho một swipe gesture (ms)
    const minSwipeVelocity = 0.3 // Tốc độ tối thiểu (pixel/ms)
    
    const velocity = absDeltaX / timeDelta
    const isValidSwipeGesture = timeDelta < maxSwipeTime && velocity > minSwipeVelocity
    
    const isLeftSwipe = deltaX > minSwipeDistance
    const isRightSwipe = deltaX < -minSwipeDistance
    const isHorizontalDominant = absDeltaX > absDeltaY * 1.5 // Phải rõ ràng là movement ngang
    
    let canNavigate = false
    
    // Chỉ cho phép navigation khi đây là một gesture swipe rõ ràng
    if (isValidSwipeGesture && isHorizontalDominant && (isLeftSwipe || isRightSwipe)) {
      if (scale <= 1.1) {
        // Khi không zoom hoặc zoom ít, cho phép navigation dễ dàng
        canNavigate = true
      } else {
        // Khi zoom nhiều, kiểm tra boundaries
        const wrapperEl = ref.instance?.wrapperComponent
        const contentEl = ref.instance?.contentComponent
        
        if (wrapperEl && contentEl) {
          const containerRect = wrapperEl.getBoundingClientRect()
          const contentRect = contentEl.getBoundingClientRect()
          
          // Kiểm tra xem content có ở edge không
          const isAtLeftEdge = contentRect.left >= containerRect.left - 10
          const isAtRightEdge = contentRect.right <= containerRect.right + 10
          
          // Chỉ cho phép navigation khi ở edge và swipe đủ xa
          canNavigate = (
            (isLeftSwipe && isAtRightEdge) ||
            (isRightSwipe && isAtLeftEdge)
          )
        }
      }
    }

    // Debug log để theo dõi
    console.log('Swipe Debug:', {
      deltaX,
      deltaY,
      absDeltaX,
      absDeltaY,
      timeDelta,
      velocity,
      scale,
      isValidSwipeGesture,
      isHorizontalDominant,
      isLeftSwipe,
      isRightSwipe,
      canNavigate
    })

    if (canNavigate) {
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

  const handleThumbnailClick = (imageId: number) => {
    // Prevent clicking on already selected item
    if (imageId === currentImageId) {
      return
    }
    
    handleImageSelect(imageId)
  }

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <span className="font-black text-foreground text-lg">Image Gallery</span>
      </header>
      
      {/* Main Image Viewer */}
      <div className="relative flex-col rounded-lg max-w-4xl mx-auto w-full flex items-center justify-center mt-2 flex-1 overflow-hidden pb-32">
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
        >
          <TransformComponent
            wrapperClass="w-full h-full"
            contentClass="w-full h-full flex items-center justify-center"
          >
            <div>
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.name}
                width={450}
                height={550}
                className="w-auto h-auto max-w-full max-h-full object-contain select-none"
                draggable={false}
              />
            </div>
          </TransformComponent>
          
          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t py-2 z-10">
            <div className="max-w-4xl mx-auto">
              <div className="flex gap-2 overflow-x-auto justify-center">
              {imageGallery.map((image) => (
                <div
                  key={image.id}
                  className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                    currentImageId === image.id
                      ? "border-none cursor-default"
                      : "border-none  cursor-pointer"
                  }`}
                  onClick={() => handleThumbnailClick(image.id)}
                >
                  {currentImageId === image.id ? (
                    <MiniMap width={120} height={120} borderColor="#1d4279">
                      <Image
                        src={image.url || "/placeholder.svg"}
                        alt={image.name}
                        width={80}
                        height={120}
                        className="w-full h-full object-cover select-none"
                        draggable={false}
                      />
                    </MiniMap>
                  ) : (
                    <Image
                      src={image.thumbnail || image.url || "/placeholder.svg"}
                      alt={image.name}
                      width={80}
                      height={120}
                      className="w-full h-[85px] object-cover select-none"
                      draggable={false}
                    />
                  )}
                  
                </div>
              ))}
              </div>
            </div>
          </div>
        </TransformWrapper>
      </div>
    </div>
  )
}
