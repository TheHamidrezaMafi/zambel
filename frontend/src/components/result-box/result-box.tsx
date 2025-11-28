import React, { useEffect, useState } from 'react';
import { ResultBoxProperties } from './types';
import flight from '@/assets/images/Flight.json';

const ResultBox = ({ isLoading, count }: ResultBoxProperties) => {
  const [LottieComponent, setLottieComponent] = useState<any>(null);

  useEffect(() => {
    import('lottie-react').then((mod) => {
      setLottieComponent(() => mod.default);
    });
  }, []);

  return (
    <div className="flex items-center border gap-4 bg-white border-gray-300 rounded-xl py-1 px-2">
      {LottieComponent && (
        <LottieComponent
          className="size-10"
          animationData={flight}
          loop={true}
        />
      )}
      <ResultTitle count={count} isLoading={isLoading} />
    </div>
  );
};

const ResultTitle = ({ isLoading, count }: ResultBoxProperties) => {
  if (isLoading)
    return <p className="text-gray-800 font-bold">در حال جستجوی پروازها</p>;

  return <p className="text-gray-800 font-bold">{`${count} پرواز  پیدا شد`}</p>;
};

export default ResultBox;
