import Loading from '@/components/flight-card/loading';
import React from 'react';
import { CardLoadingProperties } from './types';

const CardsLoading = ({ length = 3 }: CardLoadingProperties) => {
  return Array.from(Array(length).fill(0), (_, index) => index).map((index) => (
    <Loading key={index} />
  ));
};

export default CardsLoading;
