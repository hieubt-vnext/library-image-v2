"use client";

import { useState, useRef, useCallback, useMemo, useEffect } from "react";
import {
  TransformWrapper,
  TransformComponent,
  MiniMap,
  type ReactZoomPanPinchRef,
} from "react-zoom-pan-pinch";
import { ScrollArea, ScrollBar } from "@/components/ui/scroll-area";

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
    },
    [],
  );

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
      <div className="relative flex-col rounded-lg max-w-4xl mx-auto w-full flex items-center justify-center flex-1 overflow-hidden pb-32 min-h-0">
        <TransformWrapper
          ref={transformRef}
          initialScale={1} // reset initial scale to 1 (100%)
          minScale={1} // set minimum scale to 1 to prevent zooming below 100%
          maxScale={4}
          centerOnInit={true}
          wheel={{ step: 0.1 }}
          pinch={{ step: 5 }}
          doubleClick={{ mode: "reset" }}
          limitToBounds={true}
          centerZoomedOut={true}
          panning={{ disabled: false }}
          onTransformed={handleTransformChange}
        >
          <TransformComponent
            wrapperClass={`w-full h-full flex !h-screen`}
            contentClass="w-full h-full flex items-center justify-center"
          >
            <div className="flex items-center justify-center w-full h-full">
              <Image
                src={currentImage.url || "/placeholder.svg"}
                alt={currentImage.name}
                width={450}
                height={550}
                className="w-auto h-auto object-contain select-none mb-6"
                draggable={false}
              />
            </div>
          </TransformComponent>

          <div className="fixed bottom-0 left-0 right-0 bg-card/95 backdrop-blur-sm border-t py-2 z-10">
            <div className="max-w-4xl mx-auto">
              <ScrollArea className="w-full rounded-md" ref={scrollAreaRef}>
                <div className="flex w-max space-x-4 p-4 h-full">
                  {imageGallery.map((image) => (
                    <div
                      key={image.id}
                      data-image-id={image.id}
                      className={`relative flex-shrink-0 rounded-lg overflow-hidden border-2 transition-all ${
                        currentImageId === image.id
                          ? "border-none cursor-default"
                          : "border-none  cursor-pointer"
                      }`}
                      onClick={() => handleThumbnailClick(image.id)}
                    >
                      {currentImageId === image.id ? (
                        <>
                          {zoomScale === 1 ? (
                            <Image
                              src={image.thumbnail || image.url || "/placeholder.svg"}
                              alt={image.name}
                              width={120}
                              height={120}
                              className="w-full h-[85px] object-cover select-none border-4 border-[#1d4279]"
                              draggable={false}
                            />
                          ) : (
                            <MiniMap width={120} height={100} borderColor="#1d4279">
                              <Image
                                src={image.url || "/placeholder.svg"}
                                alt={image.name}
                                width={80}
                                height={100}
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
                <ScrollBar orientation="horizontal" />
              </ScrollArea>
            </div>
          </div>
        </TransformWrapper>
      </div>
    </div>
  );
}
