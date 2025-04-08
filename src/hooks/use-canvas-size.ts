import { useState, useEffect, RefObject } from 'react';
import { useIsMobile } from './use-mobile';

export interface CanvasSizeConfig {
  width: number;
  height: number;
}

export function useCanvasSize(
  containerRef: RefObject<HTMLElement>,
  defaultSize: CanvasSizeConfig = { width: 350, height: 350 }
): CanvasSizeConfig {
  const [canvasSize, setCanvasSize] = useState<CanvasSizeConfig>(defaultSize);
  const isMobile = useIsMobile();

  useEffect(() => {
    const updateCanvasSize = () => {
      const container = containerRef.current;
      if (!container) return;

      // For desktop, use a responsive width based on viewport
      // For mobile, use full width minus padding
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate maximum size that maintains aspect ratio and fits the viewport
      let maxWidth: number;
      
      if (isMobile) {
        // On mobile, use available width minus some padding
        maxWidth = viewportWidth - 40; 
      } else {
        // On desktop, scale based on viewport size with a maximum limit
        // Small desktop: up to 500px
        // Medium desktop: up to 700px
        // Large desktop: up to 900px
        if (viewportWidth < 1280) {
          maxWidth = Math.min(500, viewportWidth * 0.5);
        } else if (viewportWidth < 1920) {
          maxWidth = Math.min(700, viewportWidth * 0.4);
        } else {
          maxWidth = Math.min(900, viewportWidth * 0.35);
        }
      }
      
      // Ensure the width fits within the container
      const width = Math.min(container.clientWidth - 20, maxWidth);
      
      // Keep canvas square (1:1 aspect ratio)
      setCanvasSize({
        width,
        height: width
      });
    };

    updateCanvasSize();
    window.addEventListener('resize', updateCanvasSize);
    return () => window.removeEventListener('resize', updateCanvasSize);
  }, [containerRef, isMobile]);

  return canvasSize;
}
