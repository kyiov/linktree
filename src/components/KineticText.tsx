import React, { useState } from 'react';

interface KineticTextProps {
  text: string;
  className?: string;
  hoverColor?: string;
}

export const KineticText: React.FC<KineticTextProps> = ({ 
  text, 
  className = '',
  hoverColor = '#fcd34d'
}) => {
  const letters = Array.from(text);
  const [activeIdx, setActiveIdx] = useState<number | null>(null);

  return (
    <span className={`inline-flex flex-wrap items-center justify-center ${className}`}>
      {letters.map((char, index) => {
        const isHovered = activeIdx === index;
        return (
          <span
            key={index}
            onMouseEnter={() => setActiveIdx(index)}
            onMouseLeave={() => setActiveIdx(null)}
            onTouchStart={() => {
              setActiveIdx(index);
              setTimeout(() => setActiveIdx(null), 500);
            }}
            style={{
              transform: isHovered ? 'translateY(-8px) scale(1.16)' : 'translateY(0) scale(1)',
              color: isHovered ? hoverColor : undefined,
              transition: 'transform 0.32s cubic-bezier(0.34, 1.56, 0.64, 1), color 0.2s ease',
            }}
            className="inline-block cursor-default select-none transition-colors will-change-transform"
          >
            {char === ' ' ? '\u00A0' : char}
          </span>
        );
      })}
    </span>
  );
};
