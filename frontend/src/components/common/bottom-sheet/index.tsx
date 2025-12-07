import { ReactNode, useCallback, useEffect, useRef, useState } from 'react';
import { createPortal } from 'react-dom';

interface BottomSheetProps {
  children: ReactNode;
  open: boolean;
  onClose: () => void;
  title?: string;
}

export const BottomSheet: React.FC<BottomSheetProps> = ({
  children,
  open,
  onClose,
  title,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const contentRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const MIN_HEIGHT = 40;
  const MAX_HEIGHT = 92;
  const INITIAL_HEIGHT = 50;
  const DISMISS_THRESHOLD = 25;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle open/close animations
  useEffect(() => {
    if (open) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
      // Small delay to trigger animation
      requestAnimationFrame(() => {
        requestAnimationFrame(() => {
          setIsAnimating(true);
          setSheetHeight(INITIAL_HEIGHT);
        });
      });
    } else {
      setIsAnimating(false);
      setSheetHeight(0);
      const timer = setTimeout(() => {
        setIsVisible(false);
        document.body.style.overflow = '';
      }, 300);
      return () => clearTimeout(timer);
    }
  }, [open]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      document.body.style.overflow = '';
    };
  }, []);

  const handleDragStart = useCallback((clientY: number) => {
    setIsDragging(true);
    setStartY(clientY);
    setStartHeight(sheetHeight);
  }, [sheetHeight]);

  const handleDragMove = useCallback((clientY: number) => {
    if (!isDragging) return;

    const deltaY = startY - clientY;
    const viewportHeight = window.innerHeight;
    const deltaPercent = (deltaY / viewportHeight) * 100;
    const newHeight = Math.min(MAX_HEIGHT, Math.max(10, startHeight + deltaPercent));
    
    setSheetHeight(newHeight);
  }, [isDragging, startY, startHeight]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    if (sheetHeight < DISMISS_THRESHOLD) {
      onClose();
      return;
    }
    
    // Snap to nearest position
    if (sheetHeight < 45) {
      setSheetHeight(MIN_HEIGHT);
    } else if (sheetHeight > 75) {
      setSheetHeight(MAX_HEIGHT);
    } else {
      setSheetHeight(INITIAL_HEIGHT);
    }
  }, [sheetHeight, onClose]);

  // Mouse events
  const handleMouseDown = (e: React.MouseEvent) => {
    e.preventDefault();
    handleDragStart(e.clientY);
  };

  useEffect(() => {
    const handleMouseMove = (e: MouseEvent) => {
      handleDragMove(e.clientY);
    };

    const handleMouseUp = () => {
      handleDragEnd();
    };

    if (isDragging) {
      window.addEventListener('mousemove', handleMouseMove);
      window.addEventListener('mouseup', handleMouseUp);
    }

    return () => {
      window.removeEventListener('mousemove', handleMouseMove);
      window.removeEventListener('mouseup', handleMouseUp);
    };
  }, [isDragging, handleDragMove, handleDragEnd]);

  // Touch events
  const handleTouchStart = (e: React.TouchEvent) => {
    handleDragStart(e.touches[0].clientY);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    handleDragMove(e.touches[0].clientY);
  };

  const handleTouchEnd = () => {
    handleDragEnd();
  };

  // Close on backdrop click
  const handleBackdropClick = () => {
    onClose();
  };

  if (!mounted || !isVisible) return null;

  const content = (
    <div className="fixed inset-0 z-[9999]">
      {/* Backdrop */}
      <div
        className={`absolute inset-0 bg-black/70 backdrop-blur-sm transition-opacity duration-300 ${
          isAnimating ? 'opacity-100' : 'opacity-0'
        }`}
        onClick={handleBackdropClick}
      />

      {/* Bottom Sheet */}
      <div
        ref={sheetRef}
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl flex flex-col ${
          isDragging ? '' : 'transition-all duration-300 ease-out'
        }`}
        style={{
          height: `${sheetHeight}vh`,
          maxHeight: '92vh',
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
          {title && (
            <p className="text-base font-bold text-foreground mt-3">{title}</p>
          )}
        </div>

        {/* Content */}
        <div
          ref={contentRef}
          className="flex-1 overflow-y-auto overflow-x-hidden px-4 pb-4 min-h-0"
        >
          {children}
        </div>
      </div>
    </div>
  );

  // Use portal to render at the root level
  return createPortal(content, document.body);
};
