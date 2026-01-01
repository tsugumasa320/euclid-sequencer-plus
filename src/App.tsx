import { useState, useEffect, useCallback, useMemo } from 'react';
import { AppState, Track } from './types';
import { generateEuclidPattern } from './utils/euclidAlgorithm';
import { useAudio } from './hooks/useAudio';
import TrackCircle from './components/TrackCircle';
import ControlPanel from './components/ControlPanel';
import TransportBar from './components/TransportBar';
import LoadingSpinner from './components/LoadingSpinner';
import './App.css';

const initialTracks: Track[] = [
  {
    id: 'kick',
    name: 'Kick',
    steps: 16,
    hits: 4,
    bias: 0.5,
    rotation: 0,
    volume: 70,
    muted: false,
    solo: false,
    pattern: [],
    color: '#ff6b6b'
  },
  {
    id: 'snare',
    name: 'Snare',
    steps: 16,
    hits: 2,
    bias: 0.5,
    rotation: 4,
    volume: 70,
    muted: false,
    solo: false,
    pattern: [],
    color: '#4ecdc4'
  },
  {
    id: 'hihat',
    name: 'Hi-hat',
    steps: 16,
    hits: 8,
    bias: 0.5,
    rotation: 0,
    volume: 50,
    muted: false,
    solo: false,
    pattern: [],
    color: '#45b7d1'
  },
  {
    id: 'crash',
    name: 'Crash',
    steps: 16,
    hits: 1,
    bias: 0.5,
    rotation: 0,
    volume: 40,
    muted: false,
    solo: false,
    pattern: [],
    color: '#f39c12'
  },
  {
    id: 'perc',
    name: 'Perc',
    steps: 16,
    hits: 3,
    bias: 0.3,
    rotation: 2,
    volume: 60,
    muted: false,
    solo: false,
    pattern: [],
    color: '#e74c3c'
  },
  {
    id: 'clap',
    name: 'Clap',
    steps: 16,
    hits: 2,
    bias: 0.7,
    rotation: 8,
    volume: 65,
    muted: false,
    solo: false,
    pattern: [],
    color: '#9b59b6'
  }
];

const defaultTransport = {
  isPlaying: false,
  bpm: 120,
  swing: 0,
  timeSignature: '4/4',
  currentStep: 0
};

const defaultMasterVolume = 80;

function App() {
  const [appState, setAppState] = useState<AppState>(() => {
    const tracksWithPatterns = initialTracks.map(track => ({
      ...track,
      pattern: generateEuclidPattern({
        steps: track.steps,
        hits: track.hits,
        bias: track.bias,
        rotation: track.rotation
      })
    }));

    return {
      transport: { ...defaultTransport },
      tracks: tracksWithPatterns,
      masterVolume: defaultMasterVolume,
      selectedTrackId: 'kick'
    };
  });

  const audio = useAudio(appState.tracks, appState.transport, (step) => {
    setAppState(prev => ({
      ...prev,
      transport: { ...prev.transport, currentStep: step }
    }));
  });

  const updateTrack = useCallback((trackId: string, updates: Partial<Track>) => {
    setAppState(prev => ({
      ...prev,
      tracks: prev.tracks.map(track => {
        if (track.id === trackId) {
          const updated = { ...track, ...updates };
          // Regenerate pattern if parameters changed
          if ('steps' in updates || 'hits' in updates || 'bias' in updates || 'rotation' in updates) {
            updated.pattern = generateEuclidPattern({
              steps: updated.steps,
              hits: updated.hits,
              bias: updated.bias,
              rotation: updated.rotation
            });
          }
          return updated;
        }
        return track;
      })
    }));
  }, []);

  const updateTransport = useCallback((updates: Partial<typeof appState.transport>) => {
    setAppState(prev => ({
      ...prev,
      transport: { ...prev.transport, ...updates }
    }));
  }, []);

  const handleMasterVolumeChange = useCallback((volume: number) => {
    setAppState(prev => ({ ...prev, masterVolume: volume }));
  }, []);

  const handleTrackSelect = useCallback((trackId: string) => {
    setAppState(prev => ({ ...prev, selectedTrackId: trackId }));
  }, []);

  const handleTrackTrigger = useCallback((trackId: string) => {
    audio.triggerTrack(trackId);
  }, [audio]);

  const handlePlayPause = useCallback(async () => {
    if (appState.transport.isPlaying) {
      audio.stopAudio();
      updateTransport({ isPlaying: false });
      return;
    }

    await audio.startAudio();
    updateTransport({ isPlaying: true });
  }, [appState.transport.isPlaying, audio, updateTransport]);

  // Handle tempo changes
  useEffect(() => {
    audio.updateTempo(appState.transport.bpm);
  }, [appState.transport.bpm, audio]);

  // Handle swing changes
  useEffect(() => {
    audio.updateSwing(appState.transport.swing);
  }, [appState.transport.swing, audio]);

  // Handle master volume changes
  useEffect(() => {
    audio.updateMasterVolume(appState.masterVolume);
  }, [appState.masterVolume, audio]);

  // Handle time signature changes
  useEffect(() => {
    audio.updateTimeSignature(appState.transport.timeSignature);
  }, [appState.transport.timeSignature, audio]);

  const selectedTrack = useMemo(() => 
    appState.tracks.find(t => t.id === appState.selectedTrackId), 
    [appState.tracks, appState.selectedTrackId]
  );
  const selectedDefaultTrack = useMemo(() => {
    const found = initialTracks.find(t => t.id === appState.selectedTrackId);
    return found ?? initialTracks[0];
  }, [appState.selectedTrackId]);

  // Show loading screen while audio is initializing
  if (!audio.isReady) {
    return (
      <div className="app">
        <LoadingSpinner message="Initializing Audio Engine..." />
      </div>
    );
  }

  return (
    <div className="app">
      <header className="app-header">
        <h1>Euclidean Sequencer Plus</h1>
        <TransportBar 
          transport={appState.transport}
          defaultTransport={defaultTransport}
          onTogglePlay={handlePlayPause}
          onUpdate={updateTransport}
          masterVolume={appState.masterVolume}
          defaultMasterVolume={defaultMasterVolume}
          onMasterVolumeChange={handleMasterVolumeChange}
        />
      </header>

      <main className="app-main">
        <div className="track-grid">
          {appState.tracks.map(track => (
            <TrackCircle
              key={track.id}
              track={track}
              isSelected={track.id === appState.selectedTrackId}
              currentStep={appState.transport.currentStep}
              onClick={() => handleTrackSelect(track.id)}
              onTrigger={() => handleTrackTrigger(track.id)}
            />
          ))}
        </div>

        {selectedTrack && (
          <ControlPanel
            track={selectedTrack}
            defaultTrack={selectedDefaultTrack}
            onUpdate={(updates) => updateTrack(selectedTrack.id, updates)}
          />
        )}
      </main>
    </div>
  );
}

export default App;
