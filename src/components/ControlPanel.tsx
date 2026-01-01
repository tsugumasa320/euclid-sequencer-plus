import React, { memo } from 'react';
import { Track } from '../types';
import './ControlPanel.css';

interface ControlPanelProps {
  track: Track;
  defaultTrack: Track;
  onUpdate: (updates: Partial<Track>) => void;
}

const ControlPanel: React.FC<ControlPanelProps> = ({ track, defaultTrack, onUpdate }) => {
  const handleStepsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const steps = parseInt(e.target.value);
    onUpdate({ steps, hits: Math.min(track.hits, steps) });
  };

  const handleHitsChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ hits: parseInt(e.target.value) });
  };

  const handleBiasChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ bias: parseFloat(e.target.value) });
  };

  const handleRotationChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ rotation: parseInt(e.target.value) });
  };

  const handleVolumeChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    onUpdate({ volume: parseInt(e.target.value) });
  };

  const handleMuteToggle = () => {
    onUpdate({ muted: !track.muted });
  };

  const handleSoloToggle = () => {
    onUpdate({ solo: !track.solo });
  };

  const resetSteps = () => {
    const steps = defaultTrack.steps;
    onUpdate({ steps, hits: Math.min(track.hits, steps) });
  };

  const resetHits = () => {
    onUpdate({ hits: Math.min(defaultTrack.hits, track.steps) });
  };

  const resetBias = () => {
    onUpdate({ bias: defaultTrack.bias });
  };

  const resetRotation = () => {
    onUpdate({ rotation: defaultTrack.rotation });
  };

  const resetVolume = () => {
    onUpdate({ volume: defaultTrack.volume });
  };

  const getBiasLabel = (bias: number) => {
    if (bias < 0.4) return 'Front Heavy';
    if (bias > 0.6) return 'Back Heavy';
    return 'Balanced';
  };

  return (
    <div className="control-panel" style={{ '--track-color': track.color } as React.CSSProperties}>
      <div className="panel-header">
        <h3>{track.name} Controls</h3>
        <div className="track-buttons">
          <button 
            className={`mute-btn ${track.muted ? 'active' : ''}`}
            onClick={handleMuteToggle}
          >
            Mute
          </button>
          <button 
            className={`solo-btn ${track.solo ? 'active' : ''}`}
            onClick={handleSoloToggle}
          >
            Solo
          </button>
        </div>
      </div>

      <div className="controls-grid">
        <div className="control-group">
          <label>Steps</label>
          <div className="control-input">
            <input
              type="range"
              min="1"
              max="32"
              value={track.steps}
              onChange={handleStepsChange}
              onDoubleClick={resetSteps}
            />
            <span>{track.steps}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Hits</label>
          <div className="control-input">
            <input
              type="range"
              min="0"
              max={track.steps}
              value={track.hits}
              onChange={handleHitsChange}
              onDoubleClick={resetHits}
            />
            <span>{track.hits}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Bias</label>
          <div className="control-input">
            <input
              type="range"
              min="0"
              max="1"
              step="0.1"
              value={track.bias}
              onChange={handleBiasChange}
              onDoubleClick={resetBias}
            />
            <span>{getBiasLabel(track.bias)}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Rotation</label>
          <div className="control-input">
            <input
              type="range"
              min={-track.steps}
              max={track.steps}
              value={track.rotation}
              onChange={handleRotationChange}
              onDoubleClick={resetRotation}
            />
            <span>{track.rotation > 0 ? '+' : ''}{track.rotation}</span>
          </div>
        </div>

        <div className="control-group">
          <label>Volume</label>
          <div className="control-input">
            <input
              type="range"
              min="0"
              max="100"
              value={track.volume}
              onChange={handleVolumeChange}
              onDoubleClick={resetVolume}
            />
            <span>{track.volume}%</span>
          </div>
        </div>
      </div>

      <div className="pattern-display">
        <label>Pattern Preview</label>
        <div className="pattern-dots">
          {track.pattern.map((active, index) => (
            <div
              key={index}
              className={`pattern-dot ${active ? 'active' : ''}`}
              style={{ backgroundColor: active ? track.color : 'rgba(255, 255, 255, 0.2)' }}
            />
          ))}
        </div>
      </div>
    </div>
  );
};

export default memo(ControlPanel);
