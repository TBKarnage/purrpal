import { useCallback, useEffect, useRef, useState } from 'react'
import { soundEngine } from './audio/soundEngine'
import { ActionDock, type ActiveDockPanel } from './components/ActionDock'
import { DressUpModal } from './components/DressUpModal'
import { FeedDrawer } from './components/FeedDrawer'
import { FeedbackModal } from './components/FeedbackModal'
import { LevelUpModal } from './components/LevelUpModal'
import { LivingRoom, type CleanToolMode } from './components/LivingRoom'
import { OnboardingScreen } from './components/OnboardingScreen'
import { ParentCornerModal } from './components/ParentCornerModal'
import { StatusHud } from './components/StatusHud'
import { BubblePop } from './minigames/BubblePop'
import { CatchTreats } from './minigames/CatchTreats'
import { HideAndSeek } from './minigames/HideAndSeek'
import { LaserChase } from './minigames/LaserChase'
import { MiniGameHub } from './minigames/MiniGameHub'
import { SkyHop } from './minigames/SkyHop'
import { useGameState } from './state/useGameState'
import {
  FOOD_CATALOG,
  type FoodItem,
  type MiniGameDifficulty,
  type MiniGameId,
  type RoomMess,
} from './types/game'

const PET_REWARD_COOLDOWN_MS = 2500

