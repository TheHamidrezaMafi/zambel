import React from "react";
import Button from "../common/button";

const TripMaker = () => {
  return (
    <div className="px-6 pt-4">
      <div className="border-gray-300 border rounded-md w-full flex flex-col p-2">
        <p className="text-sm font-medium pb-2 text-gray-800">
          کجا می خوای بری؟
        </p>
        <Button className="!bg-blue-600 self-end  text-sm p-1 rounded-md">
          از من بپرس
        </Button>
      </div>
    </div>
  );
};

export default TripMaker;
