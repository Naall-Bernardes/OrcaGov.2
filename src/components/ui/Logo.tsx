/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React from 'react';

interface LogoProps {
  className?: string;
  variant?: 'light' | 'dark';
}

export default function Logo({ className = "h-10 w-10", variant = 'dark' }: LogoProps) {
  return (
    <div className={`relative flex items-center justify-center ${className}`}>
      <svg viewBox="0 0 100 100" fill="none" xmlns="http://www.w3.org/2000/svg" className="w-full h-full">
        {/* The iconic Red Triangle of Minas Gerais - sharp and modern */}
        <path 
          d="M50 15 L90 85 L10 85 Z" 
          fill="#d92332" 
        />
        
        {/* Abstract "Gov" data/building columns */}
        <rect x="38" y="55" width="6" height="20" fill="white" fillOpacity="0.9" />
        <rect x="47" y="45" width="6" height="30" fill="white" fillOpacity="1" />
        <rect x="56" y="50" width="6" height="25" fill="white" fillOpacity="0.9" />
        
        {/* Subtle white outline for dark backgrounds */}
        {variant === 'light' && (
          <path 
            d="M50 15 L90 85 L10 85 Z" 
            stroke="white" 
            strokeWidth="2" 
            fill="none"
          />
        )}
      </svg>
    </div>
  );
}
