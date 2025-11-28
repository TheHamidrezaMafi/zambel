import { useCallback, useState, useRef, useEffect } from 'react';
import { Controller } from 'react-hook-form';
import { FloatingLabelSelectProps } from './type';
import { Arrow } from '../icons';
import { SlideInModal } from '../slide-in-modal';
import { useRouter } from 'next/router';

export const MobileSelect = ({
  control,
  name,
  label,
  options,
  Icon,
  rules,
}: FloatingLabelSelectProps) => {
  const router = useRouter();
  const [isFocused, setIsFocused] = useState(false);
  const [searchValue, setSearchValue] = useState('');
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const [showAllCities, setShowAllCities] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const onOpenModal = useCallback(() => {
    setIsFocused(true);
    router.push({
      pathname: router.pathname,
      query: {
        ...router.query,
        step: name === 'origin' ? 'origin' : 'destination',
      },
    });
  }, [name, router]);
  
  const onCloseModal = useCallback(() => {
    const formattedQuery =
      name === 'destination'
        ? { ...router.query, step: 'calendar' }
        : { ...router.query, step: 'destination' };

    router.push({
      pathname: router.pathname,
      query: formattedQuery,
    });
    setIsFocused(false);
  }, [name, router]);
  
  const isOpen = router.query.step === name;
  
  // تابع فیلتر کردن گزینه‌ها بر اساس ورودی جستجو
  const filterOptions = (search: string) => {
    if (!search) return options;
    return options.filter((option) =>
      option.label.toLowerCase().includes(search.toLowerCase())
    );
  };
  
  const onCloseButtonClick = useCallback(() => {
    router.back();
    setIsFocused(false);
  }, [router]);

  // Toggle dropdown
  const toggleDropdown = () => {
    setIsDropdownOpen(!isDropdownOpen);
    setShowAllCities(false);
  };

  // Close dropdown when clicking outside
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
          
          return (
            <>
              <button
                type="button"
                onClick={toggleDropdown}
                className={`w-full rounded-xl flex items-center justify-between gap-2 font-semibold h-14 relative appearance-none bg-background border border-input py-2 px-4 leading-tight focus:outline-none focus:border-ring transition-all ${
                  error && '!border-destructive'
                } ${isDropdownOpen ? 'border-ring' : ''}`}
              >
                <span className={field?.value ? 'text-foreground' : 'text-transparent'}>
                  {field?.value
                    ? options?.find((option) => option.value === field.value.code)?.label
                    : 'placeholder'}
                </span>
                <svg
                  className={`w-5 h-5 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              
              <label
                className={`absolute right-3 flex items-center gap-3 top-4 bg-background text-muted-foreground text-sm px-2 pointer-events-none transition-all duration-300 ${
                  error && '!text-destructive'
                } ${
                  isDropdownOpen || field.value
                    ? '!-top-[12px] text-sm !text-primary'
                    : ''
                }`}
              >
                {Icon && !field.value && !isDropdownOpen && (
                  <Icon width="24" className={error ? 'fill-destructive' : 'fill-muted-foreground'} />
                )}
                {label}
              </label>
              
              {error && (
                <p className="text-sm font-normal mt-0 mr-2 text-destructive text-right">
                  {error.message}
                </p>
              )}

              {/* Dropdown Menu */}
              {isDropdownOpen && (
                <div className="absolute top-full mt-2 w-full bg-popover border border-border rounded-xl shadow-lg z-50 max-h-[400px] overflow-hidden flex flex-col">
                  {/* Search Input */}
                  <div className="p-3 border-b border-border sticky top-0 bg-popover">
                    <input
                      placeholder="جستجو..."
                      value={searchValue}
                      onChange={(e) => setSearchValue(e.target.value)}
                      className="block w-full rounded-lg font-medium h-10 relative appearance-none bg-muted border border-input py-2 px-3 text-sm leading-tight focus:outline-none focus:border-ring focus:bg-background text-foreground"
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
                          onClick={() => {
                            field.onChange({
                              code: option.value,
                              name: option.label,
                            });
                            setIsDropdownOpen(false);
                            setShowAllCities(false);
                            setSearchValue('');
                          }}
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

              {/* Mobile Side Panel (for backward compatibility or mobile-specific view) */}
              <SlideInModal open={isOpen}>
                <div className="sticky p-4 bg-background z-20 top-0">
                  <div className="flex mb-4 items-center gap-4">
                    <button
                      onClick={onCloseButtonClick}
                      className="text-muted-foreground hover:text-foreground"
                    >
                      <Arrow />
                    </button>
                    <p className="text-base font-bold text-foreground">
                      انتخاب {name === 'origin' ? 'مبدا' : 'مقصد'}
                    </p>
                  </div>
                  <input
                    placeholder="جستجو..."
                    onChange={(e) => {
                      setSearchValue(e.target.value);
                    }}
                    className={`block w-full rounded-lg font-semibold h-12 relative appearance-none bg-muted focus:border-2 focus:bg-background py-2 px-3 leading-tight focus:outline-none focus:border-ring text-foreground ${
                      error && '!border-destructive'
                    }`}
                    tabIndex={0}
                    onFocus={() => {
                      setSearchValue(
                        options?.find((option) => option.value === field.value)
                          ?.label ?? ''
                      );
                    }}
                  />
                </div>

                <div className="w-full pt-0 p-4 flex flex-col gap-2">
                  {filterOptions(searchValue)?.map((option, index) => (
                    <div
                      key={`${option.value}-${index}`}
                      className="flex items-center gap-1.5 py-2 cursor-pointer hover:bg-accent text-foreground"
                      onClick={() => {
                        field.onChange({
                          code: option.value,
                          name: option.label,
                        });
                        setIsFocused(false);
                        onCloseModal();
                        setSearchValue('');
                      }}
                    >
                      {Icon && (
                        <Icon className="shrink-0 scale-50 fill-muted-foreground" />
                      )}
                      {option.label}
                    </div>
                  ))}
                </div>
              </SlideInModal>
            </>
          );
        }}
      />
    </div>
  );
};
