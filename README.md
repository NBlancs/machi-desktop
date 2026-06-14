# Matchi Pomodoro

Matchi Pomodoro is a cozy, pixel-art style Pomodoro timer Electron desktop application designed to help you stay focused while building your very own virtual city skyline. The application features the Matchi brand design system with a cream background, deep teal blue primary styling, sky blue secondary accents, and VT323 pixel-style typography.

---

## Key Features

### Core Timer UI
* **Interactive SVG Arc Slider**: Drag along the circular slider to set your session duration (clamped from 1 to 60 minutes).
* **Clock Countdown**: The circular arc depletes clockwise as time ticks down, displaying remaining time inside the circle in MM:SS format.
* **Controls**: Easily Start, Pause, Resume, or Abandon active sessions.

### City Building Grid Progression
* **Active Scaffolding**: Watch a pixel-art building construct in stages (foundation to floors to roof) live as your focus timer runs.
* **Mismatched Building Types**: Cycles between 3 custom building types (Matchi Tower, Teal Office, and Sky Apartments).
* **Grid Skyline Persistence**: Completed sessions place a finished building in your local skyline grid. The grid automatically grows in rows of 4 columns to support your growing metropolis.
* **Click to Inspect**: Click on any building in your city grid to open a details modal showing the set duration and completion timestamp.
* **Abandonment Collapse**: Resetting or abandoning a session triggers a grayed-out sepia collapse animation, halting construction.

### Settings and Volume Control
* **Looping Ringtone**: The completion chime (matchi_ring_sound.mp3) loops continuously when a session ends and only stops when the user closes the modal.
* **Settings Modal**: Click the gear icon in the title bar to open settings, where you can adjust the ringtone volume from 0% (mute) to 100% and run a 2-second audio preview test.
* **Ticker Toggle**: Optional retro mechanical click/tick audio that plays every second of the countdown.

### Desktop Integration and Privacy
* **Frameless Compact Window**: Compact 400x600px window with custom window controls (Minimize, Close) and custom title bar dragging.
* **Always-On-Top Pin Option**: Pin the app using the pin icon so it stays floated over your code editor or browser while you focus.
* **Offline and Private**: All settings, stats, and building progress are saved locally (localStorage) on your machine. No internet connection or accounts required.

---

## Technical Stack

* **Shell Container**: Electron
* **Frontend Library**: React (with TypeScript)
* **Build Tool**: Vite
* **Audio Synthesis**: Web Audio API (for mechanical seconds ticks)
* **Packaging Tool**: Electron Builder
* **Styling**: Vanilla CSS

---

## Developer Guide

### Prerequisites
* Node.js (version 18 or higher recommended)
* npm (package manager)

### Installation
Clone the repository and install dependencies:
```bash
npm install
```

### Development
Start the Vite development server and launch the Electron application:
```bash
npm run dev
```

### Type Checking and Linting
To check TypeScript compilation and lint the code:
```bash
npx tsc --noEmit
npm run lint
```

### Packaging (Creating the Installer)
To package the application into a single executable installer (.exe on Windows):

1. **Windows Developer Mode**: Ensure Windows Developer Mode is enabled in your system settings (Settings > System > For Developers > Developer Mode) to allow the packaging tools to extract symbolic link files.
2. **Build executable**:
   ```bash
   npm run build
   ```
   The generated installer will be saved under the `release/` folder.

---

## Architecture and File Map

* **electron/main.ts**: Sets up the main window properties (frameless, size 400x600px, background colors, custom window taskbar icons) and registers IPC listeners for window minimizes, closes, and always-on-top toggles.
* **electron/preload.ts**: Exposes IPC channels to the renderer process safely using ContextBridge.
* **src/audio.ts**: Houses Web Audio API methods for synthesizing clock ticking sounds.
* **src/App.tsx**: The core React application containing state management, slider dragging mathematics, localStorage synchronizations, and UI views.
* **src/index.css**: Contains the Machi design token styles, viewport constraints, grid definitions, and keyframe animations.
* **public/Logo_256.png**: The 256x256 high-resolution application logo used for packaging.

---

## Security Configurations

The application has been audited and implements the following security protocols:
* **Context Isolation**: Configured `contextIsolation: true` in the main process to isolate preload scripts.
* **Node Integration**: Configured `nodeIntegration: false` in BrowserWindow preferences to prevent the UI from executing arbitrary Node.js commands.
* **Narrow IPC Surface**: Registers only 4 window control IPC channels, which do not accept user input or run shell commands, neutralizing injection vulnerabilities.

