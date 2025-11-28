import React, { useEffect } from 'react';
import { MobilePassengerSelect } from '@/components/common/mobile-passenger-select';
import { MobileSelect } from '@/components/common/mobile-select';
import { useForm } from 'react-hook-form';
import { useRouter } from 'next/router';
import { FormValues } from './types';
import { DatePicker } from '@/components/common/calendar';
import moment from 'moment-jalaali';
const HotelSearch = () => {
  const { query } = useRouter();
  const { control, handleSubmit, reset, setValue, watch } = useForm<FormValues>(
    {
      mode: 'onChange',
      defaultValues: {
        participants: {
          adults: 1,
          children: 0,
        },
      },
    }
  );
  useEffect(() => {
    reset({
      destination: '',
      start: undefined,
      end: undefined,
      participants: {
        adults: 1,
        children: 0,
      },
    });
  }, [query, reset]);
  const submitForm = (data: FormValues) => {};
  return (
    <>
      <div className="flex flex-col gap-4 pt-4">
        <div className="relative">
          <MobileSelect
            options={[]}
            label={'مقصد یا هتل'}
            control={control}
            name="destination"
          />
        </div>

        <div className="col-span-1 md:col-span-2">
          <DatePicker
            isRange
            placeholder="تاریخ ورود و خروج"
            startDate={
              watch('start')
                ? moment(watch('start'), 'YYYY-MM-DD', true).toDate()
                : null
            }
            endDate={
              watch('end')
                ? moment(watch('end'), 'YYYY-MM-DD', true).toDate()
                : null
            }
            minDate={new Date()}
            onDateSelect={({ startDate, endDate }) => {
              if (startDate) {
                setValue('start', moment(startDate).format('YYYY-MM-DD'));
              } else {
                setValue('start', undefined as unknown as string);
              }
              if (endDate) {
                setValue('end', moment(endDate).format('YYYY-MM-DD'));
              } else {
                setValue('end', undefined as unknown as string);
              }
            }}
          />
        </div>

        <MobilePassengerSelect
          label="تعداد مسافران"
          name="participants"
          control={control}
        />
        <button
          onClick={handleSubmit(submitForm)}
          className="text-lg md:text-xl bg-primary-400 rounded-2xl flex items-center justify-center h-14 px-10 text-white col-span-1"
        >
          جستجو
        </button>
      </div>
    </>
  );
};

export default HotelSearch;
