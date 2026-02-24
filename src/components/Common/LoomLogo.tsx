// src/components/Common/LoomLogo.tsx
import React from 'react';

interface LoomLogoProps {
  className?: string;
}

export const LoomLogo: React.FC<LoomLogoProps> = ({ className = "w-6 h-6" }) => {
  return (
    <svg 
      viewBox="0 0 24 24" 
      fill="none" 
      xmlns="http://www.w3.org/2000/svg" 
      className={className}
    >
      {/* Shuttle body */}
      <path 
        d="M21.5 12C21.5 12 18 16 12 16C6 16 2.5 12 2.5 12C2.5 12 6 8 12 8C18 8 21.5 12 21.5 12Z" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round" 
        strokeLinejoin="round"
      />
      {/* Central thread spool */}
      <circle 
        cx="12" 
        cy="12" 
        r="2" 
        fill="currentColor"
      />
      {/* Weaving threads */}
      <path 
        d="M12 2V6" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M12 18V22" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M4 4L7 7" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M17 17L20 20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M20 4L17 7" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
      <path 
        d="M7 17L4 20" 
        stroke="currentColor" 
        strokeWidth="2" 
        strokeLinecap="round"
      />
    </svg>
  );
};
