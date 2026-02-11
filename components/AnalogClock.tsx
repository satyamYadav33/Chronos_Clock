
import React, { useState, useEffect, useRef } from 'react';
import { ClockProps } from '../types';

const AnalogClock: React.FC<ClockProps> = ({ 
  timezone, 
  size = 200, 
  label, 
  onRemove, 
  onEditLabel,
  showDetails = true,
  showSeconds = true 
}) => {
  const [time, setTime] = useState(new Date());
  const [isEditing, setIsEditing] = useState(false);
  const [tempLabel, setTempLabel] = useState(label || '');
  const requestRef = useRef<number>();

  const updateTime = () => {
    setTime(new Date());
    requestRef.current = requestAnimationFrame(updateTime);
  };

  useEffect(() => {
    requestRef.current = requestAnimationFrame(updateTime);
    return () => {
      if (requestRef.current) cancelAnimationFrame(requestRef.current);
    };
  }, []);

  const formatter = new Intl.DateTimeFormat('en-US', {
    timeZone: timezone,
    hour: 'numeric',
    minute: 'numeric',
    second: 'numeric',
    hour12: false,
  });

  const parts = formatter.formatToParts(time);
  const hour = parseInt(parts.find(p => p.type === 'hour')?.value || '0');
  const minute = parseInt(parts.find(p => p.type === 'minute')?.value || '0');
  const second = parseInt(parts.find(p => p.type === 'second')?.value || '0');
  const ms = time.getMilliseconds();

  const secondDeg = (second + ms / 1000) * 6;
  const minuteDeg = (minute + second / 60) * 6;
  const hourDeg = ((hour % 12) + minute / 60) * 30;

  const center = size / 2;

  // CSS Variables for theming
  const clockStyles = {
    '--clock-bg': '#171717',
    '--clock-border': '#262626',
    '--clock-hand-hour': '#f5f5f5',
    '--clock-hand-minute': '#f5f5f5',
    '--clock-hand-second': '#ef4444',
    '--clock-marker-main': '#f5f5f5',
    '--clock-marker-sub': '#404040',
    '--clock-shadow': 'rgba(0,0,0,0.5)',
  } as React.CSSProperties;

  const handleLabelSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (onEditLabel) onEditLabel(tempLabel);
    setIsEditing(false);
  };

  return (
    <div className="flex flex-col items-center group relative" style={clockStyles}>
      {onRemove && (
        <button 
          onClick={onRemove}
          className="absolute -top-2 -right-2 bg-neutral-800 text-neutral-400 hover:text-white w-6 h-6 rounded-full flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity z-10 text-xs"
          title="Remove clock"
        >
          ✕
        </button>
      )}
      
      <div 
        className="relative rounded-full shadow-[0_0_50px_var(--clock-shadow),inset_0_2px_10px_rgba(255,255,255,0.05)] border border-[var(--clock-border)] bg-[var(--clock-bg)] transition-transform duration-500 hover:scale-105"
        style={{ width: size, height: size }}
      >
        <svg width={size} height={size} viewBox={`0 0 ${size} ${size}`}>
          {/* Hour Markers */}
          {[...Array(12)].map((_, i) => {
            const angle = (i * 30 * Math.PI) / 180;
            const x1 = center + (size * 0.4) * Math.sin(angle);
            const y1 = center - (size * 0.4) * Math.cos(angle);
            const x2 = center + (size * 0.45) * Math.sin(angle);
            const y2 = center - (size * 0.45) * Math.cos(angle);
            return (
              <line 
                key={i} 
                x1={x1} y1={y1} x2={x2} y2={y2} 
                stroke={i % 3 === 0 ? 'var(--clock-marker-main)' : 'var(--clock-marker-sub)'} 
                strokeWidth={i % 3 === 0 ? 2 : 1} 
                strokeLinecap="round"
              />
            );
          })}

          {/* Hour Hand */}
          <line
            x1={center} y1={center}
            x2={center + (size * 0.25) * Math.sin((hourDeg * Math.PI) / 180)}
            y2={center - (size * 0.25) * Math.cos((hourDeg * Math.PI) / 180)}
            stroke="var(--clock-hand-hour)"
            strokeWidth={4}
            strokeLinecap="round"
          />

          {/* Minute Hand */}
          <line
            x1={center} y1={center}
            x2={center + (size * 0.38) * Math.sin((minuteDeg * Math.PI) / 180)}
            y2={center - (size * 0.38) * Math.cos((minuteDeg * Math.PI) / 180)}
            stroke="var(--clock-hand-minute)"
            strokeWidth={2.5}
            strokeLinecap="round"
          />

          {/* Second Hand */}
          {showSeconds && (
            <line
              x1={center} y1={center}
              x2={center + (size * 0.42) * Math.sin((secondDeg * Math.PI) / 180)}
              y2={center - (size * 0.42) * Math.cos((secondDeg * Math.PI) / 180)}
              stroke="var(--clock-hand-second)"
              strokeWidth={1.5}
              strokeLinecap="round"
            />
          )}

          {/* Center Cap */}
          <circle cx={center} cy={center} r={4} fill="var(--clock-hand-hour)" />
          {showSeconds && <circle cx={center} cy={center} r={2} fill="var(--clock-hand-second)" />}
        </svg>
      </div>

      {showDetails && (
        <div className="mt-4 text-center w-full px-2">
          {isEditing ? (
            <form onSubmit={handleLabelSubmit} className="flex items-center justify-center">
              <input 
                autoFocus
                type="text"
                value={tempLabel}
                onChange={(e) => setTempLabel(e.target.value)}
                onBlur={handleLabelSubmit}
                className="bg-neutral-800 text-xs text-white border-none rounded px-2 py-1 text-center focus:ring-1 focus:ring-neutral-600 outline-none w-32"
              />
            </form>
          ) : (
            <h3 
              onClick={() => onEditLabel && setIsEditing(true)}
              className={`text-sm font-medium text-neutral-200 truncate max-w-[180px] cursor-pointer hover:text-white transition-colors`}
              title="Click to edit label"
            >
              {label}
            </h3>
          )}
          <p className="text-xs text-neutral-500 mono mt-0.5">
            {new Intl.DateTimeFormat('en-US', {
              timeZone: timezone,
              hour: '2-digit',
              minute: '2-digit',
              second: '2-digit',
              hour12: false
            }).format(time)}
          </p>
        </div>
      )}
    </div>
  );
};

export default AnalogClock;
