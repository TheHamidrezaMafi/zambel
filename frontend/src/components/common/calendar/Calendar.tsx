'use client';

import React, { useState, useRef, useEffect, useMemo, useCallback } from 'react';
import { createPortal } from 'react-dom';
import moment from 'moment-jalaali';
import 'moment-hijri';

interface CalendarProps {
  onDateSelect?: (dates: {
    startDate: Date | null;
    endDate: Date | null;
  }) => void;
  onClose?: () => void;
  startDate?: Date | null;
  endDate?: Date | null;
  minDate?: Date;
  maxDate?: Date;
  isOpen?: boolean;
  isMobile?: boolean;
  isRange?: boolean;
  // For desktop anchored positioning under input field
  anchorRef?: React.RefObject<HTMLElement | null>;
  // New: holiday configuration
  highlightFridays?: boolean; // default true
  enableFixedIranHolidays?: boolean; // default true
  customHolidayJalali?: string[]; // e.g. ['1403/01/01']
  hijriOffsetDays?: number; // adjust lunar calculation drift (-2..+2)
  hijriToleranceDays?: number; // search window +/- days (default 1)
}

// Persian month names
const persianMonths = [
  'فروردین',
  'اردیبهشت',
  'خرداد',
  'تیر',
  'مرداد',
  'شهریور',
  'مهر',
  'آبان',
  'آذر',
  'دی',
  'بهمن',
  'اسفند',
];

// Persian day names
const persianDays = ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'];

// Fixed Iranian public holidays (Jalali months: 1..12)
// Note: Islamic lunar holidays (تاسو‌عا/عاشورا، عید فطر، قربان، غدیر، اربعین، 28 صفر، 30 صفر، ...)
// در مجموعه زیر به صورت مجزا پوشش داده شده‌اند
const FIXED_IRAN_HOLIDAYS: Record<number, number[]> = {
  1: [1, 2, 3, 4, 12, 13], // نوروز + روز طبیعت
  3: [14, 15], // خرداد
  11: [22], // 22 بهمن
  12: [29], // 29 اسفند
};

// Lunar (Hijri) holidays commonly observed in Iran (month: 1..12, day list)
// منبع: تقویم رسمی ایران (ممکن است برخی سال‌ها 1 روز اختلاف مشاهده شود)
const LUNAR_IRAN_HOLIDAYS: Record<number, number[]> = {
  1: [9, 10], // محرم: تاسوعا و عاشورا
  2: [20, 28, 29, 30], // صفر: اربعین، رحلت پیامبر(ص) و شهادت امام حسن(ع)، شهادت امام رضا(ع) (در برخی سال‌ها 29 صفر)
  3: [17], // ربیع‌الاول: میلاد پیامبر(ص) و امام صادق(ع)
  7: [13], // رجب: ولادت امام علی(ع)
  8: [3, 15], // شعبان: ولادت امام حسین(ع)، نیمه شعبان
  9: [21], // رمضان: شهادت امام علی(ع)
  10: [1], // شوال: عید فطر
  12: [10, 18], // ذوالحجه: قربان، غدیر
};

// Default extra Jalali holiday dates to cover known lunar exceptions (near-term)
const DEFAULT_EXTRA_HOLIDAYS_JALALI = new Set<string>([]);

// Convert Gregorian to Jalali date using moment-jalaali
const gregorianToJalali = (date: Date) => {
  const m = moment(date);
  return {
    year: m.jYear(),
    month: m.jMonth() + 1,
    day: m.jDate(),
  };
};

// Format Persian date
const formatPersianDate = (date: Date) => {
  const jalali = gregorianToJalali(date);
  return `${jalali.day} ${persianMonths[jalali.month - 1]}`;
};

// Get Persian month name
const getPersianMonthName = (date: Date) => {
  const jalali = gregorianToJalali(date);
  return persianMonths[jalali.month - 1];
};

