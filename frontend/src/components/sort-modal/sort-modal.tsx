import React, { useCallback, useRef, useEffect, useState } from "react";
import { SlideInModal } from "../common/slide-in-modal";
import { useRouter } from "next/router";
import { SortSchema } from "@/constants/sort-schema";
import { Arrow } from "../common/icons";
import SortRadio from "./sort-radio";
import SortChip from "./sort-chip";
import { omit } from "lodash";
import { SortModalProperties } from "./types";

const SortModal = ({ isLoading }: SortModalProperties) => {
  const router = useRouter();
  const open = router.query.sortModal === "true";
  const buttonRef = useRef<HTMLDivElement>(null);
  const popupRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(false);
  const [popupPosition, setPopupPosition] = useState({ top: 0, left: 0 });

  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  useEffect(() => {
    if (!isMobile && open && buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      const popupWidth = 350;
      let left = rect.left;
      
      // Ensure popup doesn't overflow viewport
      if (left + popupWidth > window.innerWidth - 16) {
        left = window.innerWidth - popupWidth - 16;
      }
      if (left < 16) left = 16;
      
      setPopupPosition({
        top: rect.bottom + 8,
        left: left,
      });
    }
  }, [open, isMobile]);

  const onCloseModal = useCallback(() => {
    const formattedQuery = omit(router.query, "sortModal");
    router.push({
      pathname: router.pathname,
      query: { ...formattedQuery },
    });
  }, [router]);

  return (
    <div ref={buttonRef} className="relative flex-1">
      <SortChip isDisabled={isLoading} />

      {/* Desktop Popup */}
      {!isMobile && open && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onCloseModal}
          />
          <div
            ref={popupRef}
            className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl w-[350px] overflow-hidden"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
            }}
          >
            <div className="p-5 border-b border-border">
              <p className="text-lg font-bold text-foreground">مرتب سازی</p>
            </div>
            <div className="p-4 space-y-3">
              {SortSchema.map((item) => (
                <SortRadio item={item} key={item.value} />
              ))}
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <SlideInModal open={open}>
          <div className="p-4 flex flex-col gap-4">
            <div className="flex items-center gap-4 pb-4">
              <button onClick={onCloseModal}>
                <Arrow />
              </button>
              <p className="text-base font-bold">مرتب سازی</p>
            </div>
            {SortSchema.map((item) => (
              <SortRadio item={item} key={item.value} />
            ))}
          </div>
        </SlideInModal>
      )}
    </div>
  );
};

export default SortModal;
