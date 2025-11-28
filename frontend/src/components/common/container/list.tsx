import React from 'react';
import { ListProps } from './types';

const List = ({ children }: ListProps) => {
  return (
    <section className=" w-full h-full max-w-[550px] flex gap-4 flex-col mx-auto">
      {children}
    </section>
  );
};

export default List;
