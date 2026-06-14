import { useState, useEffect, useRef } from 'react'
import { playTick } from './audio'



// Import assets
import logoImg from './assets/Logo.png'
import machiTextImg from './assets/MACHI.png'
import buildingBg from './assets/building-bg.png'
import matchiRingSound from './assets/sounds/matchi_ring_sound.mp3'

// Building 1 (Machi Tower)
import b1_stage1 from './assets/pixel-building-bg-removed 1.png'
import b1_complete from './assets/pixel-building-bg-removed.png'

// Building 2 (Teal Office)
import b2_stage1 from './assets/pixel-building-2-removebg-preview 1.png'
import b2_stage2 from './assets/pixel-building-2-removebg-preview 2.png'
import b2_stage3 from './assets/pixel-building-2-removebg-preview 3.png'
import b2_complete from './assets/pixel-building-2-removebg-preview.png'

// Building 3 (Sky Apartments)
import b3_stage1 from './assets/pixel-building-3-removebg-preview 1.png'
import b3_stage2 from './assets/pixel-building-3-removebg-preview 2.png'
import b3_complete from './assets/pixel-building-3-removebg-preview.png'

interface PlacedBuilding {
  id: string
  type: number
  date: number
  duration?: number
}

const BUILDING_TYPES = [
  {
    id: 1,
    name: "Matchi Tower",
    stages: [
      { threshold: 0, src: b1_stage1 },
      { threshold: 0.7, src: b1_complete }
    ],
    completeSrc: b1_complete
  },
  {
    id: 2,
    name: "Teal Office",
    stages: [
      { threshold: 0, src: b2_stage1 },
      { threshold: 0.3, src: b2_stage2 },
      { threshold: 0.6, src: b2_stage3 },
      { threshold: 0.85, src: b2_complete }
    ],
    completeSrc: b2_complete
  },
  {
    id: 3,
    name: "Sky Apartments",
    stages: [
      { threshold: 0, src: b3_stage1 },
      { threshold: 0.45, src: b3_stage2 },
      { threshold: 0.8, src: b3_complete }
    ],
    completeSrc: b3_complete
  }
]

type TimerState = 'idle' | 'running' | 'paused' | 'abandoned' | 'completed'

function ConfettiCanvas() {
  const canvasRef = useRef<HTMLCanvasElement | null>(null)

  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    let animationId: number
    const colors = ['#4682A9', '#91B8E4', '#FFFBDE', '#E74C3C', '#2ECC71', '#F1C40F']
    const particles: {
      x: number
      y: number
      r: number
      d: number
      color: string
      tilt: number
      tiltAngleIncremental: number
      tiltAngle: number
    }[] = []

    const resizeCanvas = () => {
      if (canvas && canvas.parentElement) {
        canvas.width = canvas.parentElement.clientWidth || 400
        canvas.height = canvas.parentElement.clientHeight || 600
      }
    }
    resizeCanvas()

    for (let i = 0; i < 75; i++) {
      particles.push({
        x: Math.random() * canvas.width,
        y: Math.random() * canvas.height - canvas.height,
        r: Math.random() * 5 + 3,
        d: Math.random() * 2 + 1,
        color: colors[Math.floor(Math.random() * colors.length)],
        tilt: Math.random() * 10 - 5,
        tiltAngleIncremental: Math.random() * 0.07 + 0.02,
        tiltAngle: 0
      })
    }

    const draw = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)
      
      particles.forEach((p, idx) => {
        p.tiltAngle += p.tiltAngleIncremental
        p.y += (Math.cos(p.d) + 3 + p.r / 2) / 2
        p.x += Math.sin(p.tiltAngle)
        p.tilt = Math.sin(p.tiltAngle - idx / 3) * 15

        ctx.beginPath()
        ctx.lineWidth = p.r
        ctx.strokeStyle = p.color
        ctx.moveTo(p.x + p.tilt + p.r / 2, p.y)
        ctx.lineTo(p.x + p.tilt, p.y + p.tilt + p.r / 2)
        ctx.stroke()

        if (p.y > canvas.height) {
          particles[idx] = {
            ...p,
            x: Math.random() * canvas.width,
            y: -20,
            tilt: Math.random() * 10 - 5
          }
        }
      })

      animationId = requestAnimationFrame(draw)
    }

    draw()

    window.addEventListener('resize', resizeCanvas)
    return () => {
      cancelAnimationFrame(animationId)
      window.removeEventListener('resize', resizeCanvas)
    }
  }, [])

  return (
    <canvas 
      ref={canvasRef} 
      style={{ 
        position: 'absolute', 
        top: 0, 
        left: 0, 
        width: '100%', 
        height: '100%', 
        pointerEvents: 'none',
        zIndex: 5
      }} 
    />
  )
}

