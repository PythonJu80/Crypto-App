import React from 'react';

const LoadingSpinner = () => (
  <div className="flex justify-center items-center min-h-[400px] bg-pepe-dark">
    <div className="relative">
      <div className="w-12 h-12 rounded-full border-4 border-pepe-dark animate-spin">
        <div className="absolute top-0 left-0 w-12 h-12 rounded-full border-t-4 border-pepe-primary animate-usb-pulse" />
      </div>
      <p className="mt-4 text-pepe-primary font-['Press_Start_2P'] text-sm animate-usb-pulse">
        Loading...
      </p>
    </div>
  </div>
);