// Build holiday set for a Gregorian range [start,end]
const buildIranHolidayJalaliSet = (
  start: moment.Moment,
  end: moment.Moment,
  options: {
    enableFixedIranHolidays: boolean;
    customHolidayJalali: string[];
    hijriOffsetDays: number;
    hijriToleranceDays: number;
  }
): Set<string> => {
  const {
    enableFixedIranHolidays,
    customHolidayJalali,
    hijriOffsetDays,
    hijriToleranceDays,
  } = options;

  const set = new Set<string>();

  // Helper to add jYYYY/jMM/jDD
  const addKey = (m: moment.Moment) => {
    const key = `${m.jYear().toString().padStart(4, '0')}/${(m.jMonth() + 1)
      .toString()
      .padStart(2, '0')}/${m.jDate().toString().padStart(2, '0')}`;
    set.add(key);
  };

  // 1) Fixed Jalali holidays per each Jalali year in range
  if (enableFixedIranHolidays) {
    const startJYear = start.jYear();
    const endJYear = end.jYear();
    for (let jy = startJYear; jy <= endJYear; jy++) {
      for (const [jMonthStr, days] of Object.entries(FIXED_IRAN_HOLIDAYS)) {
        const jm = Number(jMonthStr);
        for (const d of days) {
          const m = moment(`${jy}/${jm}/${d}`, 'jYYYY/jM/jD');
          addKey(m);
        }
      }
    }
  }

  // 2) Lunar: iterate Hijri years covering [start,end]
  const startHY = Number(start.format('iYYYY'));
  const endHY = Number(end.format('iYYYY'));
  const tol = Math.max(0, Math.min(3, hijriToleranceDays));
  for (let hy = startHY; hy <= endHY; hy++) {
    for (const [hMonthStr, days] of Object.entries(LUNAR_IRAN_HOLIDAYS)) {
      const hm = Number(hMonthStr);
      for (const d of days) {
        for (let delta = -tol; delta <= tol; delta++) {
          const g = moment(`${hy}-${hm}-${d}`, 'iYYYY-iM-iD').add(
            hijriOffsetDays + delta,
            'day'
          );
          if (g.isValid() && g.isBetween(start, end, 'day', '[]')) {
            addKey(g);
          }
        }
      }
    }
  }

  // 3) Add defaults and custom
  DEFAULT_EXTRA_HOLIDAYS_JALALI.forEach((k) => set.add(k));
  (customHolidayJalali || []).forEach((k) => set.add(k));

  return set;
};

