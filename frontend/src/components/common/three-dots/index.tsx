import React from "react";

const ThreeDots = () => {
  return (
    <div className="flex gap-x-1 justify-center items-center  ">
      <div className="h-2 w-2 bg-primary-200 rounded-full animate-bounce [animation-delay:-0.15s]"></div>
      <div className="h-2 w-2 bg-primary-200 rounded-full animate-bounce   [animation-delay:-0.3s]"></div>
      <div className="h-2 w-2 bg-primary-200 rounded-full animate-bounce"></div>
    </div>
  );
};

export default ThreeDots;
