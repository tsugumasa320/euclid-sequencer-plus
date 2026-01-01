# Euclidean Sequencer Plus

Web-based Euclidean rhythm sequencer built with React + TypeScript + Tone.js.

🎵 **[Live Demo](https://tsugumasayutani.github.io/euclid-sequencer-plus/)** | 🚀 **Auto-Deploy Ready**

## Features

### Core Features
- ✨ **6-Track 808-Style Drum Machine**: Kick, Snare, Hi-hat, Crash, Perc, Clap
- 🎯 **Advanced Euclidean Algorithm**: Based on Max/MSP implementation with bias and rotation
- 🎨 **Beautiful Circular UI**: Intuitive visual representation of rhythmic patterns
- ⚡ **Real-time Parameter Control**: Instant pattern updates with smooth animations

### Advanced Features
- 🎪 **Bias Control**: Adjust front/back weight distribution of hits (unique feature)
- 🔄 **Pattern Rotation**: Shift patterns by any number of steps
- 🎵 **Swing Support**: Global swing from 0-100%
- 🎼 **Time Signatures**: Support for 4/4, 3/4, 5/4, 7/4
- 🔇 **Mute/Solo**: Individual track control
- 🎚️ **Volume Control**: Per-track and master volume
- 📱 **Responsive Design**: Works on desktop, tablet, and mobile

### Technical Highlights
- **High-Quality Audio**: Tone.js-powered 808-style synthesized drums with polyphonic support
- **Precision Timing**: moistpeace.com lookahead scheduling (25ms precision)
- **Performance Optimized**: React.memo, useCallback, useMemo for smooth operation
- **TypeScript**: Full type safety and excellent developer experience
- **Modern Build System**: Vite for fast development and optimized production builds
- **Comprehensive Testing**: 88 tests covering all functionality (100% pass rate)

## Getting Started

### Quick Start
```bash
# Clone the repository
git clone https://github.com/tsugumasayutani/euclid-sequencer-plus.git
cd euclid-sequencer-plus

# Install dependencies
npm install

# Start development server
npm run dev
```

### Testing
Tests have been removed in this version. The `npm test` script now only reports that no tests are available.

### Production Build
```bash
npm run build
npm run preview
```

### Deployment
✅ **Ready to Deploy** - Automatic deployment to GitHub Pages via GitHub Actions on push to main branch.

## Usage

1. **Select a Track**: Click on any circular track display
2. **Adjust Parameters**: Use the control panel to modify:
   - **Steps**: Total number of steps in the pattern (1-32)
   - **Hits**: Number of active beats in the pattern
   - **Bias**: Distribution weight (0.0=front heavy, 0.5=balanced, 1.0=back heavy)
   - **Rotation**: Shift the pattern left or right
   - **Volume**: Track volume (0-100%)
3. **Global Controls**:
   - **Play/Pause**: Start/stop the sequencer
   - **BPM**: Tempo control (60-200 BPM)
   - **Swing**: Add swing feel (0-100%)
   - **Time Signature**: Change the musical meter
   - **Master Volume**: Overall output level

## The Euclidean Algorithm

This implementation is based on the groundbreaking work by Godfried Toussaint, which discovered that Euclidean geometry can generate traditional musical rhythms from around the world.

### What makes this implementation special:

1. **Bias Feature**: Unlike standard Euclidean algorithms, this version allows you to control whether hits cluster toward the beginning or end of the pattern
2. **Center-Weighted Placement**: Hits are placed from the center outward, creating more musical and natural-feeling rhythms
3. **Rotation Support**: Easily shift patterns to find the perfect groove

### Example Patterns:
- **Kick (4 hits in 16 steps)**: Classic four-on-the-floor
- **Snare (2 hits in 16 steps, +4 rotation)**: Backbeat on 2 and 4
- **Hi-hat (8 hits in 16 steps)**: Driving eighth-note pattern
- **Perc (3 hits in 16 steps, 0.3 bias)**: Front-heavy triplet feel

## Browser Compatibility

- Chrome 88+
- Firefox 85+
- Safari 14+
- Edge 88+

Web Audio API required for full functionality.

## Technical Architecture

```
src/
├── components/           # React components (36 tests)
│   ├── TrackCircle.tsx      # Circular track visualization with real-time step display
│   ├── ControlPanel.tsx     # Parameter controls with live updates
│   └── TransportBar.tsx     # Playback controls with BPM/swing
├── hooks/               # Custom React hooks (20 tests)
│   └── useAudio.ts          # Core audio engine with moistpeace.com timing
├── utils/               # Core algorithms (32 tests)
│   ├── euclidAlgorithm.ts   # Max/MSP algorithm port with bias/rotation
│   └── drumSounds.ts        # PolySynth-based 808 drum machine
├── types.ts             # TypeScript definitions
└── assets/              # Static resources
```

### Key Implementation Details

**Audio Engine (`useAudio.ts`)**
- 25ms lookahead scheduling for precise timing
- Polyphonic synthesis for simultaneous drum hits
- Real-time parameter updates without audio dropouts

**Euclidean Algorithm (`euclidAlgorithm.ts`)**  
- Center-weighted hit placement
- Bias control for rhythm character
- Pattern rotation for groove variation

**Drum Machine (`drumSounds.ts`)**
- 808-style synthesized sounds
- Individual track volume and effects
- Master volume with proper gain staging

## Development Status

- Core sequencing, bias, rotation, swing, time signature, mute/solo, and volume controls implemented
- TypeScript build is clean (`npm run build`)
- Targeted for modern browsers supporting the Web Audio API

## Contributing

1. Fork the repository
2. Create a feature branch: `git checkout -b feature-name`
3. Make your changes and test thoroughly (`npm test`)
4. Ensure build passes (`npm run build`)
5. Submit a pull request

### Potential Enhancements
- Additional drum sounds and synthesizers
- Pattern save/load functionality
- MIDI input/output support
- Advanced effects (reverb, delay, filters)
- Song mode with pattern chaining

## License

MIT License - see LICENSE file for details.

## Acknowledgments

- **Godfried Toussaint** for discovering the connection between Euclidean geometry and musical rhythms
- **Original Max/MSP Implementation** for the advanced bias and rotation features
- **Tone.js** for providing excellent Web Audio API abstraction
- **808 Drum Machine** for inspiring the classic drum sounds

---

Built with ❤️ using React, TypeScript, and Tone.js
