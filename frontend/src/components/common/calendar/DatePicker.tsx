'use client';

import React, { useState, useEffect, useRef } from 'react';
import { HiCalendar } from 'react-icons/hi2';
import Calendar from './Calendar';

interface DatePickerProps {
  onDateSelect?: (dates: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  startDate?: Date | null;
  endDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  className?: string;
  placeholder?: string;
  disabled?: boolean;
  isRange?: boolean;
  open?: boolean;
  onOpenChange?: (open: boolean) => void;
}

const DatePicker: React.FC<DatePickerProps> = ({
  onDateSelect,
  startDate = null,
  endDate = null,
  minDate,
  maxDate,
  className = '',
  placeholder = 'انتخاب تاریخ',
  disabled = false,
  isRange = true,
  open,
  onOpenChange,
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [isMobile, setIsMobile] = useState(false);
  const inputRef = useRef<HTMLDivElement>(null);
  const [selectedDates, setSelectedDates] = useState<{
    startDate: Date | null;
    endDate: Date | null;
  }>({ startDate, endDate });

  // Detect mobile device
  useEffect(() => {
    const checkMobile = () => {
      setIsMobile(window.innerWidth < 768);
    };

    checkMobile();
    window.addEventListener('resize', checkMobile);

    return () => window.removeEventListener('resize', checkMobile);
  }, []);

  // Update selected dates when props change
  useEffect(() => {
    setSelectedDates({ startDate, endDate });
  }, [startDate, endDate]);

  // Sync controlled open prop
  useEffect(() => {
    if (typeof open === 'boolean') {
      setIsOpen(open);
    }
  }, [open]);

  const handleDateSelect = (dates: {
    startDate: Date | null;
    endDate: Date | null;
  }) => {
    if (JSON.stringify(dates) !== JSON.stringify(selectedDates)) {
      setSelectedDates(dates);
      if (onDateSelect) {
        onDateSelect(dates);
      }
      
      // Auto-close calendar when single date is selected (non-range mode)
      if (!isRange && dates.startDate) {
        setIsOpen(false);
        onOpenChange && onOpenChange(false);
      }
      
      // Auto-close calendar when both dates are selected in range mode
      if (isRange && dates.startDate && dates.endDate) {
        setIsOpen(false);
        onOpenChange && onOpenChange(false);
      }
    }
  };

  const formatDisplayDate = () => {
    if (selectedDates.startDate && selectedDates.endDate && isRange) {
      return `${selectedDates.startDate.toLocaleDateString(
        'fa-IR'
      )} - ${selectedDates.endDate.toLocaleDateString('fa-IR')}`;
    } else if (selectedDates.startDate) {
      return selectedDates.startDate.toLocaleDateString('fa-IR');
    }
    return placeholder;
  };

  return (
    <>
      {/* Input Field */}
      <div
        ref={inputRef}
        className={`
          flex items-center justify-between w-full px-4 py-3 border rounded-xl cursor-pointer transition-all duration-200
          ${
            disabled
              ? 'bg-muted cursor-not-allowed opacity-50'
              : 'bg-background hover:border-ring hover:shadow-sm'
          }
          ${isOpen ? 'border-ring ring-2 ring-ring/20 shadow-sm' : 'border-input'}
          ${className}
        `}
        onClick={() => {
          if (disabled) return;
          setIsOpen(true);
          onOpenChange && onOpenChange(true);
        }}
      >
        <span
          className={`text-sm ${
            selectedDates.startDate ? 'text-foreground' : 'text-muted-foreground'
          }`}
        >
          {formatDisplayDate()}
        </span>
        <HiCalendar className="w-5 h-5 text-muted-foreground" />
      </div>

      {/* Calendar Modal */}
      <Calendar
        isOpen={isOpen}
        isMobile={isMobile}
        isRange={isRange}
        startDate={selectedDates.startDate}
        endDate={selectedDates.endDate}
        minDate={minDate}
        maxDate={maxDate}
        onDateSelect={handleDateSelect}
        onClose={() => {
          setIsOpen(false);
          onOpenChange && onOpenChange(false);
        }}
        anchorRef={inputRef}
      />
    </>
  );
};

export default DatePicker;