const Calendar: React.FC<CalendarProps> = ({
  onDateSelect,
  onClose,
  startDate = null,
  endDate = null,
  minDate,
  maxDate,
  isOpen = false,
  isMobile = false,
  isRange = true,
  anchorRef,
  highlightFridays = true,
  enableFixedIranHolidays = true,
  customHolidayJalali = [],
  hijriOffsetDays = 1,
  hijriToleranceDays = 3,
}) => {
  const today = useMemo(() => moment(), []);
  const oneYearFromNow = useMemo(() => moment().add(1, 'year'), []);
  const [currentMonth, setCurrentMonth] = useState(moment());
  const [selectedStartDate, setSelectedStartDate] =
    useState<moment.Moment | null>(startDate ? moment(startDate) : null);
  const [selectedEndDate, setSelectedEndDate] = useState<moment.Moment | null>(
    endDate ? moment(endDate) : null
  );
  const [isSelectingEndDate, setIsSelectingEndDate] = useState(false);
  const calendarRef = useRef<HTMLDivElement>(null);
  const [anchorStyle, setAnchorStyle] = useState<{
    top: number;
    left: number;
  } | null>(null);

  const isAnchoredDesktop = !isMobile && Boolean(anchorRef?.current);

  // Ensure dynamic switching between single and range modes behaves correctly
  useEffect(() => {
    if (!isRange) {
      setIsSelectingEndDate(false);
      setSelectedEndDate(null);
    }
  }, [isRange]);

  useEffect(() => {
    if (!isAnchoredDesktop || !anchorRef?.current || !isOpen) {
      setAnchorStyle(null);
      return;
    }

    const updatePosition = () => {
      const rect = anchorRef.current!.getBoundingClientRect();
      const calendarEl = calendarRef.current;
      const calendarWidth = calendarEl ? calendarEl.offsetWidth : 700; // Use actual width or fallback
      const viewportWidth = window.innerWidth;
      const viewportHeight = window.innerHeight;
      
      // Calculate centered position relative to input
      let left = rect.left + (rect.width / 2) - (calendarWidth / 2);
      
      // Ensure calendar doesn't overflow viewport horizontally
      const paddingX = 16;
      if (left < paddingX) left = paddingX;
      if (left + calendarWidth > viewportWidth - paddingX) {
        left = viewportWidth - calendarWidth - paddingX;
      }
      
      // Position below input with spacing, or above if no room below
      let top = rect.bottom + 12;
      const calendarHeight = calendarEl ? calendarEl.offsetHeight : 500;
      
      if (top + calendarHeight > viewportHeight - 20) {
        // Not enough space below, try above
        const topAbove = rect.top - calendarHeight - 12;
        if (topAbove > 20) {
          top = topAbove;
        }
      }
      
      setAnchorStyle({ 
        top: top, 
        left: left 
      });
    };

    // Small delay to ensure calendar has rendered with proper dimensions
    const timeoutId = setTimeout(updatePosition, 10);
    window.addEventListener('resize', updatePosition);
    window.addEventListener('scroll', updatePosition, true);
    return () => {
      clearTimeout(timeoutId);
      window.removeEventListener('resize', updatePosition);
      window.removeEventListener('scroll', updatePosition, true);
    };
  }, [anchorRef, isOpen, isAnchoredDesktop]);

  useEffect(() => {
    if (
      onDateSelect &&
      (selectedStartDate?.toDate() !== startDate ||
        selectedEndDate?.toDate() !== endDate)
    ) {
      onDateSelect({
        startDate: selectedStartDate?.toDate() || null,
        endDate: selectedEndDate?.toDate() || null,
      });
    }
  }, [selectedStartDate, selectedEndDate, onDateSelect, startDate, endDate]);

  const getDaysInMonth = (date: moment.Moment): (moment.Moment | null)[] => {
    const days: (moment.Moment | null)[] = [];

    // Get the Persian month information
    const jalaliYear = date.jYear();
    const jalaliMonth = date.jMonth() + 1; // jMonth() returns 0-11, so add 1

    // Get the first day of the Persian month
    const firstDayOfMonth = moment(
      `${jalaliYear}/${jalaliMonth}/1`,
      'jYYYY/jMM/jDD'
    );

    // Get the last day of the Persian month
    const lastDayOfMonth = moment(
      `${jalaliYear}/${jalaliMonth}/1`,
      'jYYYY/jMM/jDD'
    ).endOf('jMonth');

    // Get the day of week for the first day (0=Saturday, 1=Sunday, ..., 6=Friday)
    const firstDayOfWeek = firstDayOfMonth.day();

    // Map to our persianDays array: ['ش', 'ی', 'د', 'س', 'چ', 'پ', 'ج'] (Saturday to Friday)
    // moment days: 0=Sunday, 1=Monday, 2=Tuesday, 3=Wednesday, 4=Thursday, 5=Friday, 6=Saturday
    // We need to map: Sunday(0) -> 1, Monday(1) -> 2, Tuesday(2) -> 3, Wednesday(3) -> 4, Thursday(4) -> 5, Friday(5) -> 6, Saturday(6) -> 0
    const persianDayIndex = (firstDayOfWeek + 1) % 7; // This maps Sunday(0) to 1, Monday(1) to 2, etc., Saturday(6) to 0

    // Calculate padding days needed to align with Persian week start (Saturday)
    let paddingDays = persianDayIndex; // 0=Saturday (no padding), 1=Sunday (1 padding), etc.

    // Add empty slots for padding days from previous month (but don't add actual dates)
    for (let i = 0; i < paddingDays; i++) {
      days.push(null); // null represents empty slot
    }

    // Add days of the current Persian month (from 1 to last day)
    const current = firstDayOfMonth.clone();
    while (current.isSameOrBefore(lastDayOfMonth)) {
      days.push(current.clone());
      current.add(1, 'day');
    }

    // Don't add extra empty slots at the end - let the grid handle the layout naturally
    return days;
  };

  const nextMonth = currentMonth.clone().add(1, 'month');

  // Precompute holiday set for visible range
  const holidaySet = useMemo(() => {
    // For mobile we render 13 months; to future-proof, پوشش 24 ماه
    const rangeStart = currentMonth.clone().startOf('month');
    const rangeEnd = currentMonth.clone().add(24, 'months').endOf('month');
    return buildIranHolidayJalaliSet(rangeStart, rangeEnd, {
      enableFixedIranHolidays,
      customHolidayJalali,
      hijriOffsetDays,
      hijriToleranceDays,
    });
  }, [
    currentMonth,
    enableFixedIranHolidays,
    customHolidayJalali,
    hijriOffsetDays,
    hijriToleranceDays,
  ]);

  const currentMonthDays = getDaysInMonth(currentMonth);
  const nextMonthDays = getDaysInMonth(nextMonth);

  // Check if date is official holiday by precomputed set (plus Fridays if enabled)
  const isOfficialHoliday = (date: moment.Moment) => {
    if (highlightFridays && date.day() === 5) return true;
    const key = `${date.jYear().toString().padStart(4, '0')}/${(
      date.jMonth() + 1
    )
      .toString()
      .padStart(2, '0')}/${date.jDate().toString().padStart(2, '0')}`;
    if (holidaySet.has(key)) return true;

    // Fallback 1: fixed Jalali of this exact day (in case خارج از بازه precompute)
    const jm = date.jMonth() + 1;
    const jd = date.jDate();
    const monthFixed = FIXED_IRAN_HOLIDAYS[jm] || [];
    if (monthFixed.includes(jd)) return true;

    // Fallback 2: check lunar directly on the given day with tolerance
    const tol = Math.max(0, Math.min(3, hijriToleranceDays));
    for (let delta = -tol; delta <= tol; delta++) {
      const hm: any = date
        .clone()
        .add((hijriOffsetDays || 0) + delta, 'day') as any;
      const hMonth = Number(hm.format('iM'));
      const hDay = Number(hm.format('iD'));
      const monthLunar = LUNAR_IRAN_HOLIDAYS[hMonth] || [];
      if (monthLunar.includes(hDay)) return true;
    }

    // Fallback 3: defaults/custom
    if (DEFAULT_EXTRA_HOLIDAYS_JALALI.has(key)) return true;
    if (customHolidayJalali?.includes(key)) return true;

    return false;
  };

  // Check if date belongs to the current Persian month being displayed
  const isCurrentPersianMonth = (
    date: moment.Moment,
    currentMonth: moment.Moment
  ) => {
    const dateJalali = gregorianToJalali(date.toDate());
    const currentMonthJalali = gregorianToJalali(currentMonth.toDate());

    return (
      dateJalali.year === currentMonthJalali.year &&
      dateJalali.month === currentMonthJalali.month
    );
  };

  const isDateSelectable = (date: moment.Moment) => {
    // Don't allow dates before today
    if (date.isBefore(today, 'day')) return false;
    // Don't allow dates after one year from now
    if (date.isAfter(oneYearFromNow, 'day')) return false;
    // Check custom min/max dates if provided
    if (minDate && date.isBefore(moment(minDate), 'day')) return false;
    if (maxDate && date.isAfter(moment(maxDate), 'day')) return false;
    return true;
  };

  // Production selectable rule

  const isDateInRange = (date: moment.Moment) => {
    if (!selectedStartDate || !selectedEndDate) return false;
    return date.isBetween(selectedStartDate, selectedEndDate, 'day', '[]');
  };

  const isDateSelected = (date: moment.Moment): boolean => {
    return !!(
      (selectedStartDate && date.isSame(selectedStartDate, 'day')) ||
      (selectedEndDate && date.isSame(selectedEndDate, 'day'))
    );
  };

  const handleDateClick = (date: moment.Moment) => {
    if (!isDateSelectable(date)) return;

    // Single date mode - auto close after selection
    if (!isRange) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      // Trigger onClose to auto-dismiss calendar
      setTimeout(() => {
        if (onClose) onClose();
      }, 200); // Small delay for visual feedback
      return;
    }

    // Range mode with two explicit states:
    // 1) Default state (isSelectingEndDate === false)
    //    - If a full range exists (selectedEndDate), clicking a new date should
    //      set start to clicked date, clear end, and ENTER selecting-end mode
    //      to allow immediate picking of the new end date.
    //    - Otherwise (no end chosen yet), only change start and stay in default mode.
    if (!isSelectingEndDate) {
      if (selectedEndDate) {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
        setIsSelectingEndDate(true);
      } else {
        setSelectedStartDate(date);
        setSelectedEndDate(null);
      }
      return;
    }

    // 2) Selecting end date state (isSelectingEndDate === true):
    //    - If start not set: set start and keep selecting end
    //    - If clicked date after start: set end and exit selecting mode (and auto-close)
    //    - If clicked date before/equal start: replace start and keep selecting end
    if (!selectedStartDate) {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
      return;
    }

    if (date.isAfter(selectedStartDate)) {
      setSelectedEndDate(date);
      setIsSelectingEndDate(false);
      // Auto-close after both dates selected in range mode
      setTimeout(() => {
        if (onClose) onClose();
      }, 200);
    } else {
      setSelectedStartDate(date);
      setSelectedEndDate(null);
    }
  };

  const navigateMonth = (direction: 'prev' | 'next') => {
    setCurrentMonth((prev) =>
      direction === 'prev'
        ? prev.clone().subtract(1, 'month')
        : prev.clone().add(1, 'month')
    );
  };

  const goToToday = () => {
    setCurrentMonth(moment());
  };

  const clearSelection = () => {
    setSelectedStartDate(null);
    setSelectedEndDate(null);
    setIsSelectingEndDate(false);
  };

  const handleConfirm = () => {
    if (onClose) {
      onClose();
    }
  };

  if (!isOpen) return null;

  // Mobile Bottom Sheet View
  if (isMobile) {
    return (
      <MobileCalendarSheet
        isOpen={isOpen}
        onClose={onClose}
        isRange={isRange}
        selectedStartDate={selectedStartDate}
        selectedEndDate={selectedEndDate}
        isSelectingEndDate={isSelectingEndDate}
        setIsSelectingEndDate={setIsSelectingEndDate}
        setSelectedEndDate={setSelectedEndDate}
        currentMonth={currentMonth}
        today={today}
        getDaysInMonth={getDaysInMonth}
        isDateSelectable={isDateSelectable}
        isDateInRange={isDateInRange}
        isDateSelected={isDateSelected}
        isOfficialHoliday={isOfficialHoliday}
        handleDateClick={handleDateClick}
        handleConfirm={handleConfirm}
        formatPersianDate={formatPersianDate}
        getPersianMonthName={getPersianMonthName}
        isCurrentPersianMonth={isCurrentPersianMonth}
        gregorianToJalali={gregorianToJalali}
        persianDays={persianDays}
      />
    );
  }

  // Desktop View - render in portal for proper z-index
  if (!isOpen) return null;

  const desktopContent = (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 bg-black/30"
        style={{ zIndex: 9998 }}
        onClick={() => onClose && onClose()}
      />
      
      {/* Calendar popup - positioned near the input */}
      <div
        ref={calendarRef}
        className="fixed bg-white select-none rounded-xl shadow-2xl border border-border animate-in fade-in-0 zoom-in-95 duration-200"
        style={{
          zIndex: 9999,
          top: anchorStyle?.top ?? '50%',
          left: anchorStyle?.left ?? '50%',
          transform: anchorStyle ? 'none' : 'translate(-50%, -50%)',
          maxWidth: '700px',
          maxHeight: 'calc(100vh - 40px)',
          overflow: 'auto',
        }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-4 py-2 border-b border-gray-200">
          <div className="flex items-center space-x-4 space-x-reverse">
            <button
              type="button"
              onClick={goToToday}
              className="text-sm text-blue-600 hover:text-blue-800 transition-colors"
            >
              برو به امروز
            </button>
          </div>

          <div className="flex items-center space-x-2 space-x-reverse">
            <span className="text-lg text-blue-600">📅</span>
            <span className="text-sm text-gray-600">تقویم میلادی</span>
          </div>
        </div>

        {/* Calendar Content */}
        <div className="p-4">
          {/* Desktop Layout */}
          <div className="grid grid-cols-2 gap-4">
              {/* Current Month */}
              <div>
                <div className="grid grid-cols-3 items-center mb-4">
                  <button
                    type="button"
                    onClick={() => navigateMonth('prev')}
                    className="justify-self-start p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-lg">‹</span>
                  </button>
                  <h3 className="justify-self-center text-center text-lg font-semibold text-gray-900">
                    {getPersianMonthName(currentMonth.toDate())}
                  </h3>
                  {/* Placeholder to keep title perfectly centered */}
                  <button
                    type="button"
                    className="invisible justify-self-end p-2"
                  >
                    ​
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {persianDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {currentMonthDays.map((day, index) => {
                    // If day is null, render empty div
                    if (day === null) {
                      return <div key={index} className="h-10 w-10" />;
                    }

                    const isCurrentMonth = isCurrentPersianMonth(
                      day,
                      currentMonth
                    );
                    const isSelectable = isDateSelectable(day);
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isTodayDate = day.isSame(today, 'day');
                    const isOfficialHolidayDay = isOfficialHoliday(day);

                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleDateClick(day)}
                        disabled={!isSelectable}
                        className={`
                          relative h-10 w-10 rounded-lg text-sm font-medium transition-all
                          ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                          ${isOfficialHolidayDay ? 'text-red-500' : ''}
                          ${
                            !isSelectable
                              ? 'cursor-not-allowed opacity-30'
                              : 'cursor-pointer hover:bg-orange-50'
                          }
                          ${
                            isSelected
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : ''
                          }
                          ${isInRange ? 'bg-orange-100' : ''}
                          ${isTodayDate ? 'ring-2 ring-orange-200' : ''}
                        `}
                      >
                        {gregorianToJalali(day.toDate()).day}
                      </button>
                    );
                  })}
                </div>
              </div>

              {/* Next Month */}
              <div>
                <div className="grid grid-cols-3 items-center mb-4">
                  {/* Placeholder to keep title perfectly centered */}
                  <button
                    type="button"
                    className="invisible justify-self-start p-2"
                  >
                    ​
                  </button>
                  <h3 className="justify-self-center text-center text-lg font-semibold text-gray-900">
                    {getPersianMonthName(nextMonth.toDate())}
                  </h3>
                  <button
                    type="button"
                    onClick={() => navigateMonth('next')}
                    className="justify-self-end p-2 hover:bg-gray-100 rounded-full transition-colors"
                  >
                    <span className="text-lg">›</span>
                  </button>
                </div>

                {/* Days of Week */}
                <div className="grid grid-cols-7 gap-1 mb-2">
                  {persianDays.map((day) => (
                    <div
                      key={day}
                      className="text-center text-sm font-medium text-gray-500 py-2"
                    >
                      {day}
                    </div>
                  ))}
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {nextMonthDays.map((day, index) => {
                    // If day is null, render empty div
                    if (day === null) {
                      return <div key={index} className="h-10 w-10" />;
                    }

                    const isCurrentMonth = isCurrentPersianMonth(
                      day,
                      nextMonth
                    );
                    const isSelectable = isDateSelectable(day);
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isTodayDate = day.isSame(today, 'day');
                    const isOfficialHolidayDay = isOfficialHoliday(day);

                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleDateClick(day)}
                        disabled={!isSelectable}
                        className={`
                          relative h-10 w-10 rounded-lg text-sm font-medium transition-all
                          ${!isCurrentMonth ? 'text-gray-300' : 'text-gray-900'}
                          ${isOfficialHolidayDay ? 'text-red-500' : ''}
                          ${
                            !isSelectable
                              ? 'cursor-not-allowed opacity-30'
                              : 'cursor-pointer hover:bg-orange-50'
                          }
                          ${
                            isSelected
                              ? 'bg-orange-500 text-white hover:bg-orange-600'
                              : ''
                          }
                          ${isInRange ? 'bg-orange-100' : ''}
                          ${isTodayDate ? 'ring-2 ring-orange-200' : ''}
                        `}
                      >
                        {gregorianToJalali(day.toDate()).day}
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
        </div>

        <div className="px-4 py-2 border-t border-gray-200">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-4 space-x-reverse">
                {!isRange ? (
                  <div className="text-sm min-w-[110px]">
                    <span className="text-gray-600">رفت:</span>
                    <span className="mr-2 text-gray-900">
                      {selectedStartDate
                        ? formatPersianDate(selectedStartDate.toDate())
                        : 'انتخاب کنید'}
                    </span>
                  </div>
                ) : isSelectingEndDate || selectedEndDate ? (
                  <>
                    <div className="text-sm min-w-[110px]">
                      <span className="text-gray-600">رفت:</span>
                      <span className="mr-2 text-gray-900">
                        {selectedStartDate
                          ? formatPersianDate(selectedStartDate.toDate())
                          : 'انتخاب کنید'}
                      </span>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsSelectingEndDate(true)}
                      className="text-sm min-w-[120px]"
                    >
                      <span className="text-gray-600">برگشت:</span>
                      <span
                        className={`mr-2 ${
                          selectedEndDate ? 'text-gray-900' : 'text-blue-600'
                        }`}
                      >
                        {selectedEndDate
                          ? formatPersianDate(selectedEndDate.toDate())
                          : '-'}
                      </span>
                    </button>

                    <button
                      type="button"
                      aria-label="لغو تاریخ برگشت"
                      onClick={() => {
                        setIsSelectingEndDate(false);
                        setSelectedEndDate(null);
                      }}
                      className="w-6 h-6 rounded-full border border-gray-200 bg-gray-50 text-gray-500 flex items-center justify-center"
                    >
                      ×
                    </button>
                  </>
                ) : (
                  <>
                    <div className="text-sm min-w-[110px]">
                      <span className="text-gray-600">رفت:</span>
                      <span className="mr-2 text-gray-900">
                        {selectedStartDate
                          ? formatPersianDate(selectedStartDate.toDate())
                          : 'انتخاب کنید'}
                      </span>
                    </div>

                    <button
                      type="button"
                      className="text-blue-600 text-sm font-medium hover:text-blue-700"
                      onClick={() => setIsSelectingEndDate(true)}
                    >
                      + افزودن تاریخ برگشت
                    </button>
                  </>
                )}
              </div>

              <div className="flex items-center space-x-2 space-x-reverse">
                <button
                  onClick={handleConfirm}
                  className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors disabled:opacity-60 disabled:cursor-not-allowed"
                  disabled={!selectedStartDate}
                >
                  تایید
                </button>
              </div>
            </div>
          </div>
      </div>
    </>
  );

  // Render desktop calendar in portal for proper z-index stacking
  if (typeof window !== 'undefined') {
    return createPortal(desktopContent, document.body);
  }
  
  return desktopContent;
};

