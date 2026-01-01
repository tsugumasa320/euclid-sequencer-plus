import React, { memo } from 'react';
import { Track } from '../types';
import './TrackCircle.css';

interface TrackCircleProps {
  track: Track;
  isSelected: boolean;
  currentStep: number;
  onClick: () => void;
  onTrigger?: () => void;
}

const TrackCircle: React.FC<TrackCircleProps> = ({ 
  track, 
  isSelected, 
  currentStep, 
  onClick,
  onTrigger
}) => {
  const handleClick = (e: React.MouseEvent) => {
    e.preventDefault();
    onClick();
    if (onTrigger) {
      onTrigger();
    }
  };
  const radius = 80;
  const centerX = 100;
  const centerY = 100;
  const safeSteps = Math.max(1, track.steps);
  const pattern = Array.isArray(track.pattern) ? track.pattern : [];
  const stepsPattern = pattern.length > 0 ? pattern : new Array(safeSteps).fill(false);
  
  const steps = stepsPattern.map((active, index) => {
    const angle = (index / safeSteps) * 2 * Math.PI - Math.PI / 2;
    const x = centerX + radius * Math.cos(angle);
    const y = centerY + radius * Math.sin(angle);
    
    return {
      x,
      y,
      active,
      isCurrent: index === currentStep % safeSteps
    };
  });

  return (
    <div 
      className={`track-circle ${isSelected ? 'selected' : ''}`}
      onClick={handleClick}
      style={{ '--track-color': track.color } as React.CSSProperties}
    >
      <svg width="200" height="200" viewBox="0 0 200 200">
        {/* Background circle */}
        <circle
          cx={centerX}
          cy={centerY}
          r={radius + 10}
          fill="none"
          stroke="rgba(255, 255, 255, 0.1)"
          strokeWidth="2"
        />
        
        {/* Steps */}
        {steps.map((step, index) => (
          <circle
            key={index}
            cx={step.x}
            cy={step.y}
            r={step.active ? 8 : 4}
            fill={step.active ? track.color : 'rgba(255, 255, 255, 0.3)'}
            stroke={step.isCurrent ? '#ffffff' : 'transparent'}
            strokeWidth="2"
            className={`step ${step.active ? 'active' : ''} ${step.isCurrent ? 'current' : ''}`}
          />
        ))}
        
        {/* Center info */}
        <text
          x={centerX}
          y={centerY - 15}
          textAnchor="middle"
          fill="white"
          fontSize="16"
          fontWeight="bold"
        >
          {track.name}
        </text>
        
        <text
          x={centerX}
          y={centerY}
          textAnchor="middle"
          fill="rgba(255, 255, 255, 0.7)"
          fontSize="12"
        >
          {track.hits}/{track.steps}
        </text>
        
        {/* Current step indicator */}
        <text
          x={centerX}
          y={centerY + 15}
          textAnchor="middle"
          fill="#ffffff"
          fontSize="14"
          fontWeight="bold"
          className="current-step-text"
        >
          {track.steps > 0 ? (currentStep % safeSteps) + 1 : 0}
        </text>
      </svg>
      
      {/* Mute/Solo indicators */}
      <div className="track-status">
        {track.muted && <span className="muted">M</span>}
        {track.solo && <span className="solo">S</span>}
      </div>
    </div>
  );
};

export default memo(TrackCircle);