function App() {
  // Persistence state
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>(() => {
    const savedMatchi = localStorage.getItem('matchi_city_buildings')
    if (savedMatchi) return JSON.parse(savedMatchi)
    const savedMachi = localStorage.getItem('machi_city_buildings')
    return savedMachi ? JSON.parse(savedMachi) : []
  })
  
  const [currentBuildingType, setCurrentBuildingType] = useState<number>(() => {
    const savedMatchi = localStorage.getItem('matchi_current_building_type')
    if (savedMatchi) return parseInt(savedMatchi, 10)
    const savedMachi = localStorage.getItem('machi_current_building_type')
    return savedMachi ? parseInt(savedMachi, 10) : 1
  })

  // Timer states
  const [duration, setDuration] = useState<number>(() => {
    const saved = localStorage.getItem('matchi_timer_duration')
    return saved ? parseInt(saved, 10) : 25
  })
  const [timeLeft, setTimeLeft] = useState<number>(() => {
    const saved = localStorage.getItem('matchi_timer_duration')
    const mins = saved ? parseInt(saved, 10) : 25
    return mins * 60
  })
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [abandonedSprite, setAbandonedSprite] = useState<string>('')

  // Settings
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('matchi_settings_sound')
    return saved !== 'false' // default true
  })
  const [tickEnabled, setTickEnabled] = useState<boolean>(() => {
    const saved = localStorage.getItem('matchi_settings_tick')
    return saved === 'true' // default false
  })
  const [volume, setVolume] = useState<number>(() => {
    const saved = localStorage.getItem('matchi_settings_volume')
    return saved ? parseFloat(saved) : 0.5
  })
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [selectedBuilding, setSelectedBuilding] = useState<PlacedBuilding | null>(null)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const ringAudioRef = useRef<HTMLAudioElement | null>(null)

  const playRingSound = () => {
    if (!ringAudioRef.current) {
      ringAudioRef.current = new Audio(matchiRingSound)
      ringAudioRef.current.loop = true
    }
    ringAudioRef.current.volume = volume
    ringAudioRef.current.currentTime = 0
    ringAudioRef.current.play().catch(e => console.warn("Failed to play ring sound:", e))
  }

  const stopRingSound = () => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause()
      ringAudioRef.current.currentTime = 0
    }
  }

  useEffect(() => {
    return () => {
      if (ringAudioRef.current) {
        ringAudioRef.current.pause()
        ringAudioRef.current.src = ''
      }
    }
  }, [])

  // Sync state back to localStorage
  useEffect(() => {
    localStorage.setItem('matchi_city_buildings', JSON.stringify(placedBuildings))
  }, [placedBuildings])

  useEffect(() => {
    localStorage.setItem('matchi_current_building_type', currentBuildingType.toString())
  }, [currentBuildingType])

  useEffect(() => {
    localStorage.setItem('matchi_timer_duration', duration.toString())
  }, [duration])

  useEffect(() => {
    localStorage.setItem('matchi_settings_sound', soundEnabled.toString())
  }, [soundEnabled])

  useEffect(() => {
    localStorage.setItem('matchi_settings_tick', tickEnabled.toString())
  }, [tickEnabled])

  useEffect(() => {
    localStorage.setItem('matchi_settings_volume', volume.toString())
  }, [volume])

  useEffect(() => {
    if (ringAudioRef.current) {
      ringAudioRef.current.volume = volume
    }
  }, [volume])

  // Sync Electron Always On Top status on start
  useEffect(() => {
    const checkAlwaysOnTop = async () => {
      if (window.ipcRenderer) {
        try {
          const isTop = await window.ipcRenderer.invoke('window-get-always-on-top')
          setIsAlwaysOnTop(isTop)
        } catch (e) {
          console.error(e)
        }
      }
    }
    checkAlwaysOnTop()
  }, [])

  // Timer countdown loop
  useEffect(() => {
    let intervalId: NodeJS.Timeout | null = null

    if (timerState === 'running') {
      intervalId = setInterval(() => {
        setTimeLeft((prev) => {
          if (prev <= 1) {
            return 0
          }
          
          if (tickEnabled && soundEnabled) {
            playTick()
          }
          
          return prev - 1
        })
      }, 1000)
    }

    return () => {
      if (intervalId) clearInterval(intervalId)
    }
  }, [timerState, tickEnabled, soundEnabled])

  // Trigger completion safely to avoid stale closures
  useEffect(() => {
    if (timerState === 'running' && timeLeft === 0) {
      handleCompletion()
    }
  }, [timeLeft, timerState])

  // Handle Dragging
  useEffect(() => {
    if (!isDragging) return

    const onMouseMove = (e: MouseEvent) => {
      handleDrag(e.clientX, e.clientY)
    }

    const onMouseUp = () => {
      setIsDragging(false)
    }

    window.addEventListener('mousemove', onMouseMove)
    window.addEventListener('mouseup', onMouseUp)

    return () => {
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mouseup', onMouseUp)
    }
  }, [isDragging])

  const handleDrag = (clientX: number, clientY: number) => {
    if (!svgRef.current || timerState !== 'idle') return
    const rect = svgRef.current.getBoundingClientRect()
    const centerX = rect.left + rect.width / 2
    const centerY = rect.top + rect.height / 2
    const dx = clientX - centerX
    const dy = clientY - centerY

    // Angle starting from 12 o'clock, clockwise
    let angle = Math.atan2(dy, dx) + Math.PI / 2
    if (angle < 0) {
      angle += 2 * Math.PI
    }

    // Map angle [0, 2*PI] to [0, 60] minutes
    let minutes = Math.round((angle / (2 * Math.PI)) * 60)
    
    // Clamp duration between 1 and 60 minutes
    minutes = Math.max(1, Math.min(60, minutes))
    
    setDuration(minutes)
    setTimeLeft(minutes * 60)
  }

  // Window Controls
  const handleMinimize = () => {
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-minimize')
    }
  }

  const handleClose = () => {
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-close')
    }
  }

  const handleToggleAlwaysOnTop = async () => {
    if (window.ipcRenderer) {
      try {
        const isTop = await window.ipcRenderer.invoke('window-toggle-always-on-top')
        setIsAlwaysOnTop(isTop)
      } catch (e) {
        setIsAlwaysOnTop(!isAlwaysOnTop)
      }
    } else {
      setIsAlwaysOnTop(!isAlwaysOnTop)
    }
  }

  // Timer controls
  const handleStart = () => {
    if (timerState === 'idle') {
      setTimerState('running')
    }
  }

  const handlePauseResume = () => {
    if (timerState === 'running') {
      setTimerState('paused')
    } else if (timerState === 'paused') {
      setTimerState('running')
    }
  }

  const handleReset = () => {
    if (timerState === 'running' || timerState === 'paused') {
      // Abandoned state transition
      const progress = (duration * 60 - timeLeft) / (duration * 60)
      const currentBuilding = BUILDING_TYPES[currentBuildingType - 1]
      let currentSprite = currentBuilding.stages[0].src
      for (const stage of currentBuilding.stages) {
        if (progress >= stage.threshold) {
          currentSprite = stage.src
        }
      }
      setAbandonedSprite(currentSprite)
      setTimerState('abandoned')

      // Wait 3 seconds showing halted building, then reset
      setTimeout(() => {
        setTimerState('idle')
        setTimeLeft(duration * 60)
      }, 3000)
    } else {
      // Idle or completed
      setTimerState('idle')
      setTimeLeft(duration * 60)
    }
  }

  const handleCompletion = () => {
    setTimerState('completed')
    
    if (soundEnabled) {
      playRingSound()
    }

    // Native Notification
    if ('Notification' in window) {
      if (Notification.permission === 'granted') {
        new Notification("Matchi Pomodoro", {
          body: `Nicely done! You constructed a ${BUILDING_TYPES[currentBuildingType - 1].name}! 🏢`,
        })
      } else if (Notification.permission !== 'denied') {
        Notification.requestPermission().then(permission => {
          if (permission === 'granted') {
            new Notification("Matchi Pomodoro", {
              body: `Nicely done! You constructed a ${BUILDING_TYPES[currentBuildingType - 1].name}! 🏢`,
            })
          }
        })
      }
    }

    // Add building to grid
    const newBuilding: PlacedBuilding = {
      id: Math.random().toString(36).substring(2, 9),
      type: currentBuildingType,
      date: Date.now(),
      duration: duration
    }
    setPlacedBuildings(prev => [...prev, newBuilding])
  }

  const handleDismissModal = () => {
    stopRingSound()
    setTimerState('idle')
    setCurrentBuildingType(prev => (prev % 3) + 1)
    setTimeLeft(duration * 60)
  }

  const handleResetCity = () => {
    if (window.confirm("Are you sure you want to clear your city? This will reset all your progress!")) {
      setPlacedBuildings([])
    }
  }

  // Formatting MM:SS
  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`
  }

  // Calculate building sprites and labels
  const progress = (duration * 60 - timeLeft) / (duration * 60)
  const currentBuilding = BUILDING_TYPES[currentBuildingType - 1]
  
  let currentSprite = currentBuilding.stages[0].src
  for (const stage of currentBuilding.stages) {
    if (progress >= stage.threshold) {
      currentSprite = stage.src
    }
  }

  let constructionLabel = "Plan Session"
  if (timerState === 'running') {
    constructionLabel = `Constructing ${currentBuilding.name}...`
  } else if (timerState === 'paused') {
    constructionLabel = "Construction Paused"
  } else if (timerState === 'abandoned') {
    constructionLabel = "Construction Halted!"
  } else if (timerState === 'completed') {
    constructionLabel = "Building Completed!"
  }

  // SVG parameters
  const radius = 75
  const circumference = 2 * Math.PI * radius
  const progressFraction = timerState === 'idle'
    ? duration / 60
    : timeLeft / (duration * 60)
  const strokeDashoffset = circumference * (1 - progressFraction)

  // Grid Cells list (minimum 12, grows in rows of 4)
  const numCells = Math.max(12, Math.ceil(placedBuildings.length / 4) * 4)
  const gridCells = Array.from({ length: numCells })

  // Stats completed today
  const startOfDay = new Date()
  startOfDay.setHours(0, 0, 0, 0)
  const completedToday = placedBuildings.filter(b => b.date >= startOfDay.getTime()).length

  return (
    <>
      {/* Title Bar */}
      <div className="titlebar">
        <div className="titlebar-logo">
          <img src={logoImg} alt="Matchi" />
          <img src={machiTextImg} alt="MATCHI" style={{ height: '10px', width: 'auto', marginLeft: '2px' }} />
        </div>
        <div className="titlebar-controls">
          <button 
            className={`titlebar-btn ${isSettingsOpen ? 'active' : ''}`}
            onClick={() => setIsSettingsOpen(true)}
            title="Settings"
          >
            ⚙️
          </button>
          <button 
            className={`titlebar-btn ${isAlwaysOnTop ? 'active' : ''}`}
            onClick={handleToggleAlwaysOnTop}
            title={isAlwaysOnTop ? "Always-On-Top: On" : "Always-On-Top: Off"}
          >
            📌
          </button>
          <button className="titlebar-btn" onClick={handleMinimize} title="Minimize">
            ➖
          </button>
          <button className="titlebar-btn close" onClick={handleClose} title="Close">
            ❌
          </button>
        </div>
      </div>

      {/* Main Container */}
      <div className="app-container">
        
        {/* Timer Section */}
        <div className="timer-section">
          <div 
            className="svg-slider-container" 
            onMouseDown={(e) => {
              if (timerState === 'idle') {
                setIsDragging(true)
                handleDrag(e.clientX, e.clientY)
              }
            }}
          >
            <svg 
              ref={svgRef}
              width="190" 
              height="190" 
              viewBox="0 0 190 190"
              style={{ transform: 'rotate(-90deg)' }}
            >
              {/* Background Circle */}
              <circle
                cx="95"
                cy="95"
                r={radius}
                className="timer-circle-bg"
                strokeWidth="6"
              />
              
              {/* Progress Circle */}
              <circle
                cx="95"
                cy="95"
                r={radius}
                className="timer-circle-progress"
                strokeWidth="8"
                strokeDasharray={circumference}
                strokeDashoffset={strokeDashoffset}
                stroke={timerState === 'abandoned' ? 'var(--accent-red)' : 'var(--primary-teal)'}
              />

              {/* Click target wrapper for smoother dragging */}
              {timerState === 'idle' && (
                <circle
                  cx="95"
                  cy="95"
                  r={radius}
                  className="timer-circle-interactive"
                />
              )}
            </svg>

            {/* Centered Timer Text */}
            <div className="timer-center-text">
              <span className="timer-time">{formatTime(timeLeft)}</span>
              <span className="timer-label">{timerState === 'idle' ? 'set time' : timerState}</span>
            </div>
          </div>

          {/* Controls */}
          <div className="controls-container">
            {timerState === 'idle' && (
              <button className="machi-btn machi-btn-primary" onClick={handleStart}>
                ▶ Start
              </button>
            )}

            {(timerState === 'running' || timerState === 'paused') && (
              <>
                <button className="machi-btn machi-btn-secondary" onClick={handlePauseResume}>
                  {timerState === 'running' ? '⏸ Pause' : '▶ Resume'}
                </button>
                <button className="machi-btn machi-btn-danger" onClick={handleReset}>
                  ⏹ Abandon
                </button>
              </>
            )}

            {(timerState === 'completed' || timerState === 'abandoned') && (
              <button className="machi-btn machi-btn-secondary" disabled>
                {timerState === 'completed' ? '🎉 Success' : '💥 Halted'}
              </button>
            )}
          </div>
        </div>

        {/* Building Stage Area */}
        <div className="construction-area">
          <div className="construction-building-wrapper" style={{ backgroundImage: `url(${buildingBg})`, backgroundSize: '100% 100%' }}>
            {timerState !== 'idle' && timerState !== 'abandoned' && (
              <div className="construction-scaffold"></div>
            )}
            
            {timerState === 'abandoned' ? (
              <img 
                src={abandonedSprite} 
                className="building-sprite collapsed" 
                alt="Collapsed Building" 
              />
            ) : (
              timerState !== 'idle' && (
                <img 
                  src={currentSprite} 
                  className="building-sprite" 
                  alt="Building Progression" 
                />
              )
            )}
          </div>
          <div className={`construction-label ${timerState === 'abandoned' ? 'halted' : ''}`}>
            {constructionLabel}
          </div>
        </div>

        {/* Skyline / City Section */}
        <div className="city-section">
          <div className="city-header">
            <div className="city-title">
              🏢 Matchi City
            </div>
            <div className="city-stats" title="Completed today / Total completed">
              Today: {completedToday} | Total: {placedBuildings.length}
            </div>
          </div>

          <div className="city-grid">
            {gridCells.map((_, i) => {
              const b = placedBuildings[i]
              return (
                <div 
                  key={i} 
                  className={`grid-cell ${b ? 'occupied' : ''}`}
                  onClick={() => b && setSelectedBuilding(b)}
                  style={{ cursor: b ? 'pointer' : 'default' }}
                >
                  {b ? (
                    <>
                      <img 
                        src={BUILDING_TYPES[b.type - 1].completeSrc} 
                        className="grid-building-img" 
                        alt="Completed Building" 
                        title={`Click to view details of slot ${i + 1}`}
                      />
                      <span className="grid-building-index">{i + 1}</span>
                    </>
                  ) : (
                    <span className="grid-building-index" style={{ color: 'rgba(70, 130, 169, 0.2)' }}>{i + 1}</span>
                  )}
                </div>
              )
            })}
          </div>

          {/* Settings and options */}
          <div className="settings-bar">
            <div className="toggle-group">
              <label className="setting-toggle" title="Tick sound during countdown">
                <input 
                  type="checkbox" 
                  checked={tickEnabled} 
                  onChange={(e) => setTickEnabled(e.target.checked)} 
                />
                Tick
              </label>
              <label className="setting-toggle" title="Enable chime and ticking sounds">
                <input 
                  type="checkbox" 
                  checked={soundEnabled} 
                  onChange={(e) => setSoundEnabled(e.target.checked)} 
                />
                Sound
              </label>
            </div>
            {placedBuildings.length > 0 && (
              <span className="reset-city-link" onClick={handleResetCity}>
                Reset City
              </span>
            )}
          </div>
        </div>

      </div>

      {/* Completion Celebrate Modal */}
      {timerState === 'completed' && (
        <div className="modal-overlay">
          <ConfettiCanvas />
          <div className="modal-content">
            <h2 className="modal-title">CONGRATULATIONS!</h2>
            <p className="modal-text">Congratulations for Completing a Task</p>
            <div className="modal-building-display">
              <img
                src={BUILDING_TYPES[currentBuildingType - 1].completeSrc}
                className="modal-building-img"
                alt="Completed Building"
              />
            </div>
            <p className="modal-text" style={{ fontStyle: 'italic', opacity: 0.8 }}>
              Your new {BUILDING_TYPES[currentBuildingType - 1].name} has been added to Matchi City!
            </p>
            <button className="machi-btn machi-btn-primary" onClick={handleDismissModal}>
              Awesome! 🏢
            </button>
          </div>
        </div>
      )}

      {/* Settings Modal */}
      {isSettingsOpen && (
        <div className="modal-overlay">
          <div className="modal-content">
            <h2 className="modal-title">SETTINGS</h2>
            
            <div className="volume-slider-container">
              <label className="modal-text" style={{ fontWeight: 600 }}>Ringtone Volume</label>
              <div className="volume-row">
                <span style={{ fontSize: '16px' }}>🔇</span>
                <input
                  type="range"
                  min="0"
                  max="1"
                  step="0.05"
                  className="volume-slider"
                  value={volume}
                  onChange={(e) => setVolume(parseFloat(e.target.value))}
                />
                <span style={{ fontSize: '16px' }}>🔊</span>
                <span className="volume-value">{Math.round(volume * 100)}%</span>
              </div>
            </div>

            <button 
              className="machi-btn machi-btn-secondary"
              onClick={() => {
                if (ringAudioRef.current && !ringAudioRef.current.paused) {
                  stopRingSound()
                } else {
                  playRingSound()
                  // auto stop after 2s
                  setTimeout(() => {
                    stopRingSound()
                  }, 2000)
                }
              }}
              style={{ width: '100%', justifyContent: 'center' }}
            >
              🎵 Test Sound
            </button>

            <button 
              className="machi-btn machi-btn-primary" 
              onClick={() => {
                stopRingSound()
                setIsSettingsOpen(false)
              }}
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              Save & Close
            </button>
          </div>
        </div>
      )}

      {/* Building Details Modal */}
      {selectedBuilding && (
        <div className="modal-overlay" onClick={() => setSelectedBuilding(null)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">BUILDING DETAILS</h2>
            
            <div className="modal-building-display" style={{ height: '70px', width: '70px' }}>
              <img
                src={BUILDING_TYPES[selectedBuilding.type - 1].completeSrc}
                className="modal-building-img"
                alt="Building Details"
              />
            </div>

            <p className="modal-text" style={{ fontSize: '15px', fontWeight: 600 }}>
              {BUILDING_TYPES[selectedBuilding.type - 1].name}
            </p>

            <div style={{ textAlign: 'left', width: '100%', fontSize: '12px', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <div>
                <strong>⏱ Duration Set:</strong> {selectedBuilding.duration || 25} minutes
              </div>
              <div>
                <strong>📅 Completed On:</strong> {new Date(selectedBuilding.date).toLocaleString()}
              </div>
            </div>

            <button 
              className="machi-btn machi-btn-primary" 
              onClick={() => setSelectedBuilding(null)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              Close
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App


