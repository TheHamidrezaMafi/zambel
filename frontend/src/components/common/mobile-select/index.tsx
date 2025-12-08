import { useCallback, useState, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { FloatingLabelSelectProps } from './type';
import { BottomSheet } from '../bottom-sheet';

export const MobileSelect = ({
  control,
  name,
  label,
  options,
  Icon,
  rules,
  onSelect,
  externalOpen,
  onOpenChange,
}: FloatingLabelSelectProps) => {
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [isMobileSheetOpen, setIsMobileSheetOpen] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);
  const [isMobile, setIsMobile] = useState(true); // Default to true for SSR

  // Handle external open trigger
  useEffect(() => {
    if (externalOpen && isMobile) {
      setIsMobileSheetOpen(true);
      setSearchValue('');
      setShowAllCities(false);
    } else if (externalOpen && !isMobile) {
      setIsDropdownOpen(true);
      setShowAllCities(false);
    }
  }, [externalOpen, isMobile]);

  // Notify parent of open state changes
  useEffect(() => {
    if (onOpenChange) {
      onOpenChange(isMobileSheetOpen || isDropdownOpen);
    }
  }, [isMobileSheetOpen, isDropdownOpen, onOpenChange]);

  // Detect mobile
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };
    checkMobile();
    window.addEventListener('resize', checkMobile);
    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Filter options based on search
  const filterOptions = (search: string) => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  };

  // Handle click - open dropdown on desktop, bottom sheet on mobile
  const handleClick = () => {
    if (isMobile) {
      setIsMobileSheetOpen(true);
      setSearchValue('');
      setShowAllCities(false);
    } else {
      setIsDropdownOpen(!isDropdownOpen);
      setShowAllCities(false);
    }
  };

  // Close mobile sheet
  const closeMobileSheet = useCallback(() => {
    setIsMobileSheetOpen(false);
    setSearchValue('');
    setShowAllCities(false);
  }, []);

  // Close dropdown when clicking outside (desktop only)
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
        setShowAllCities(false);
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isDropdownOpen]);

  return (
    <div className="relative w-full h-14 cursor-pointer" ref={dropdownRef}>
      <Controller
        control={control}
        name={name}
        rules={rules}
        render={({ field, fieldState: { error } }) => {
          const filteredOptions = filterOptions(searchValue);
          const displayedOptions = showAllCities ? filteredOptions : filteredOptions.slice(0, 8);

          const handleSelectOption = (option: { value: string; label: string }) => {
            const selectedValue = {
              code: option.value,
              name: option.label,
            };
            field.onChange(selectedValue);
            setIsDropdownOpen(false);
            setIsMobileSheetOpen(false);
            setShowAllCities(false);
            setSearchValue('');
            // Call onSelect callback after a small delay to allow state to update
            if (onSelect) {
              setTimeout(() => onSelect(selectedValue), 100);
            }
          };

          return (
            <>
              {/* Main Button */}
              <button
                type="button"
                onClick={handleClick}
                className={`w-full rounded-xl flex items-center justify-between gap-2 font-semibold h-14 relative appearance-none bg-secondary/50 border border-border/50 py-2 px-4 leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary transition-all duration-300 overflow-hidden ${
                  error && '!border-destructive'
                } ${isDropdownOpen || isMobileSheetOpen ? 'ring-2 ring-primary/50 border-primary' : ''}`}
              >
                <span className={`truncate ${field?.value ? 'text-foreground' : 'text-transparent'}`}>
                  {field?.value
                    ? options?.find((option) => option.value === field.value.code)?.label
                    : 'placeholder'}
                </span>
                <svg
                  className={`w-5 h-5 flex-shrink-0 transition-transform text-muted-foreground ${isDropdownOpen || isMobileSheetOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>

              {/* Floating Label */}
              <label
                className={`absolute right-3 flex items-center gap-2 bg-transparent text-muted-foreground text-sm px-1 pointer-events-none transition-all duration-300 ${
                  error && '!text-destructive'
                } ${
                  isDropdownOpen || isMobileSheetOpen || field.value
                    ? '-top-2.5 text-xs !text-primary bg-card rounded-sm'
                    : 'top-1/2 -translate-y-1/2'
                }`}
              >
                {Icon && !field.value && !isDropdownOpen && !isMobileSheetOpen && (
                  <Icon width="20" className={error ? 'fill-destructive' : 'fill-primary'} />
                )}
                {label}
              </label>

              {error && (
                <p className="text-sm font-normal mt-0 mr-2 text-destructive text-right">
                  {error.message}
                </p>
              )}

              {/* Desktop Dropdown Menu */}
              {isDropdownOpen && !isMobile && (
                <div className="absolute top-full mt-2 w-full glass-strong rounded-xl shadow-lg z-50 max-h-[400px] overflow-hidden flex flex-col animate-slide-up">
                  {/* Search Input */}
                  <div className="p-3 border-b border-border/30 sticky top-0 bg-card/90 backdrop-blur-xl">
                    <input
                      placeholder="جستجو..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="block w-full rounded-lg font-medium h-10 relative appearance-none bg-secondary/50 border border-border/50 py-2 px-3 text-sm leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-all duration-300"
                      autoFocus
                    />
                  </div>

                  {/* Cities List */}
                  <div className="overflow-y-auto flex-1">
                    {displayedOptions.length > 0 ? (
                      displayedOptions.map((option, index) => (
                        <div
                          key={`${option.value}-${index}`}
                          className={`flex items-center gap-2 py-3 px-4 cursor-pointer hover:bg-accent transition-colors ${
                            field.value?.code === option.value ? 'bg-accent/50' : ''
                          }`}
                          onClick={() => handleSelectOption(option)}
                        >
                          {Icon && (
                            <Icon className="shrink-0 w-5 h-5 fill-muted-foreground" />
                          )}
                          <span className="text-sm md:text-base text-foreground">{option.label}</span>
                        </div>
                      ))
                    ) : (
                      <div className="py-8 text-center text-muted-foreground text-sm">
                        نتیجه‌ای یافت نشد
                      </div>
                    )}
                  </div>

                  {/* Show All Button */}
                  {!showAllCities && filteredOptions.length > 8 && (
                    <div className="border-t border-border p-3 bg-muted/20">
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          setShowAllCities(true);
                        }}
                        className="w-full bg-primary hover:bg-primary/90 text-primary-foreground rounded-lg py-2.5 text-sm md:text-base font-bold transition-colors"
                      >
                        نمایش همه ({filteredOptions.length})
                      </button>
                    </div>
                  )}
                </div>
              )}

              {/* Mobile Bottom Sheet */}
              <BottomSheet
                open={isMobileSheetOpen}
                onClose={closeMobileSheet}
                title={`انتخاب ${name === 'origin' ? 'مبدا' : 'مقصد'}`}
              >
                {/* Search Input */}
                <div className="bg-card pb-3 mb-2">
                  <input
                    placeholder="جستجو شهر..."
                    value={searchValue}
                    onChange={(e) => setSearchValue(e.target.value)}
                    className="block w-full rounded-xl font-medium h-12 relative appearance-none bg-secondary/50 border border-border/50 py-2 px-4 text-base leading-tight focus:outline-none focus:ring-2 focus:ring-primary/50 focus:border-primary text-foreground transition-all duration-300"
                  />
                </div>

                {/* Cities List */}
                <div className="flex flex-col pb-8">
                  {filteredOptions.length > 0 ? (
                    filteredOptions.map((option, index) => (
                      <div
                        key={`mobile-${option.value}-${index}`}
                        className={`flex items-center gap-3 py-4 px-2 cursor-pointer active:bg-accent/70 transition-colors border-b border-border/20 ${
                          field.value?.code === option.value ? 'bg-accent/50' : ''
                        }`}
                        onClick={() => handleSelectOption(option)}
                      >
                        {Icon && (
                          <Icon className="shrink-0 w-6 h-6 fill-muted-foreground" />
                        )}
                        <span className="text-base text-foreground font-medium">{option.label}</span>
                        {field.value?.code === option.value && (
                          <svg
                            className="w-5 h-5 text-primary mr-auto"
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                          </svg>
                        )}
                      </div>
                    ))
                  ) : (
                    <div className="py-12 text-center text-muted-foreground">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 text-muted-foreground/50"
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                      </svg>
                      <p className="text-base">نتیجه‌ای یافت نشد</p>
                    </div>
                  )}
                </div>
              </BottomSheet>
            </>
          );
        }}
      />
    </div>
  );
};
