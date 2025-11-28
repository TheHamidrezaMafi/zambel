import React from 'react';

const Loading = () => {
  return (
    <div>
      <div className="mx-auto w-full border border-gray-300 rounded-md shadow-xl bg-white ">
        <div className="flex  space-x-2 gap-3 p-4">
          <div className="size-10 rounded-full bg-gray-200"></div>
          <div className="flex-1 space-y-6 py-1">
            <div className="space-y-3">
              <div className="grid grid-cols-2 gap-4">
                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
                <div className="col-span-1 h-2 rounded bg-gray-200"></div>
              </div>
              <div className="h-2 rounded bg-gray-200"></div>
            </div>
          </div>
        </div>
        <div className="flex justify-start items-center px-6 h-8 py-2 border-t border-gray-300">
          <div className="w-28 h-3 rounded bg-gray-200"></div>
        </div>
        <div className="flex justify-start items-center px-6 h-12 py-2 border-t border-gray-300">
          <div className="w-28 h-3 rounded bg-gray-200"></div>
        </div>
      </div>
    </div>
  );
};

export default Loading;
