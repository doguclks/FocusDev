import React from 'react';

interface SmoothDigitProps {
  value: string;
  className?: string;
}

export const SmoothDigit: React.FC<SmoothDigitProps> = ({ value, className = '' }) => {
  return (
    <span className="relative inline-flex items-center justify-center overflow-hidden h-[1.18em] w-[0.64em]">
      <span
        key={value}
        className={`animate-digit-smooth ${className}`}
      >
        {value}
      </span>
    </span>
  );
};
