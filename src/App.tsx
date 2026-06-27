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
  description?: string
}

interface CustomRingSound {
  id: string
  name: string
  data: string // base64 string
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

const hasIPC = typeof window !== 'undefined' && !!window.ipcRenderer

async function getStorageItem<T>(key: string, defaultValue: T): Promise<T> {
  if (hasIPC) {
    try {
      const val = await window.ipcRenderer.invoke('store-get', key)
      if (val !== null && val !== undefined) {
        return val as T
      }
      // Migration from localStorage
      try {
        const localVal = localStorage.getItem(key)
        if (localVal !== null) {
          const parsed = JSON.parse(localVal) as T
          await window.ipcRenderer.invoke('store-set', key, parsed)
          return parsed
        }
      } catch (localErr) {
        console.error(`localStorage migration failed for ${key}:`, localErr)
      }
    } catch (e) {
      console.error(`IPC store-get failed for ${key}:`, e)
    }
  } else {
    try {
      const val = localStorage.getItem(key)
      if (val !== null) {
        return JSON.parse(val) as T
      }
    } catch (e) {
      console.error(`localStorage get failed for ${key}:`, e)
    }
  }
  return defaultValue
}

async function setStorageItem<T>(key: string, value: T): Promise<void> {
  if (hasIPC) {
    try {
      await window.ipcRenderer.invoke('store-set', key, value)
      return
    } catch (e) {
      console.error(`IPC store-set failed for ${key}:`, e)
    }
  }
  try {
    localStorage.setItem(key, JSON.stringify(value))
  } catch (e) {
    console.error(`localStorage set failed for ${key}:`, e)
  }
}

function App() {
  const [isLoaded, setIsLoaded] = useState<boolean>(false)

  // Persistence state
  const [placedBuildings, setPlacedBuildings] = useState<PlacedBuilding[]>([])
  const [currentBuildingType, setCurrentBuildingType] = useState<number>(1)

  // Timer states
  const [duration, setDuration] = useState<number>(25)
  const [timeLeft, setTimeLeft] = useState<number>(25 * 60)
  const [timerState, setTimerState] = useState<TimerState>('idle')
  const [isDragging, setIsDragging] = useState<boolean>(false)
  const [abandonedSprite, setAbandonedSprite] = useState<string>('')

  // Settings
  const [isAlwaysOnTop, setIsAlwaysOnTop] = useState<boolean>(false)
  const [soundEnabled, setSoundEnabled] = useState<boolean>(true)
  const [tickEnabled, setTickEnabled] = useState<boolean>(false)
  const [volume, setVolume] = useState<number>(0.5)
  const [isSettingsOpen, setIsSettingsOpen] = useState<boolean>(false)
  const [selectedBuilding, setSelectedBuilding] = useState<PlacedBuilding | null>(null)
  const [selectedRingSound, setSelectedRingSound] = useState<string>('default')
  const [customRingSounds, setCustomRingSounds] = useState<CustomRingSound[]>([])

  // Mini Mode and Transparency settings
  const [isMiniMode, setIsMiniMode] = useState<boolean>(false)
  const [transparentInMini, setTransparentInMini] = useState<boolean>(false)

  // Task description
  const [taskDescription, setTaskDescription] = useState<string>('')
  const [isDescriptionModalOpen, setIsDescriptionModalOpen] = useState<boolean>(false)

  const svgRef = useRef<SVGSVGElement | null>(null)
  const ringAudioRef = useRef<HTMLAudioElement | null>(null)
  const targetTimeRef = useRef<number | null>(null)
  const fileInputRef = useRef<HTMLInputElement | null>(null)

  const playRingSound = () => {
    if (ringAudioRef.current) {
      ringAudioRef.current.pause()
      ringAudioRef.current = null
    }

    let soundSrc = matchiRingSound
    if (selectedRingSound !== 'default') {
      const custom = customRingSounds.find(s => s.id === selectedRingSound)
      if (custom) {
        soundSrc = custom.data
      }
    }

    ringAudioRef.current = new Audio(soundSrc)
    ringAudioRef.current.loop = true
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

  const handleImportSound = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    if (!file.type.startsWith('audio/')) {
      alert('Please select a valid audio file.')
      return
    }

    const reader = new FileReader()
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string
      if (!dataUrl) return

      const soundId = 'ring_' + Date.now()
      const soundName = file.name.replace(/\.[^/.]+$/, "")

      const newSound: CustomRingSound = {
        id: soundId,
        name: soundName,
        data: dataUrl
      }

      setCustomRingSounds(prev => [...prev, newSound])
      setSelectedRingSound(soundId)

      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }
    }
    reader.onerror = () => {
      alert('Failed to read the audio file.')
    }
    reader.readAsDataURL(file)
  }

  const handleDeleteSound = (id: string) => {
    stopRingSound()
    setCustomRingSounds(prev => prev.filter(s => s.id !== id))
    if (selectedRingSound === id) {
      setSelectedRingSound('default')
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

  // Load state on mount
  useEffect(() => {
    async function loadAllState() {
      // 1. placedBuildings (with legacy fallback)
      let buildings = await getStorageItem<PlacedBuilding[] | null>('matchi_city_buildings', null)
      if (!buildings) {
        buildings = await getStorageItem<PlacedBuilding[] | null>('machi_city_buildings', null)
      }
      if (buildings) {
        setPlacedBuildings(buildings)
      }

      // 2. currentBuildingType (with legacy fallback)
      let bType = await getStorageItem<number | null>('matchi_current_building_type', null)
      if (bType === null) {
        bType = await getStorageItem<number | null>('machi_current_building_type', null)
      }
      if (bType !== null) {
        setCurrentBuildingType(bType)
      }

      // 3. duration
      const dur = await getStorageItem<number>('matchi_timer_duration', 25)
      setDuration(dur)
      setTimeLeft(dur * 60)

      // 4. settings
      const sound = await getStorageItem<boolean>('matchi_settings_sound', true)
      setSoundEnabled(sound)

      const tick = await getStorageItem<boolean>('matchi_settings_tick', false)
      setTickEnabled(tick)

      const vol = await getStorageItem<number>('matchi_settings_volume', 0.5)
      setVolume(vol)

      const transMini = await getStorageItem<boolean>('matchi_settings_transparent_in_mini', false)
      setTransparentInMini(transMini)

      const selRing = await getStorageItem<string>('matchi_settings_selected_ring', 'default')
      setSelectedRingSound(selRing)

      const customRings = await getStorageItem<CustomRingSound[]>('matchi_settings_custom_rings', [])
      setCustomRingSounds(customRings)

      setIsLoaded(true)
    }
    loadAllState()
  }, [])

  // Sync state back to persistent storage
  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_city_buildings', placedBuildings)
  }, [placedBuildings, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_current_building_type', currentBuildingType)
  }, [currentBuildingType, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_timer_duration', duration)
  }, [duration, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_sound', soundEnabled)
  }, [soundEnabled, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_tick', tickEnabled)
  }, [tickEnabled, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_volume', volume)
  }, [volume, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_transparent_in_mini', transparentInMini)
  }, [transparentInMini, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_selected_ring', selectedRingSound)
  }, [selectedRingSound, isLoaded])

  useEffect(() => {
    if (!isLoaded) return
    setStorageItem('matchi_settings_custom_rings', customRingSounds)
  }, [customRingSounds, isLoaded])

  useEffect(() => {
    if (ringAudioRef.current) {
      ringAudioRef.current.volume = volume
    }
  }, [volume])

  // Sync body class for styling and transparency
  useEffect(() => {
    if (isMiniMode) {
      document.body.classList.add('mini-mode')
      if (transparentInMini) {
        document.body.classList.add('transparent-bg')
        document.body.classList.remove('solid-bg')
      } else {
        document.body.classList.add('solid-bg')
        document.body.classList.remove('transparent-bg')
      }
    } else {
      document.body.classList.remove('mini-mode')
      document.body.classList.remove('transparent-bg')
      document.body.classList.remove('solid-bg')
    }
  }, [isMiniMode, transparentInMini])

  const handleEnterMiniMode = () => {
    setIsMiniMode(true)
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-set-mini-mode', true)
    }
  }

  const handleExitMiniMode = () => {
    setIsMiniMode(false)
    if (window.ipcRenderer) {
      window.ipcRenderer.send('window-set-mini-mode', false)
    }
  }

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
      // Set the target end time when starting or resuming
      targetTimeRef.current = Date.now() + timeLeft * 1000
      let lastTickSecond = Math.ceil(timeLeft)

      intervalId = setInterval(() => {
        const now = Date.now()
        const target = targetTimeRef.current ?? 0
        const diffMs = target - now
        const remainingSeconds = Math.max(0, Math.ceil(diffMs / 1000))

        setTimeLeft(remainingSeconds)

        if (remainingSeconds > 0) {
          if (remainingSeconds < lastTickSecond) {
            if (tickEnabled && soundEnabled) {
              playTick()
            }
            lastTickSecond = remainingSeconds
          }
        }
      }, 200)
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
        setTaskDescription('')
      }, 3000)
    } else {
      // Idle or completed
      setTimerState('idle')
      setTimeLeft(duration * 60)
      setTaskDescription('')
    }
  }

  const handleCompletion = () => {
    setTimerState('completed')
    
    // Auto-exit mini mode when completed so the user can see their city and the celebration modal
    if (isMiniMode) {
      handleExitMiniMode()
    }

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
      duration: duration,
      description: taskDescription || undefined
    }
    setPlacedBuildings(prev => [...prev, newBuilding])
  }

  const handleDismissModal = () => {
    stopRingSound()
    setTimerState('idle')
    setCurrentBuildingType(prev => (prev % 3) + 1)
    setTimeLeft(duration * 60)
    setTaskDescription('')
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

  if (!isLoaded) {
    return <div style={{ backgroundColor: '#FFFBDE', width: '100vw', height: '100vh' }}></div>
  }

  return (
    <>
      {isMiniMode ? (
        /* Mini Mode Layout */
        <div className="mini-container">
          {/* Mini Titlebar */}
          <div className="mini-titlebar">
            <div className="mini-titlebar-drag" style={{ flex: 1, height: '100%', WebkitAppRegion: 'drag' } as React.CSSProperties} />
            <div className="mini-titlebar-controls">
              <button 
                className={`titlebar-btn ${isAlwaysOnTop ? 'active' : ''}`}
                onClick={handleToggleAlwaysOnTop}
                title={isAlwaysOnTop ? "Always-On-Top: On" : "Always-On-Top: Off"}
              >
                📌
              </button>
              <button 
                className="titlebar-btn"
                onClick={handleExitMiniMode}
                title="Exit Mini Mode"
              >
                ↗️
              </button>
              <button className="titlebar-btn close" onClick={handleClose} title="Close">
                ❌
              </button>
            </div>
          </div>
          
          {/* Timer Section (Mini) */}
          <div className="timer-section mini">
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

            {timerState !== 'idle' && taskDescription && (
              <div className="active-task-label" title={taskDescription}>
                Task: {taskDescription}
              </div>
            )}

            {/* Controls */}
            <div className="controls-container">
              {timerState === 'idle' && (
                <>
                  <button className="machi-btn machi-btn-primary" onClick={handleStart}>
                    ▶ Start
                  </button>
                  <button 
                    className={`machi-btn machi-btn-secondary ${taskDescription ? 'active' : ''}`}
                    onClick={() => setIsDescriptionModalOpen(true)}
                    title={taskDescription ? `Task: ${taskDescription}` : "Add Task Description"}
                  >
                    📝
                  </button>
                </>
              )}

              {(timerState === 'running' || timerState === 'paused') && (
                <>
                  <button className="machi-btn machi-btn-secondary" onClick={handlePauseResume}>
                    {timerState === 'running' ? '⏸' : '▶'}
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
        </div>
      ) : (
        /* Normal Mode Layout */
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
              <button 
                className="titlebar-btn"
                onClick={handleEnterMiniMode}
                title="Mini Mode"
              >
                🗗
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

              {timerState !== 'idle' && taskDescription && (
                <div className="active-task-label" title={taskDescription}>
                  Task: {taskDescription}
                </div>
              )}

              {/* Controls */}
              <div className="controls-container">
                {timerState === 'idle' && (
                  <>
                    <button className="machi-btn machi-btn-primary" onClick={handleStart}>
                      ▶ Start
                    </button>
                    <button 
                      className={`machi-btn machi-btn-secondary ${taskDescription ? 'active' : ''}`}
                      onClick={() => setIsDescriptionModalOpen(true)}
                      title={taskDescription ? `Task: ${taskDescription}` : "Add Task Description"}
                    >
                      📝 {taskDescription ? 'Edit Task' : 'Add Task'}
                    </button>
                  </>
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
        </>
      )}

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

            <div className="ringtone-select-container" style={{ width: '100%', textAlign: 'left', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <label className="modal-text" style={{ fontWeight: 600 }}>Ringtone Sound</label>
              <div style={{ display: 'flex', gap: '8px', width: '100%' }}>
                <select
                  value={selectedRingSound}
                  onChange={(e) => {
                    stopRingSound()
                    setSelectedRingSound(e.target.value)
                  }}
                  style={{
                    flexGrow: 1,
                    padding: '6px 8px',
                    borderRadius: '8px',
                    border: '2px solid var(--dark-teal)',
                    backgroundColor: 'white',
                    color: 'var(--dark-teal)',
                    fontFamily: 'var(--font-sans)',
                    fontSize: '12px',
                    outline: 'none',
                    cursor: 'pointer'
                  }}
                >
                  <option value="default">Default Chime</option>
                  {customRingSounds.map((sound) => (
                    <option key={sound.id} value={sound.id}>
                      {sound.name}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  className="machi-btn machi-btn-secondary"
                  style={{ padding: '6px 12px', fontSize: '12px', height: 'auto', border: '2px solid var(--dark-teal)', borderRadius: '8px', boxShadow: 'none' }}
                  onClick={() => fileInputRef.current?.click()}
                >
                  📥 Import
                </button>
                <input
                  type="file"
                  ref={fileInputRef}
                  accept="audio/*"
                  onChange={handleImportSound}
                  style={{ display: 'none' }}
                />
              </div>

              {customRingSounds.length > 0 && (
                <div 
                  className="custom-sounds-list"
                  style={{
                    maxHeight: '80px',
                    overflowY: 'auto',
                    width: '100%',
                    backgroundColor: 'rgba(70, 130, 169, 0.05)',
                    borderRadius: '8px',
                    border: '1px solid rgba(42, 78, 102, 0.2)',
                    padding: '4px 6px',
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '4px',
                    marginTop: '4px'
                  }}
                >
                  {customRingSounds.map(sound => (
                    <div 
                      key={sound.id}
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        fontSize: '11px',
                        padding: '2px 4px',
                        borderRadius: '4px',
                        backgroundColor: 'rgba(255, 255, 255, 0.6)'
                      }}
                    >
                      <span style={{ 
                        textOverflow: 'ellipsis', 
                        overflow: 'hidden', 
                        whiteSpace: 'nowrap',
                        maxWidth: '200px',
                        color: 'var(--dark-teal)' 
                      }}>
                        🎵 {sound.name}
                      </span>
                      <button
                        onClick={() => handleDeleteSound(sound.id)}
                        style={{
                          background: 'none',
                          border: 'none',
                          cursor: 'pointer',
                          color: 'var(--accent-red)',
                          padding: '0 4px',
                          fontSize: '12px'
                        }}
                        title="Delete custom sound"
                      >
                        🗑️
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', width: '100%', alignItems: 'flex-start', margin: '5px 0' }}>
              <label className="setting-toggle" style={{ fontSize: '13px', fontWeight: 600, display: 'flex', alignItems: 'center', gap: '6px' }}>
                <input 
                  type="checkbox" 
                  checked={transparentInMini} 
                  onChange={(e) => setTransparentInMini(e.target.checked)} 
                />
                Transparent in Mini Mode
              </label>
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
              {selectedBuilding.description && (
                <div style={{ marginTop: '6px', padding: '6px 8px', backgroundColor: 'rgba(70, 130, 169, 0.1)', borderRadius: '6px', borderLeft: '3px solid var(--primary-teal)', wordBreak: 'break-word' }}>
                  <strong>📝 Task:</strong> {selectedBuilding.description}
                </div>
              )}
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

      {/* Task Description Modal */}
      {isDescriptionModalOpen && (
        <div className="modal-overlay" onClick={() => setIsDescriptionModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2 className="modal-title">TASK DESCRIPTION</h2>
            <p className="modal-text">Enter what you are working on during this session:</p>
            
            <input
              type="text"
              placeholder="e.g. Coding Machi feature"
              value={taskDescription}
              onChange={(e) => setTaskDescription(e.target.value)}
              className="task-modal-input"
              autoFocus
              onKeyDown={(e) => {
                if (e.key === 'Enter') {
                  setIsDescriptionModalOpen(false)
                }
              }}
            />

            <button 
              className="machi-btn machi-btn-primary" 
              onClick={() => setIsDescriptionModalOpen(false)}
              style={{ width: '100%', justifyContent: 'center', marginTop: '10px' }}
            >
              Save Description
            </button>
          </div>
        </div>
      )}
    </>
  )
}

export default App


