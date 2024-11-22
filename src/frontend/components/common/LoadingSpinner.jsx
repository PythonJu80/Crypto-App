import React from 'react';
import PropTypes from 'prop-types';

const LoadingSpinner = ({ size = 'default', message = 'Loading...' }) => {
  const sizeClasses = {
    small: 'w-8 h-8',
    default: 'w-12 h-12',
    large: 'w-16 h-16'
  };

  const spinnerSize = sizeClasses[size];

  return (
    <div className="flex justify-center items-center min-h-[400px] bg-pepe-dark">
      <div className="relative">
        <div className={`${spinnerSize} rounded-full border-4 border-pepe-dark animate-spin`}>
          <div className={`absolute top-0 left-0 ${spinnerSize} rounded-full border-t-4 border-pepe-primary animate-usb-pulse`} />
        </div>
        <p className="mt-4 text-pepe-primary font-['Press_Start_2P'] text-sm animate-usb-pulse">
          {message}
        </p>
      </div>
    </div>
  );
};

LoadingSpinner.propTypes = {
  size: PropTypes.oneOf(['small', 'default', 'large']),
  message: PropTypes.string
};

export default LoadingSpinner;