// Mobile Calendar Bottom Sheet Component
interface MobileCalendarSheetProps {
  isOpen: boolean;
  onClose?: () => void;
  isRange: boolean;
  selectedStartDate: moment.Moment | null;
  selectedEndDate: moment.Moment | null;
  isSelectingEndDate: boolean;
  setIsSelectingEndDate: (value: boolean) => void;
  setSelectedEndDate: (value: moment.Moment | null) => void;
  currentMonth: moment.Moment;
  today: moment.Moment;
  getDaysInMonth: (date: moment.Moment) => (moment.Moment | null)[];
  isDateSelectable: (date: moment.Moment) => boolean;
  isDateInRange: (date: moment.Moment) => boolean;
  isDateSelected: (date: moment.Moment) => boolean;
  isOfficialHoliday: (date: moment.Moment) => boolean;
  handleDateClick: (date: moment.Moment) => void;
  handleConfirm: () => void;
  formatPersianDate: (date: Date) => string;
  getPersianMonthName: (date: Date) => string;
  isCurrentPersianMonth: (date: moment.Moment, currentMonth: moment.Moment) => boolean;
  gregorianToJalali: (date: Date) => { year: number; month: number; day: number };
  persianDays: string[];
}

const MobileCalendarSheet: React.FC<MobileCalendarSheetProps> = ({
  isOpen,
  onClose,
  isRange,
  selectedStartDate,
  selectedEndDate,
  isSelectingEndDate,
  setIsSelectingEndDate,
  setSelectedEndDate,
  currentMonth,
  today,
  getDaysInMonth,
  isDateSelectable,
  isDateInRange,
  isDateSelected,
  isOfficialHoliday,
  handleDateClick,
  handleConfirm,
  formatPersianDate,
  getPersianMonthName,
  isCurrentPersianMonth,
  gregorianToJalali,
  persianDays,
}) => {
  const sheetRef = useRef<HTMLDivElement>(null);
  const [sheetHeight, setSheetHeight] = useState(50);
  const [isDragging, setIsDragging] = useState(false);
  const [startY, setStartY] = useState(0);
  const [startHeight, setStartHeight] = useState(50);
  const [isAnimating, setIsAnimating] = useState(false);
  const [isVisible, setIsVisible] = useState(false);
  const [mounted, setMounted] = useState(false);

  const MIN_HEIGHT = 50;
  const MAX_HEIGHT = 95;
  const INITIAL_HEIGHT = 80;
  const DISMISS_THRESHOLD = 30;

  // Handle mounting for portal
  useEffect(() => {
    setMounted(true);
    return () => setMounted(false);
  }, []);

  // Handle open/close animations
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      setIsVisible(true);
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
  }, [isOpen]);

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
    const newHeight = Math.min(MAX_HEIGHT, Math.max(15, startHeight + deltaPercent));
    
    setSheetHeight(newHeight);
  }, [isDragging, startY, startHeight]);

  const handleDragEnd = useCallback(() => {
    setIsDragging(false);
    
    if (sheetHeight < DISMISS_THRESHOLD) {
      onClose && onClose();
      return;
    }
    
    if (sheetHeight < 45) {
      setSheetHeight(MIN_HEIGHT);
    } else if (sheetHeight > 80) {
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

  const handleBackdropClick = () => {
    onClose && onClose();
  };

  if (!mounted || !isVisible) return null;

  return createPortal(
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
        className={`absolute bottom-0 left-0 right-0 bg-card rounded-t-3xl shadow-2xl flex flex-col overflow-hidden ${
          isDragging ? '' : 'transition-all duration-300 ease-out'
        }`}
        style={{
          height: `${sheetHeight}vh`,
          maxHeight: '95vh',
          transform: isAnimating ? 'translateY(0)' : 'translateY(100%)',
        }}
      >
        {/* Drag Handle */}
        <div
          className="flex-shrink-0 flex flex-col items-center pt-3 pb-2 cursor-grab active:cursor-grabbing touch-none select-none border-b border-border/30"
          onMouseDown={handleMouseDown}
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          <div className="w-12 h-1.5 bg-muted-foreground/40 rounded-full" />
          <p className="text-base font-bold text-foreground mt-3">انتخاب تاریخ</p>
        </div>

        {/* Days of Week Header - Sticky */}
        <div className="flex-shrink-0 bg-card z-10 border-b border-border/20 px-4 py-2">
          <div className="grid grid-cols-7 gap-1">
            {persianDays.map((day) => (
              <div
                key={day}
                className="text-center text-sm font-medium text-muted-foreground py-1"
              >
                {day}
              </div>
            ))}
          </div>
        </div>

        {/* Scrollable Months Container */}
        <div className="flex-1 overflow-y-auto overflow-x-hidden min-h-0 px-4">
          {Array.from({ length: 13 }, (_, i) => {
            const monthDate = currentMonth.clone().add(i, 'months');
            const monthDays = getDaysInMonth(monthDate);

            return (
              <div key={i} className="py-4">
                {/* Month Name */}
                <div className="sticky top-0 bg-card z-10 py-2 mb-2">
                  <h3 className="text-lg font-semibold text-foreground text-center">
                    {getPersianMonthName(monthDate.toDate())}
                  </h3>
                </div>

                {/* Calendar Grid */}
                <div className="grid grid-cols-7 gap-1">
                  {monthDays.map((day, index) => {
                    if (day === null) {
                      return <div key={index} className="h-11 w-full" />;
                    }

                    const isCurrentMonthDay = isCurrentPersianMonth(day, monthDate);
                    const isSelectable = isDateSelectable(day);
                    const isInRange = isDateInRange(day);
                    const isSelected = isDateSelected(day);
                    const isTodayDate = day.isSame(today, 'day');
                    const isOfficialHolidayDay = isOfficialHoliday(day);

                    return (
                      <button
                        type="button"
                        key={index}
                        onClick={() => handleDateClick(day)}
                        disabled={!isSelectable}
                        className={`
                          relative h-11 w-full rounded-xl text-sm font-medium transition-all
                          ${!isCurrentMonthDay ? 'text-muted-foreground/30' : 'text-foreground'}
                          ${isOfficialHolidayDay && isCurrentMonthDay ? '!text-destructive' : ''}
                          ${!isSelectable ? 'cursor-not-allowed opacity-30' : 'cursor-pointer active:scale-95'}
                          ${isSelected ? 'bg-primary text-primary-foreground' : ''}
                          ${isInRange && !isSelected ? 'bg-primary/20' : ''}
                          ${isTodayDate && !isSelected ? 'ring-2 ring-primary/50' : ''}
                        `}
                      >
                        {gregorianToJalali(day.toDate()).day}
                      </button>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>

        {/* Footer */}
        <div className="border-t border-border bg-card p-4 flex-shrink-0">
          {isRange && (isSelectingEndDate || selectedEndDate) ? (
            <div className="flex items-center gap-2 mb-3">
              <div className="grid grid-cols-2 gap-3 flex-1">
                {/* Depart card */}
                <div className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2">
                  <div className="flex flex-col leading-4 text-right">
                    <span className="text-xs text-muted-foreground">رفت</span>
                    <span className="text-sm font-semibold mt-0.5 text-foreground">
                      {selectedStartDate
                        ? formatPersianDate(selectedStartDate.toDate())
                        : 'انتخاب کنید'}
                    </span>
                  </div>
                </div>

                {/* Return card */}
                <button
                  type="button"
                  onClick={() => setIsSelectingEndDate(true)}
                  className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 text-left"
                >
                  <div className="flex flex-col leading-4 text-right">
                    <span className="text-xs text-muted-foreground">برگشت</span>
                    <span className={`text-sm font-semibold mt-0.5 ${selectedEndDate ? 'text-foreground' : 'text-primary'}`}>
                      {selectedEndDate
                        ? formatPersianDate(selectedEndDate.toDate())
                        : '-'}
                    </span>
                  </div>
                </button>
              </div>

              <button
                type="button"
                aria-label="لغو تاریخ برگشت"
                onClick={() => {
                  setIsSelectingEndDate(false);
                  setSelectedEndDate(null);
                }}
                className="w-8 h-8 rounded-full border border-border bg-secondary/50 text-muted-foreground flex items-center justify-center"
              >
                ×
              </button>
            </div>
          ) : isRange ? (
            <div className="grid grid-cols-2 gap-3 mb-3">
              <div className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2">
                <div className="flex flex-col leading-4 text-right">
                  <span className="text-xs text-muted-foreground">رفت</span>
                  <span className="text-sm font-semibold mt-0.5 text-foreground">
                    {selectedStartDate
                      ? formatPersianDate(selectedStartDate.toDate())
                      : 'انتخاب کنید'}
                  </span>
                </div>
              </div>

              <button
                type="button"
                className="text-primary text-sm font-medium justify-self-start text-right flex items-center"
                onClick={() => setIsSelectingEndDate(true)}
              >
                + افزودن تاریخ برگشت
              </button>
            </div>
          ) : (
            <div className="mb-3">
              <div className="bg-secondary/50 border border-border/50 rounded-xl px-3 py-2 inline-block">
                <div className="flex flex-col leading-4 text-right">
                  <span className="text-xs text-muted-foreground">تاریخ</span>
                  <span className="text-sm font-semibold mt-0.5 text-foreground">
                    {selectedStartDate
                      ? formatPersianDate(selectedStartDate.toDate())
                      : 'انتخاب کنید'}
                  </span>
                </div>
              </div>
            </div>
          )}

          {/* Confirm button */}
          <button
            type="button"
            onClick={handleConfirm}
            className="w-full h-12 rounded-xl bg-primary text-primary-foreground text-base font-bold disabled:opacity-60 disabled:cursor-not-allowed transition-all active:scale-[0.98]"
            disabled={!selectedStartDate}
          >
            تایید تاریخ
          </button>
        </div>
      </div>
    </div>,
    document.body
  );
};

export default Calendar;
