import React from 'react';
import { TransportState } from '../types';
import './TransportBar.css';

interface TransportBarProps {
  transport: TransportState;
  onUpdate: (updates: Partial<TransportState>) => void;
  masterVolume: number;
  onMasterVolumeChange: (volume: number) => void;
}

const TransportBar: React.FC<TransportBarProps> = ({
  transport,
  onUpdate,
  masterVolume,
  onMasterVolumeChange
}) => {
  const handlePlayPause = () => {
    onUpdate({ isPlaying: !transport.isPlaying });
  };

  const handleBpmChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ bpm: parseInt(e.target.value) });
  };

  const handleSwingChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ swing: parseInt(e.target.value) });
  };

  const handleTimeSignatureChange = (e: React.ChangeEvent<HTMLSelectElement>) => {
    onUpdate({ timeSignature: e.target.value });
  };

  return (
    <div className="transport-bar">
      <div className="transport-controls">
        <button 
          className={`play-button ${transport.isPlaying ? 'playing' : ''}`}
          onClick={handlePlayPause}
        >
          {transport.isPlaying ? '⏸️' : '▶️'}
        </button>
        
        <div className="bpm-control">
          <label>BPM</label>
          <input
            type="range"
            min="60"
            max="200"
            value={transport.bpm}
            onChange={handleBpmChange}
          />
          <span>{transport.bpm}</span>
        </div>
        
        <div className="swing-control">
          <label>Swing</label>
          <input
            type="range"
            min="0"
            max="100"
            value={transport.swing}
            onChange={handleSwingChange}
          />
          <span>{transport.swing}%</span>
        </div>
        
        <div className="time-signature-control">
          <label>Time</label>
          <select value={transport.timeSignature} onChange={handleTimeSignatureChange}>
            <option value="4/4">4/4</option>
            <option value="3/4">3/4</option>
            <option value="5/4">5/4</option>
            <option value="7/4">7/4</option>
          </select>
        </div>
        
        <div className="master-volume">
          <label>Master</label>
          <input
            type="range"
            min="0"
            max="100"
            value={masterVolume}
            onChange={(e) => onMasterVolumeChange(parseInt(e.target.value))}
          />
          <span>{masterVolume}</span>
        </div>
      </div>
    </div>
  );
};

export default TransportBar;