export function App() {
  const {
    gameState,
    isLoading,
    pendingLevelUp,
    dismissLevelUp,
    createKitty,
    importState,
    resetKitty,
    dispatch,
  } = useGameState()

  const [activePanel, setActivePanel] = useState<ActiveDockPanel>('none')
  const [cleanTool, setCleanTool] = useState<CleanToolMode>('none')
  const [eatingFood, setEatingFood] = useState<FoodItem['id'] | null>(null)
  const [catnipZoomie, setCatnipZoomie] = useState(false)
  const [headShakeActive, setHeadShakeActive] = useState(false)
  const [headShakeKey, setHeadShakeKey] = useState(0)
  const [speechBubble, setSpeechBubble] = useState<string | null>(null)
  const [showDressUp, setShowDressUp] = useState(false)
  const [showMiniGameHub, setShowMiniGameHub] = useState(false)
  const [showParentCorner, setShowParentCorner] = useState(false)
  const [showFeedback, setShowFeedback] = useState(false)
  const [activeMiniGame, setActiveMiniGame] = useState<MiniGameId | null>(null)

  const eatingTimerRef = useRef<number | null>(null)
  const catnipTimerRef = useRef<number | null>(null)
  const catnipMidTimerRef = useRef<number | null>(null)
  const shakeTimerRef = useRef<number | null>(null)
  const bubbleTimerRef = useRef<number | null>(null)
  const lastPetRewardRef = useRef<number>(0)
  const lastBrushRewardRef = useRef<number>(0)

  // Unlock iPadOS Web Audio on the very first user tap anywhere
  useEffect(() => soundEngine.attachFirstTapUnlock(), [])

  // Keep sound engine synced with saved sound setting
  useEffect(() => {
    soundEngine.setEnabled(gameState?.settings.soundEnabled ?? true)
  }, [gameState?.settings.soundEnabled])

  // Play joyful celebration chime when LevelUpModal appears
  useEffect(() => {
    if (pendingLevelUp && !activeMiniGame) {
      soundEngine.playLevelUp()
    }
  }, [pendingLevelUp, activeMiniGame])

  const handleMiniGameFinish = useCallback(
    (
      gameId: MiniGameId,
      score: number,
      difficulty?: MiniGameDifficulty,
    ) => {
      soundEngine.playLevelUp()
      dispatch(
        {
          type: 'COMPLETE_MINIGAME',
          gameId,
          score,
          difficulty,
          hideSeekDifficulty: difficulty,
        },
        true,
      )
    },
    [dispatch],
  )

  if (isLoading) {
    return (
      <main className="app-shell bg-[#FFF8EC] items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <img
            src="./icons/purrpal-icon.svg"
            alt="PurrPal"
            className="w-24 h-24 rounded-3xl shadow-md animate-cat-breathe"
          />
          <p className="text-2xl font-extrabold text-[#5B3A29]">Waking up...</p>
        </div>
      </main>
    )
  }

  if (!gameState) {
    return (
      <OnboardingScreen
        onInteract={() => soundEngine.playButton()}
        onComplete={(name, coat) => {
          soundEngine.playMeow('kitten')
          createKitty(name, coat)
        }}
      />
    )
  }

  const handleFeed = (foodId: FoodItem['id']) => {
    const food = FOOD_CATALOG.find((f) => f.id === foodId)
    const isFull = gameState.stats.hunger >= 100

    if (isFull && (!food || food.unlimited)) {
      // Regular food stops at 100% — kitty shakes its head "no", no food spent, no XP gained!
      soundEngine.playHeadShake()
      setEatingFood(null)
      setHeadShakeActive(true)
      setHeadShakeKey((k) => k + 1)
      setSpeechBubble("No thanks, I'm full!")
      if (shakeTimerRef.current !== null) window.clearTimeout(shakeTimerRef.current)
      shakeTimerRef.current = window.setTimeout(() => setHeadShakeActive(false), 760)
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = window.setTimeout(() => setSpeechBubble(null), 1500)
      return
    }

    soundEngine.playCrunch()
    dispatch({ type: 'FEED', foodId }, true)

    if (foodId === 'catnip') {
      // Minimize the Feed drawer right away so you can watch the kitty zoom around the room!
      setActivePanel('none')
      setEatingFood(foodId)
      setCatnipZoomie(false)
      setSpeechBubble('Ooh, CATNIP!!')
      if (eatingTimerRef.current !== null) window.clearTimeout(eatingTimerRef.current)
      if (catnipTimerRef.current !== null) window.clearTimeout(catnipTimerRef.current)
      if (catnipMidTimerRef.current !== null) window.clearTimeout(catnipMidTimerRef.current)
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current)

      eatingTimerRef.current = window.setTimeout(() => {
        setEatingFood(null)
        setCatnipZoomie(true)
        setSpeechBubble('ZOOMIES!! WHEEE!')
        soundEngine.playMeow(gameState.cat.stage)
      }, 650)

      catnipMidTimerRef.current = window.setTimeout(() => {
        setSpeechBubble('NYOOOOM!! SO FAST!')
        soundEngine.playGiggle()
      }, 4200)

      catnipTimerRef.current = window.setTimeout(() => {
        setCatnipZoomie(false)
        setSpeechBubble('Phew... best catnip ever!')
      }, 8150)

      bubbleTimerRef.current = window.setTimeout(() => {
        setSpeechBubble(null)
      }, 9650)
      return
    }

    setEatingFood(foodId)
    if (isFull) {
      setSpeechBubble('Ooh, an extra treat! Thank you!')
      if (bubbleTimerRef.current !== null) window.clearTimeout(bubbleTimerRef.current)
      bubbleTimerRef.current = window.setTimeout(() => setSpeechBubble(null), 1800)
    }
    if (eatingTimerRef.current !== null) window.clearTimeout(eatingTimerRef.current)
    eatingTimerRef.current = window.setTimeout(() => {
      setEatingFood(null)
    }, 1500)
  }

  const handlePetKitty = () => {
    const now = Date.now()
    const canGainXp =
      gameState.stats.happiness < 100 &&
      now - lastPetRewardRef.current >= PET_REWARD_COOLDOWN_MS
    if (canGainXp) {
      lastPetRewardRef.current = now
      soundEngine.playPurr()
    } else {
      soundEngine.playMeow(gameState.cat.stage)
    }
    dispatch({ type: 'PET_CAT', awardRewards: canGainXp })
  }

  const handleCleanMess = (mess: RoomMess) => {
    soundEngine.playSweep()
    dispatch({ type: 'CLEAN_MESS', messId: mess.id }, true)
  }

  const handleBrushKitty = () => {
    const now = Date.now()
    if (now - lastBrushRewardRef.current < 1500) return
    lastBrushRewardRef.current = now
    soundEngine.playBrush()
    if (gameState.stats.cleanliness < 100) {
      dispatch({ type: 'BRUSH_CAT' }, true)
    }
  }

  const tutorialStep = gameState.tutorialStep ?? 3
  const tutorialHighlight =
    tutorialStep === 0 ? 'feed' : tutorialStep === 2 ? 'play' : null

  return (
    <main id="purrpal-room-shell" className="app-shell bg-[#FFF8EC]">
      {/* Full-bleed cozy room layer */}
      <div className="absolute inset-0 flex flex-col">
        <LivingRoom
          gameState={gameState}
          eatingFood={eatingFood}
          catnipZoomie={catnipZoomie}
          headShakeActive={headShakeActive}
          headShakeKey={headShakeKey}
          speechBubble={speechBubble}
          cleanTool={cleanTool}
          showCleanTray={activePanel === 'clean'}
          showFeedTray={activePanel === 'feed'}
          onPetKitty={handlePetKitty}
          onCleanMess={handleCleanMess}
          onBrushKitty={handleBrushKitty}
          onSelectCleanTool={(tool) => {
            soundEngine.playButton()
            setCleanTool(tool)
          }}
          onCloseCleanTray={() => {
            soundEngine.playButton()
            setActivePanel('none')
            setCleanTool('none')
          }}
          onDismissTutorial={() => {
            soundEngine.playButton()
            dispatch({ type: 'SET_TUTORIAL_STEP', step: 3 })
          }}
        />
      </div>

      {/* Floating top HUD & bottom dock */}
      <div className="relative z-30 flex flex-col justify-between h-full pointer-events-none">
        <div className="pointer-events-auto">
          <StatusHud
            gameState={gameState}
            onOpenParentCorner={() => {
              soundEngine.playButton()
              setActivePanel('none')
              setCleanTool('none')
              setShowParentCorner(true)
            }}
          />
        </div>

        <div className="pointer-events-auto flex flex-col">
          {activePanel === 'feed' && (
            <FeedDrawer
              gameState={gameState}
              onFeed={handleFeed}
              onClose={() => {
                soundEngine.playButton()
                setActivePanel('none')
              }}
            />
          )}

          <ActionDock
            activePanel={activePanel}
            messCount={gameState.room.messes.length}
            tutorialHighlight={tutorialHighlight}
            onToggleFeed={() => {
              soundEngine.playButton()
              setCleanTool('none')
              setActivePanel((p) => (p === 'feed' ? 'none' : 'feed'))
            }}
            onToggleClean={() => {
              soundEngine.playButton()
              setActivePanel((p) => {
                if (p === 'clean') {
                  setCleanTool('none')
                  return 'none'
                }
                setCleanTool(gameState.room.messes.length > 0 ? 'sweep' : 'brush')
                return 'clean'
              })
            }}
            onOpenPlay={() => {
              soundEngine.playButton()
              setActivePanel('none')
              setCleanTool('none')
              setShowMiniGameHub(true)
            }}
            onOpenStyle={() => {
              soundEngine.playButton()
              setActivePanel('none')
              setCleanTool('none')
              setShowDressUp(true)
            }}
          />
        </div>
      </div>

      {/* Mini-Game Hub */}
      {showMiniGameHub && (
        <MiniGameHub
          gameState={gameState}
          onSelectGame={(gameId) => {
            soundEngine.playButton()
            setShowMiniGameHub(false)
            setActiveMiniGame(gameId)
          }}
          onClose={() => {
            soundEngine.playButton()
            setShowMiniGameHub(false)
          }}
        />
      )}

      {/* Active Full-Screen Mini-Games */}
      {activeMiniGame === 'hide_seek' && (
        <HideAndSeek
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          stage={gameState.cat.stage}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          beatenDifficulties={gameState.hideSeekBeaten ?? []}
          onCatchSound={() => soundEngine.playCatch()}
          onCrunchSound={() => soundEngine.playCrunch()}
          onMeowSound={() => soundEngine.playMeow(gameState.cat.stage)}
          onButtonSound={() => soundEngine.playButton()}
          onFinish={(score, difficulty) =>
            handleMiniGameFinish('hide_seek', score, difficulty)
          }
          onExit={() => {
            soundEngine.playButton()
            setActiveMiniGame(null)
          }}
        />
      )}

      {activeMiniGame === 'sky_hop' && (
        <SkyHop
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          stage={gameState.cat.stage}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          beatenDifficulties={gameState.miniGameBeaten?.sky_hop ?? []}
          onCatchSound={() => soundEngine.playCatch()}
          onPopSound={(combo) => soundEngine.playPop(combo)}
          onButtonSound={() => soundEngine.playButton()}
          onFinish={(score, difficulty) =>
            handleMiniGameFinish('sky_hop', score, difficulty)
          }
          onExit={() => {
            soundEngine.playButton()
            setActiveMiniGame(null)
          }}
        />
      )}

      {activeMiniGame === 'laser' && (
        <LaserChase
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          stage={gameState.cat.stage}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          beatenDifficulties={gameState.miniGameBeaten?.laser ?? []}
          onCatchSound={() => soundEngine.playCatch()}
          onButtonSound={() => soundEngine.playButton()}
          onFinish={(score, difficulty) =>
            handleMiniGameFinish('laser', score, difficulty)
          }
          onExit={() => {
            soundEngine.playButton()
            setActiveMiniGame(null)
          }}
        />
      )}

      {activeMiniGame === 'bubbles' && (
        <BubblePop
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          stage={gameState.cat.stage}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          beatenDifficulties={gameState.miniGameBeaten?.bubbles ?? []}
          onPopSound={(combo) => soundEngine.playPop(combo)}
          onButtonSound={() => soundEngine.playButton()}
          onFinish={(score, difficulty) =>
            handleMiniGameFinish('bubbles', score, difficulty)
          }
          onExit={() => {
            soundEngine.playButton()
            setActiveMiniGame(null)
          }}
        />
      )}

      {activeMiniGame === 'treats' && (
        <CatchTreats
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          stage={gameState.cat.stage}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          beatenDifficulties={gameState.miniGameBeaten?.treats ?? []}
          onCatchSound={() => soundEngine.playCatch()}
          onGiggleSound={() => soundEngine.playGiggle()}
          onButtonSound={() => soundEngine.playButton()}
          onFinish={(score, difficulty) =>
            handleMiniGameFinish('treats', score, difficulty)
          }
          onExit={() => {
            soundEngine.playButton()
            setActiveMiniGame(null)
          }}
        />
      )}

      {/* Dress-Up & Room Decor Modal */}
      {showDressUp && (
        <DressUpModal
          gameState={gameState}
          onEquipAccessory={(accessoryId, slot) => {
            soundEngine.playSweep()
            dispatch({ type: 'EQUIP_ACCESSORY', accessoryId, slot }, true)
          }}
          onSetEyeColor={(eyeColor) => {
            soundEngine.playButton()
            dispatch({ type: 'SET_EYE_COLOR', eyeColor }, true)
          }}
          onSetCheekStyle={(cheekStyle) => {
            soundEngine.playButton()
            dispatch({ type: 'SET_CHEEK_STYLE', cheekStyle }, true)
          }}
          onSetRugStyle={(rugStyle) => {
            soundEngine.playSweep()
            dispatch({ type: 'SET_RUG_STYLE', rugStyle }, true)
          }}
          onToggleDecor={(decorId) => {
            soundEngine.playSweep()
            dispatch({ type: 'TOGGLE_DECOR', decorId }, true)
          }}
          onClose={() => {
            soundEngine.playButton()
            setShowDressUp(false)
          }}
        />
      )}

      {/* Kid-Friendly Bug Reports & Feature Requests */}
      {showFeedback && (
        <FeedbackModal
          gameState={gameState}
          onSubmitReport={(report) => {
            soundEngine.playLevelUp()
            dispatch({ type: 'ADD_FEEDBACK_REPORT', report }, true)
          }}
          onButtonSound={() => soundEngine.playButton()}
          onClose={() => {
            soundEngine.playButton()
            setShowFeedback(false)
          }}
        />
      )}

      {/* Parent Corner (3-second press-and-hold gate) */}
      {showParentCorner && (
        <ParentCornerModal
          gameState={gameState}
          onUpdateSettings={(settings) => {
            soundEngine.playButton()
            dispatch({ type: 'UPDATE_SETTINGS', settings }, true)
          }}
          onImportState={async (restored) => {
            soundEngine.playLevelUp()
            await importState(restored)
          }}
          onResetKitty={async () => {
            setActivePanel('none')
            setCleanTool('none')
            setShowDressUp(false)
            setShowMiniGameHub(false)
            setActiveMiniGame(null)
            await resetKitty()
          }}
          onOpenFeedback={() => {
            soundEngine.playButton()
            setShowParentCorner(false)
            setShowFeedback(true)
          }}
          onClearReports={() => {
            soundEngine.playButton()
            dispatch({ type: 'CLEAR_FEEDBACK_REPORTS' }, true)
          }}
          onClose={() => {
            soundEngine.playButton()
            setShowParentCorner(false)
          }}
        />
      )}

      {/* Level-Up & Stage Evolution Celebration */}
      {pendingLevelUp && !activeMiniGame && (
        <LevelUpModal
          catName={gameState.cat.name}
          coat={gameState.cat.coat}
          equippedAccessory={gameState.cat.equippedAccessory}
          catStyle={gameState.cat.style}
          event={pendingLevelUp}
          onDismiss={() => {
            soundEngine.playMeow(gameState.cat.stage)
            dismissLevelUp()
          }}
        />
      )}
    </main>
  )
}

export default App
