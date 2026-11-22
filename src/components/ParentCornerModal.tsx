import { useMemo, useState } from 'react'
import { decodeSaveCode, encodeSaveCode } from '../state/storage'
import type { GameState } from '../types/game'
import { GearIcon } from './Icons'

interface ParentCornerModalProps {
  gameState: GameState
  onUpdateSettings: (partial: Partial<GameState['settings']>) => void
  onImportState: (state: GameState) => Promise<void>
  onResetKitty: () => Promise<void>
  onClose: () => void
}

export function ParentCornerModal({
  gameState,
  onUpdateSettings,
  onImportState,
  onResetKitty,
  onClose,
}: ParentCornerModalProps) {
  const saveCode = useMemo(() => encodeSaveCode(gameState), [gameState])
  const [copied, setCopied] = useState(false)
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'error' | 'success'
    message: string
  }>({ type: 'idle', message: '' })
  const [resetStep, setResetStep] = useState<0 | 1>(0)

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(saveCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      // Fallback: select text so parent can copy manually
      const el = document.getElementById('export-save-code') as HTMLTextAreaElement | null
      el?.select()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const handleImport = async () => {
    const decoded = decodeSaveCode(importText)
    if (!decoded) {
      setImportStatus({
        type: 'error',
        message: 'That save code looks incomplete or invalid. Please check and try again.',
      })
      return
    }
    await onImportState(decoded)
    setImportText('')
    setImportStatus({
      type: 'success',
      message: `Restored ${decoded.cat.name} (Level ${decoded.cat.level})!`,
    })
  }

  const handleConfirmReset = async () => {
    await onResetKitty()
    onClose()
  }

  return (
    <div
      id="parent-corner-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Parent Corner Settings"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/50 backdrop-blur-sm p-3 sm:p-6"
    >
      <div className="w-full max-w-xl max-h-[92dvh] rounded-[2rem] bg-[#FFFDF8] border-4 border-[#DFC09A] shadow-[0_22px_50px_rgba(91,58,41,0.3)] p-5 sm:p-6 flex flex-col gap-4 overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between border-b-2 border-[#EFE0C9] pb-3">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-xl bg-[#FFF2D6] border-2 border-[#DFC09A] flex items-center justify-center text-[#7D563E]">
              <GearIcon className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-2xl font-black text-[#5B3A29] leading-none">
                Parent Corner
              </h2>
              <p className="text-xs font-bold text-[#8A6552] mt-0.5">
                Audio, mini-game unlocks &amp; backup codes
              </p>
            </div>
          </div>

          <button
            id="btn-close-parent"
            type="button"
            onClick={onClose}
            className="cozy-btn min-h-[48px] px-5 rounded-xl bg-[#FFF2D6] border-2 border-[#DFC09A] font-black text-[#5B3A29]"
          >
            Close
          </button>
        </div>

        {/* Toggles */}
        <div className="flex flex-col gap-2.5">
          <ToggleRow
            id="toggle-sound"
            title="Sound Effects"
            subtitle="Meows, purrs, crunches & pops"
            checked={gameState.settings.soundEnabled}
            onToggle={() =>
              onUpdateSettings({ soundEnabled: !gameState.settings.soundEnabled })
            }
          />
          <ToggleRow
            id="toggle-unlock-games"
            title="Unlock All Mini-Games"
            subtitle="Let your child play Bubble Pop & Catch Treats right away"
            checked={gameState.settings.unlockAllMiniGames}
            onToggle={() =>
              onUpdateSettings({
                unlockAllMiniGames: !gameState.settings.unlockAllMiniGames,
              })
            }
          />
        </div>

        {/* Backup / Export Save Code */}
        <div className="rounded-2xl bg-[#FFF8EC] border-2 border-[#EAD3B3] p-3.5 flex flex-col gap-2">
          <div className="flex items-center justify-between">
            <span className="text-sm font-black text-[#5B3A29]">
              Backup Save Code
            </span>
            <button
              id="btn-copy-save"
              type="button"
              onClick={handleCopyCode}
              className="cozy-btn px-3.5 py-1.5 rounded-xl bg-[#F59E0B] text-white text-xs font-black"
            >
              {copied ? 'Copied!' : 'Copy Code'}
            </button>
          </div>
          <textarea
            id="export-save-code"
            readOnly
            rows={2}
            value={saveCode}
            aria-label="Export save code"
            className="w-full rounded-xl bg-[#FFFDF8] border-2 border-[#E4C9A4] p-2 text-xs font-mono text-[#6B4C3B] resize-none focus:outline-none"
          />
        </div>

        {/* Restore / Import Save Code */}
        <div className="rounded-2xl bg-[#F0F9FF] border-2 border-[#BAE6FD] p-3.5 flex flex-col gap-2">
          <span className="text-sm font-black text-[#075985]">
            Restore Save Code
          </span>
          <textarea
            id="import-save-code"
            rows={2}
            value={importText}
            onChange={(e) => {
              setImportText(e.target.value)
              if (importStatus.type !== 'idle') {
                setImportStatus({ type: 'idle', message: '' })
              }
            }}
            placeholder="Paste a PurrPal backup code here..."
            aria-label="Import save code"
            className="w-full rounded-xl bg-white border-2 border-[#93C5FD] p-2 text-xs font-mono text-[#334155] resize-none focus:outline-none focus:border-[#0284C7]"
          />
          <div className="flex items-center justify-between gap-2">
            <span
              id="import-status-msg"
              className={`text-xs font-bold ${
                importStatus.type === 'error'
                  ? 'text-[#BE123C]'
                  : importStatus.type === 'success'
                    ? 'text-[#047857]'
                    : 'text-[#64748B]'
              }`}
            >
              {importStatus.message || 'Restores kitty, level, decor & coins.'}
            </span>
            <button
              id="btn-import-save"
              type="button"
              onClick={handleImport}
              disabled={!importText.trim()}
              className="cozy-btn shrink-0 px-4 py-2 rounded-xl bg-[#0EA5E9] disabled:opacity-50 text-white text-xs font-black"
            >
              Restore Kitty
            </button>
          </div>
        </div>

        {/* Double-Confirmed Reset */}
        <div className="rounded-2xl bg-[#FFF1F2] border-2 border-[#FECDD3] p-3.5">
          {resetStep === 0 ? (
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-black text-[#9F1239]">
                  Start Over / New Kitty
                </p>
                <p className="text-xs font-bold text-[#9F1239]/75">
                  Copy your backup code first if you want to keep {gameState.cat.name}.
                </p>
              </div>
              <button
                id="btn-reset-step1"
                type="button"
                onClick={() => setResetStep(1)}
                className="cozy-btn shrink-0 px-4 py-2 rounded-xl bg-white border-2 border-[#FB7185] text-[#BE123C] text-xs font-black"
              >
                Start Over
              </button>
            </div>
          ) : (
            <div className="flex flex-col gap-2.5">
              <p className="text-sm font-black text-[#9F1239]">
                Are you completely sure? This erases {gameState.cat.name}&apos;s current room so you can adopt a brand new kitten.
              </p>
              <div className="flex items-center justify-end gap-2">
                <button
                  id="btn-reset-cancel"
                  type="button"
                  onClick={() => setResetStep(0)}
                  className="cozy-btn px-4 py-2 rounded-xl bg-white border-2 border-[#DFC09A] text-[#5B3A29] text-xs font-black"
                >
                  Keep {gameState.cat.name}
                </button>
                <button
                  id="btn-reset-confirm"
                  type="button"
                  onClick={handleConfirmReset}
                  className="cozy-btn px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-black"
                >
                  Yes, Start New Kitty
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

function ToggleRow({
  id,
  title,
  subtitle,
  checked,
  onToggle,
}: {
  id: string
  title: string
  subtitle: string
  checked: boolean
  onToggle: () => void
}) {
  return (
    <div className="rounded-2xl bg-[#FFF9F0] border-2 border-[#ECD5B7] px-3.5 py-2.5 flex items-center justify-between gap-3">
      <div>
        <p className="text-sm font-black text-[#5B3A29]">{title}</p>
        <p className="text-xs font-bold text-[#8A6552]">{subtitle}</p>
      </div>
      <button
        id={id}
        type="button"
        role="switch"
        aria-checked={checked}
        onClick={onToggle}
        className={`cozy-btn relative w-14 h-8 rounded-full transition-colors shrink-0 ${
          checked ? 'bg-[#10B981]' : 'bg-[#D6C2AA]'
        }`}
      >
        <span
          className={`block w-6 h-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-7' : 'translate-x-1'
          }`}
        />
      </button>
    </div>
  )
}
