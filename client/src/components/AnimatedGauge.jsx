import React, { useState, useEffect } from 'react';

export default function AnimatedGauge() {
  const [rotation, setRotation] = useState(-90);

  useEffect(() => {
    const interval = setInterval(() => {
      setRotation((prev) => {
        const next = prev + 2;
        // Keep rotation between -90 and 90 degrees (semi-circle)
        if (next > 90) return -90;
        return next;
      });
    }, 30);

    return () => clearInterval(interval);
  }, []);

  return (
    <div className="w-full h-auto flex flex-col items-center justify-center">
      <svg
        viewBox="0 0 300 200"
        className="w-full max-w-md h-auto"
        xmlns="http://www.w3.org/2000/svg"
      >
        <defs>
          {/* Gradient for the arc */}
          <linearGradient id="arcGradient" x1="0%" y1="100%" x2="100%" y2="100%">
            <stop offset="0%" style={{ stopColor: '#EF4444', stopOpacity: 1 }} />
            <stop offset="15%" style={{ stopColor: '#F97316', stopOpacity: 1 }} />
            <stop offset="30%" style={{ stopColor: '#EAB308', stopOpacity: 1 }} />
            <stop offset="50%" style={{ stopColor: '#FBBF24', stopOpacity: 1 }} />
            <stop offset="70%" style={{ stopColor: '#84CC16', stopOpacity: 1 }} />
            <stop offset="85%" style={{ stopColor: '#22C55E', stopOpacity: 1 }} />
            <stop offset="100%" style={{ stopColor: '#10B981', stopOpacity: 1 }} />
          </linearGradient>
          
          {/* Shadow filter */}
          <filter id="shadow" x="-50%" y="-50%" width="200%" height="200%">
            <feDropShadow dx="0" dy="2" stdDeviation="3" floodOpacity="0.2" />
          </filter>
        </defs>

        {/* Semi-circle arc background */}
        <path
          d="M 50 150 A 100 100 0 0 1 250 150"
          stroke="url(#arcGradient)"
          strokeWidth="28"
          fill="none"
          strokeLinecap="round"
          filter="url(#shadow)"
        />

        {/* Inner shadow arc for depth */}
        <path
          d="M 50 150 A 100 100 0 0 1 250 150"
          stroke="#00000010"
          strokeWidth="32"
          fill="none"
          strokeLinecap="round"
          opacity="0.3"
        />

        {/* Emotional state labels with emojis */}
        {/* Negative */}
        <g>
          <text x="50" y="160" fontSize="28" textAnchor="middle" filter="url(#shadow)">
            😞
          </text>
        </g>

        {/* Positive */}
        <g>
          <text x="250" y="160" fontSize="28" textAnchor="middle" filter="url(#shadow)">
            😊
          </text>
        </g>

        {/* Needle group - rotating within semi-circle bounds */}
        <g transform={`rotate(${rotation} 150 150)`}>
          {/* Needle line */}
          <line
            x1="150"
            y1="150"
            x2="150"
            y2="60"
            stroke="#000000"
            strokeWidth="5"
            strokeLinecap="round"
            filter="url(#shadow)"
          />
          
          {/* Needle highlight */}
          <line
            x1="151"
            y1="150"
            x2="151"
            y2="60"
            stroke="#000000"
            strokeWidth="2"
            strokeLinecap="round"
            opacity="0.6"
          />
        </g>

        {/* Center circle (needle pivot) - professional look */}
        <circle cx="150" cy="150" r="14" fill="#F3F4F6" filter="url(#shadow)" />
        <circle cx="150" cy="150" r="12" fill="#1F2937" />
        <circle cx="150" cy="150" r="8" fill="#FFFFFF" />
        <circle cx="151.5" cy="148.5" r="3" fill="#E5E7EB" opacity="0.5" />
      </svg>
    </div>
  );
}
