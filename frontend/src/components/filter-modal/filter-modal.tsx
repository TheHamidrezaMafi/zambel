import React, { useCallback, useRef, useEffect, useState } from 'react';
import FilterChip from './filter-chip';
import { FilterModalProperties } from './types';
import { BottomSheet } from '../common/bottom-sheet';
import { useRouter } from 'next/router';
import { omit } from 'lodash';
import FilterCheckbox from './filter-checkbox';
import { useFilterCount } from '@/hooks/useFilters';
import { providerNameList } from '../flight-search/constants';

const FilterModal = ({
  allProviders,
  allAirlines,
  resultCount,
  isLoading,
}: FilterModalProperties) => {
  const router = useRouter();
  const open = router.query.filterModal === 'true';
  const filterCount = useFilterCount();
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
      const popupWidth = 400;
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
    const formattedQuery = omit(router.query, 'filterModal');
    router.push({
      pathname: router.pathname,
      query: { ...formattedQuery },
    });
  }, [router]);

  const getProviderName = (name: string) => {
    let providerName = name;

    providerNameList.find((item) => {
      if (name.startsWith(item.value)) {
        providerName = providerName.replace(item.value, item.label);
      }
    });

    return providerName;
  };

  return (
    <div ref={buttonRef} className="relative flex-1">
      <FilterChip isDisabled={isLoading} />
      
      {/* Desktop Popup */}
      {!isMobile && open && (
        <>
          <div 
            className="fixed inset-0 z-40"
            onClick={onCloseModal}
          />
          <div
            ref={popupRef}
            className="fixed z-50 bg-card border border-border rounded-2xl shadow-2xl w-[400px] max-h-[600px] overflow-hidden flex flex-col"
            style={{
              top: `${popupPosition.top}px`,
              left: `${popupPosition.left}px`,
            }}
          >
            <div className="p-5 border-b border-border">
              <p className="text-lg font-bold text-foreground">فیلترها</p>
            </div>
            <div className="flex-1 overflow-y-auto p-5 space-y-5">
              <div className="flex flex-col gap-3 pb-4 border-b border-border">
                <p className="text-base font-bold text-foreground">ایرلاین ها</p>
                <div className="flex gap-2 flex-col">
                  {allAirlines?.map((airline) => (
                    <FilterCheckbox
                      name="airlines"
                      key={airline}
                      item={airline}
                    />
                  ))}
                </div>
              </div>
              <div className="flex flex-col gap-3 pb-4">
                <p className="text-base font-bold text-foreground">تامین کننده ها</p>
                <div className="flex gap-2 flex-col">
                  {allProviders?.map((provider) => (
                    <FilterCheckbox
                      name="providers"
                      key={provider}
                      label={getProviderName(provider)}
                      item={provider}
                    />
                  ))}
                </div>
              </div>
            </div>
            <div className="p-5 border-t border-border bg-muted/5">
              <button
                onClick={onCloseModal}
                className="text-base bg-primary rounded-xl flex items-center justify-center h-12 px-6 text-gray-900 w-full transition-all hover:bg-primary/90 font-semibold shadow-md hover:shadow-lg"
              >
                {filterCount === 0 ? 'اعمال' : `مشاهده ${resultCount} نتیجه`}
              </button>
            </div>
          </div>
        </>
      )}

      {/* Mobile Bottom Sheet */}
      {isMobile && (
        <BottomSheet open={open} onClose={onCloseModal} title="فیلترها">
          <div className="flex flex-col gap-4 pb-4">
            <div className="flex flex-col gap-3 border-b border-border/30 pb-4">
              <p className="text-base font-bold text-foreground">ایرلاین ها</p>
              <div className="flex gap-2 flex-col">
                {allAirlines?.map((airline) => (
                  <FilterCheckbox
                    name="airlines"
                    key={airline}
                    item={airline}
                  />
                ))}
              </div>
            </div>
            <div className="flex flex-col gap-3 pb-4">
              <p className="text-base font-bold text-foreground">تامین کننده ها</p>
              <div className="flex gap-2 flex-col">
                {allProviders?.map((provider) => (
                  <FilterCheckbox
                    name="providers"
                    key={provider}
                    label={getProviderName(provider)}
                    item={provider}
                  />
                ))}
              </div>
            </div>
            <button
              onClick={onCloseModal}
              className="text-base bg-primary rounded-xl flex items-center justify-center h-12 px-6 text-primary-foreground w-full transition-all hover:bg-primary/90 font-bold shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {filterCount === 0 ? 'اعمال' : `مشاهده ${resultCount} نتیجه`}
            </button>
          </div>
        </BottomSheet>
      )}
    </div>
  );
};

export default FilterModal;
