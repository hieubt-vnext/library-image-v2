"use client"

import type React from "react"
import { useRef, useEffect, useState, useCallback } from "react"

interface ImageData {
  id: number
  name: string
  url: string
  thumbnail: string
}

interface MiniMapProps {
  images: ImageData[]
  currentImageId: number
  scale: number
  positionX: number
  positionY: number
  onImageSelect: (imageId: number) => void
  onPositionChange: (x: number, y: number) => void
}

export function MiniMap({
  images,
  currentImageId,
  scale,
  positionX,
  positionY,
  onImageSelect,
  onPositionChange,
}: MiniMapProps) {
  const canvasRefs = useRef<{ [key: number]: HTMLCanvasElement | null }>({})
  const [imageDimensions, setImageDimensions] = useState<{ [key: number]: { width: number; height: number } }>({})
  const [loadedImages, setLoadedImages] = useState<{ [key: number]: boolean }>({})
  const [containerDimensions, setContainerDimensions] = useState({ width: 0, height: 0 })

  // Calculate mini-map dimensions based on image dimensions
  const getMiniMapDimensions = useCallback((imageId: number) => {
    const dimensions = imageDimensions[imageId]
    if (!dimensions) return { width: 200, height: 140 } // fallback dimensions
    
    const maxWidth = 250
    const maxHeight = 180
    const aspectRatio = dimensions.width / dimensions.height
    
    let width = maxWidth
    let height = maxHeight
    
    if (aspectRatio > maxWidth / maxHeight) {
      height = maxWidth / aspectRatio
    } else {
      width = maxHeight * aspectRatio
    }
    
    return { width: Math.round(width), height: Math.round(height) }
  }, [imageDimensions])

  const drawViewport = useCallback((
    ctx: CanvasRenderingContext2D,
    drawWidth: number,
    drawHeight: number,
    offsetX: number,
    offsetY: number,
    imageId: number,
  ) => {
    const dimensions = imageDimensions[imageId]
    if (!dimensions || !loadedImages[imageId] || containerDimensions.width === 0) return

    const imageAspectRatio = dimensions.width / dimensions.height
    const containerAspectRatio = containerDimensions.width / containerDimensions.height

    // Determine how the image fits in the container (object-cover behavior)
    let imageDisplayWidth, imageDisplayHeight
    if (imageAspectRatio > containerAspectRatio) {
      // Image is wider - height fills container, width is cropped
      imageDisplayHeight = containerDimensions.height
      imageDisplayWidth = imageDisplayHeight * imageAspectRatio
    } else {
      // Image is taller - width fills container, height is cropped
      imageDisplayWidth = containerDimensions.width
      imageDisplayHeight = imageDisplayWidth / imageAspectRatio
    }

    // Calculate visible viewport dimensions in minimap scale
    const visibleWidth = (containerDimensions.width / imageDisplayWidth) * drawWidth
    const visibleHeight = (containerDimensions.height / imageDisplayHeight) * drawHeight

    // Scale viewport by zoom level
    const viewportWidth = visibleWidth / scale
    const viewportHeight = visibleHeight / scale

    // Calculate position based on transform
    const scaleFactorX = drawWidth / imageDisplayWidth
    const scaleFactorY = drawHeight / imageDisplayHeight

    const relativeX = offsetX - positionX * scaleFactorX
    const relativeY = offsetY - positionY * scaleFactorY

    // Clamp viewport to minimap bounds
    const clampedX = Math.max(offsetX, Math.min(relativeX, offsetX + drawWidth - viewportWidth))
    const clampedY = Math.max(offsetY, Math.min(relativeY, offsetY + drawHeight - viewportHeight))
    const clampedWidth = Math.min(viewportWidth, drawWidth - (clampedX - offsetX))
    const clampedHeight = Math.min(viewportHeight, drawHeight - (clampedY - offsetY))

    // Draw viewport rectangle
    ctx.strokeStyle = "#3b82f6"
    ctx.lineWidth = 2
    ctx.strokeRect(clampedX, clampedY, clampedWidth, clampedHeight)

    // Add semi-transparent overlay outside viewport
    ctx.fillStyle = "rgba(0, 0, 0, 0.3)"

    // Top
    if (clampedY > offsetY) {
      ctx.fillRect(offsetX, offsetY, drawWidth, clampedY - offsetY)
    }

    // Bottom
    const viewportBottom = clampedY + clampedHeight
    if (viewportBottom < offsetY + drawHeight) {
      ctx.fillRect(offsetX, viewportBottom, drawWidth, offsetY + drawHeight - viewportBottom)
    }

    // Left
    if (clampedX > offsetX) {
      ctx.fillRect(offsetX, Math.max(clampedY, offsetY), clampedX - offsetX, Math.min(clampedHeight, drawHeight))
    }

    // Right
    const viewportRight = clampedX + clampedWidth
    if (viewportRight < offsetX + drawWidth) {
      ctx.fillRect(
        viewportRight,
        Math.max(clampedY, offsetY),
        offsetX + drawWidth - viewportRight,
        Math.min(clampedHeight, drawHeight),
      )
    }
  }, [imageDimensions, loadedImages, containerDimensions, scale, positionX, positionY])

  useEffect(() => {
    const updateContainerDimensions = () => {
      const maxWidth = Math.min(window.innerWidth * 0.9, 1024) // max-w-4xl equivalent
      const containerWidth = maxWidth
      const containerHeight = maxWidth * (3 / 4) // 4:3 aspect ratio

      setContainerDimensions({ width: containerWidth, height: containerHeight })
    }

    updateContainerDimensions()
    window.addEventListener("resize", updateContainerDimensions)

    return () => window.removeEventListener("resize", updateContainerDimensions)
  }, [])

  useEffect(() => {
    images.forEach((imageData) => {
      const canvas = canvasRefs.current[imageData.id]
      if (!canvas) return

      const ctx = canvas.getContext("2d")
      if (!ctx) return

      const img = new Image()
      img.crossOrigin = "anonymous"

      img.onload = () => {
        setImageDimensions((prev) => ({
          ...prev,
          [imageData.id]: { width: img.width, height: img.height },
        }))
        setLoadedImages((prev) => ({
          ...prev,
          [imageData.id]: true,
        }))

        // Get dynamic mini-map dimensions
        const { width: miniMapWidth, height: miniMapHeight } = getMiniMapDimensions(imageData.id)
        
        // Update canvas size
        canvas.width = miniMapWidth
        canvas.height = miniMapHeight

        // Clear canvas
        ctx.clearRect(0, 0, miniMapWidth, miniMapHeight)

        // Calculate aspect ratio and draw thumbnail
        const aspectRatio = img.width / img.height
        let drawWidth = miniMapWidth
        let drawHeight = miniMapHeight

        if (aspectRatio > miniMapWidth / miniMapHeight) {
          drawHeight = miniMapWidth / aspectRatio
        } else {
          drawWidth = miniMapHeight * aspectRatio
        }

        const offsetX = (miniMapWidth - drawWidth) / 2
        const offsetY = (miniMapHeight - drawHeight) / 2

        ctx.drawImage(img, offsetX, offsetY, drawWidth, drawHeight)

        if (imageData.id === currentImageId && scale > 1) {
          drawViewport(ctx, drawWidth, drawHeight, offsetX, offsetY, imageData.id)
        }
      }

      // Use thumbnail for gallery display
      img.src = imageData.thumbnail
    })
  }, [images, currentImageId, scale, positionX, positionY, containerDimensions, getMiniMapDimensions, drawViewport])

  const handleCanvasClick = (event: React.MouseEvent<HTMLCanvasElement>, imageData: ImageData) => {
    if (imageData.id !== currentImageId) {
      // Select different image
      onImageSelect(imageData.id)
    } else if (scale > 1) {
      // Navigate within current image
      const canvas = canvasRefs.current[imageData.id]
      if (!canvas || !loadedImages[imageData.id]) return

      const rect = canvas.getBoundingClientRect()
      const clickX = event.clientX - rect.left
      const clickY = event.clientY - rect.top

      const dimensions = imageDimensions[imageData.id]
      if (!dimensions || containerDimensions.width === 0) return

      // Get dynamic mini-map dimensions
      const { width: miniMapWidth, height: miniMapHeight } = getMiniMapDimensions(imageData.id)
      
      // Convert click coordinates to image coordinates
      const aspectRatio = dimensions.width / dimensions.height
      let drawWidth = miniMapWidth
      let drawHeight = miniMapHeight

      if (aspectRatio > miniMapWidth / miniMapHeight) {
        drawHeight = miniMapWidth / aspectRatio
      } else {
        drawWidth = miniMapHeight * aspectRatio
      }

      const offsetX = (miniMapWidth - drawWidth) / 2
      const offsetY = (miniMapHeight - drawHeight) / 2

      const relativeX = (clickX - offsetX) / drawWidth
      const relativeY = (clickY - offsetY) / drawHeight

      // Calculate actual image display dimensions
      const imageAspectRatio = dimensions.width / dimensions.height
      const containerAspectRatio = containerDimensions.width / containerDimensions.height

      let imageDisplayWidth, imageDisplayHeight
      if (imageAspectRatio > containerAspectRatio) {
        imageDisplayHeight = containerDimensions.height
        imageDisplayWidth = imageDisplayHeight * imageAspectRatio
      } else {
        imageDisplayWidth = containerDimensions.width
        imageDisplayHeight = imageDisplayWidth / imageAspectRatio
      }

      // Convert to image coordinates
      const imageX = relativeX * imageDisplayWidth - containerDimensions.width / 2
      const imageY = relativeY * imageDisplayHeight - containerDimensions.height / 2

      onPositionChange(imageX, imageY)
    }
  }

  const handleCanvasTouch = (event: React.TouchEvent<HTMLCanvasElement>, imageData: ImageData) => {
    event.preventDefault()
    const touch = event.touches[0]
    if (!touch) return

    // Convert touch event to mouse event format
    const mouseEvent = {
      clientX: touch.clientX,
      clientY: touch.clientY,
    } as React.MouseEvent<HTMLCanvasElement>

    handleCanvasClick(mouseEvent, imageData)
  }

  return (
    <div className="flex gap-2 overflow-x-autos crollbar-thin scrollbar-thumb-gray-300 scrollbar-track-transparent">
      {images.map((imageData) => (
        <div key={imageData.id} className="flex flex-col items-center space-y-1 flex-shrink-0">
          <div
            className={`relative rounded-lg overflow-hidden transition-all duration-200 ${
              imageData.id === currentImageId
                ? "ring-2 ring-primary shadow-lg scale-105"
                : "hover:ring-2 hover:ring-primary/50 hover:scale-102"
            }`}
          >
            <canvas
              ref={(el) => {
                canvasRefs.current[imageData.id] = el
              }}
              width={getMiniMapDimensions(imageData.id).width}
              height={getMiniMapDimensions(imageData.id).height}
              className="cursor-pointer transition-transform"
              onClick={(e) => handleCanvasClick(e, imageData)}
              onTouchStart={(e) => handleCanvasTouch(e, imageData)}
            />
           
          </div>

        </div>
      ))}
    </div>
  )
}
