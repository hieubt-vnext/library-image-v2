"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  TransformWrapper,
  TransformComponent,
  MiniMap,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";

import Image from "next/image";

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
  },
  // {
  //   id: 3,
  //   name: "Menu 3",
  //   url: "/menu_jp_3.jpg",
  //   thumbnail: "/menu_jp_3.jpg",
  // },
  {
    id: 4,
    name: "Menu 4",
    url: "/menu_jp_4.png",
    thumbnail: "/menu_jp_4.png",
  },
  {
    id: 5,
    name: "Menu 5",
    url: "/menu_jp_5.png",
    thumbnail: "/menu_jp_5.png",
  },
  {
    id: 6,
    name: "Menu 6",
    url: "/menu_jp_6.png",
    thumbnail: "/menu_jp_6.png",
  },
  {
    id: 7,
    name: "Menu 7",
    url: "/menu_jp_7.png",
    thumbnail: "/menu_jp_7.png",
  },
  {
    id: 8,
    name: "Menu 8",
    url: "/menu_jp_8.png",
    thumbnail: "/menu_jp_8.png",
  },
];

export function ZoomPanPinchViewer() {
  const [currentImageId, setCurrentImageId] = useState(1);
  const [zoomScale, setZoomScale] = useState(1);
  const [isInitialized, setIsInitialized] = useState(false);

  // Memoize current image to prevent unnecessary recalculations
  const currentImage = useMemo(
    () =>
      imageGallery.find((img) => img.id === currentImageId) || imageGallery[0],
    [currentImageId],
  );

  const transformRef = useRef<ReactZoomPanPinchRef>(null);
  const scrollAreaRef = useRef<HTMLDivElement>(null);

  const handleImageSelect = useCallback((imageId: number) => {
    setCurrentImageId(imageId);
    // Keep zoom/pan state when switching images
    // if (transformRef.current) {
    //   transformRef.current.resetTransform()
    // }
  }, []);

  const handleTransformChange = useCallback(
    (
      _ref: ReactZoomPanPinchRef,
      state: { scale: number; positionX: number; positionY: number },
    ) => {
      setZoomScale(state.scale);
      // Mark as initialized after first transform
      if (!isInitialized) {
        setIsInitialized(true);
      }
    },
    [isInitialized],
  );

  const handlePanningStop = useCallback(
    (ref: ReactZoomPanPinchRef) => {
      // Auto center when panning stops and scale is 100%
      if (ref && isInitialized && zoomScale === 1) {
        setTimeout(() => {
          ref.centerView(undefined, 300); // Center with smooth animation
        }, 100); // Small delay to ensure panning has fully stopped
      }
    },
    [isInitialized, zoomScale],
  );

  const handleInit = useCallback((ref: ReactZoomPanPinchRef) => {
    // Reset transform first, then center
    ref.resetTransform(0); // Reset position and scale without animation
    setTimeout(() => {
      ref.centerView(undefined, 0); // Center without animation
      setIsInitialized(true);
    }, 50); // Small delay to ensure reset completes first
  }, []);

  // Force reset and center on mount
  useEffect(() => {
    const forceResetAndCenter = () => {
      if (transformRef.current) {
        // First reset everything to initial state
        transformRef.current.resetTransform(0);
        // Then center after a brief delay
        setTimeout(() => {
          if (transformRef.current) {
            transformRef.current.centerView(undefined, 0);
            setIsInitialized(true);
          }
        }, 100);
        return true;
      }
      return false;
    };

    // Reset state first
    setIsInitialized(false);
    
    // Try to reset and center immediately
    if (!forceResetAndCenter()) {
      // If not ready, try again after a delay
      const timer = setTimeout(() => {
        forceResetAndCenter();
      }, 200);
      
      return () => clearTimeout(timer);
    }
  }, []); // Empty dependency to run only on mount

  // Center image when zoom scale returns to 1 (without animation)
  useEffect(() => {
    if (zoomScale === 1 && transformRef.current && isInitialized) {
      transformRef.current.centerView(undefined, 0); // 0 duration = no animation
    }
  }, [zoomScale, isInitialized]);


  // Auto-scroll to selected thumbnail
  useEffect(() => {
    if (scrollAreaRef.current) {
      const selectedThumbnail = scrollAreaRef.current.querySelector(
        `[data-image-id="${currentImageId}"]`,
      ) as HTMLElement;
      if (selectedThumbnail) {
        selectedThumbnail.scrollIntoView({
          behavior: "auto",
          block: "nearest",
          inline: "center",
        });
      }
    }
  }, [currentImageId]);

  const handleThumbnailClick = (imageId: number) => {
    // Prevent clicking on already selected item
    if (imageId === currentImageId) {
      return;
    }

    handleImageSelect(imageId);
  };

  return (
    <div className="h-full flex flex-col">
      {/* Header */}
      <header className="flex items-center justify-center px-6 py-4 border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <span className="font-black text-foreground text-lg">
          Image Gallery
        </span>
      </header>

      {/* Main Image Viewer */}
      <div className="relative flex-col rounded-lg max-w-full mx-auto w-full flex items-center justify-center flex-1 overflow-hidden pb-36 min-h-0">
        <TransformWrapper
          ref={transformRef}
          initialScale={1} // reset initial scale to 1 (100%)
          initialPositionX={0} // reset initial position X
          initialPositionY={0} // reset initial position Y
          minScale={1} // set minimum scale to 1 to prevent zooming below 100%
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "reset", animationTime: 0 }} // No animation for double click reset
          limitToBounds={true}
          centerZoomedOut={true}
          alignmentAnimation={{ disabled: true }} // Disable alignment animation
          velocityAnimation={{ disabled: true }} // Disable velocity animation
          panning={{ 
            disabled: false,
            lockAxisY: zoomScale === 1, // Khóa trục Y khi zoom scale = 1
          }}
          onTransformed={handleTransformChange}
          onInit={handleInit}
          onPanningStop={handlePanningStop}
        >
          <TransformComponent
            wrapperClass={`w-full h-full flex !h-screen`}
            contentClass="w-full h-full flex items-center justify-center"
          >
            <div className={`flex items-center justify-center w-full h-ful transition-opacity duration-0 ${isInitialized ? 'opacity-100' : 'opacity-0'}`}>
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.name}
                width={800}
                height={600}
                className="max-w-full max-h-full w-auto h-auto object-contain select-none"
                draggable={false}
              />
            </div>
          </TransformComponent>

          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t py-2 z-10">
            <div className="max-w-4xl mx-auto">
              <div 
                className="w-full rounded-md h-32 overflow-x-auto overflow-y-hidden scrollbar-hide" 
                ref={scrollAreaRef}
                style={{ 
                  overflowY: 'hidden', 
                  overflowX: 'auto',
                  touchAction: 'pan-x',
                  scrollbarWidth: 'none',
                  msOverflowStyle: 'none'
                }}
              >
                <div className="flex w-max space-x-4 p-4 h-full select-none">
                  {imageGallery.map((image) => (
                    <div
                      key={image.id}
                      data-image-id={image.id}
                      className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all select-none ${
                        currentImageId === image.id
                          ? "border-none cursor-default"
                          : "border-none  cursor-pointer"
                      }`}
                      onClick={() => handleThumbnailClick(image.id)}
                      onDragStart={(e) => e.preventDefault()}
                    >
                      {currentImageId === image.id ? (
                        <>
                          {zoomScale === 1 ? (
                            <div className="border-3 border-[#1d4279] overflow-hidden">
                              <Image
                                src={image.thumbnail || image.url || "/placeholder.svg"}
                                alt={image.name}
                                width={120}
                                height={120}
                                className="w-full h-[85px] object-cover select-none"
                                draggable={false}
                              />
                            </div>
                          ) : (
                            <MiniMap width={200} height={85} borderColor="#1d4279">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt={image.name}
                                width={80}
                                height={85}
                                className="w-full h-full object-cover select-none"
                                draggable={false}
                              />
                            </MiniMap>
                          )}
                        </>
                      ) : (
                          <Image
                            src={
                              image.thumbnail || image.url || "/placeholder.svg"
                            }
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
          </div>
        </TransformWrapper>
      </div>
    </div>
  );
}
