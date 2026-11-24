import { useMemo, useState } from 'react'
import { APP_DEFAULT_SETTINGS, APP_VERSION } from '../config/appDefaults'
import { decodeSaveCode, encodeSaveCode } from '../state/storage'
import type { GameState } from '../types/game'
import { GearIcon, LockIcon, SparklesIcon } from './Icons'

interface ParentCornerModalProps {
  gameState: GameState
  onUpdateSettings: (partial: Partial<GameState['settings']>) => void
  onImportState: (state: GameState) => Promise<void>
  onResetKitty: () => Promise<void>
  onOpenFeedback: () => void
  onClearReports?: () => void
  onClose: () => void
}

export function ParentCornerModal({
  gameState,
  onUpdateSettings,
  onImportState,
  onResetKitty,
  onOpenFeedback,
  onClearReports,
  onClose,
}: ParentCornerModalProps) {
  const saveCode = useMemo(() => encodeSaveCode(gameState), [gameState])
  const [copied, setCopied] = useState(false)
  const [copiedEnv, setCopiedEnv] = useState(false)
  const [importText, setImportText] = useState('')
  const [importStatus, setImportStatus] = useState<{
    type: 'idle' | 'error' | 'success'
    message: string
  }>({ type: 'idle', message: '' })
  const [resetStep, setResetStep] = useState<0 | 1>(0)

  // PIN lock for Parent-only Bugs & Ideas section (default 1234, hidden from UI)
  const activePin = (gameState.settings.parentPin || APP_DEFAULT_SETTINGS.parentPin || '1234').trim()
  const [pinInput, setPinInput] = useState('')
  const [pinError, setPinError] = useState('')
  const [parentUnlocked, setParentUnlocked] = useState(false)

  const handleUnlockParent = (e?: React.FormEvent) => {
    e?.preventDefault()
    if (pinInput.trim() === activePin) {
      setParentUnlocked(true)
      setPinError('')
      setPinInput('')
    } else {
      setPinError('Incorrect PIN. Please try again.')
    }
  }

  const handleCopyCode = async () => {
    try {
      await navigator.clipboard.writeText(saveCode)
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    } catch {
      const el = document.getElementById('export-save-code') as HTMLTextAreaElement | null
      el?.select()
      setCopied(true)
      window.setTimeout(() => setCopied(false), 2000)
    }
  }

  const envSnippet = [
    `VITE_PARENT_WEBHOOK_URL=${gameState.settings.parentWebhookUrl ?? ''}`,
    `VITE_PARENT_EMAIL=${gameState.settings.parentEmail ?? ''}`,
    `VITE_PARENT_PIN=${activePin}`,
    `VITE_UNLOCK_ALL_MINIGAMES=${gameState.settings.unlockAllMiniGames ? 'true' : 'false'}`,
  ].join('\n')

  const handleCopyEnv = async () => {
    try {
      await navigator.clipboard.writeText(envSnippet)
    } catch {
      // Ignore clipboard fallback
    }
    setCopiedEnv(true)
    window.setTimeout(() => setCopiedEnv(false), 2000)
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
      aria-label="Settings"
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
                Settings
              </h2>
              <p className="text-xs font-bold text-[#8A6552] mt-0.5">
                Audio, mini-game unlocks, backups &amp; Parent section
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

        {/* Kid-Accessible Settings */}
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
            subtitle="Play Bubble Pop & Catch Treats right away"
            checked={gameState.settings.unlockAllMiniGames}
            onToggle={() =>
              onUpdateSettings({
                unlockAllMiniGames: !gameState.settings.unlockAllMiniGames,
              })
            }
          />
          <button
            id="btn-open-feedback"
            type="button"
            onClick={onOpenFeedback}
            className="cozy-btn w-full rounded-2xl bg-[#FEF3C7] border-2 border-[#F59E0B] p-3.5 flex items-center justify-between gap-3 text-left"
          >
            <div className="flex items-center gap-2.5">
              <SparklesIcon className="w-7 h-7 shrink-0" />
              <div>
                <div className="text-base font-black text-[#92400E]">
                  Ideas &amp; Bugs
                </div>
                <div className="text-xs font-bold text-[#B45309]">
                  Report something silly or share a new game idea!
                </div>
              </div>
            </div>
            <span className="shrink-0 px-3 py-1 rounded-xl bg-[#F59E0B] text-white text-xs font-black">
              Open
            </span>
          </button>
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
            <div className="flex flex-col gap-2">
              <p className="text-sm font-black text-[#9F1239]">
                Are you sure? This will replace {gameState.cat.name} with a new kitty.
              </p>
              <div className="flex gap-2 justify-end">
                <button
                  type="button"
                  onClick={() => setResetStep(0)}
                  className="cozy-btn px-4 py-2 rounded-xl bg-white border-2 border-[#E5C9A3] text-[#5B3A29] text-xs font-black"
                >
                  Cancel
                </button>
                <button
                  id="btn-reset-confirm"
                  type="button"
                  onClick={handleConfirmReset}
                  className="cozy-btn px-4 py-2 rounded-xl bg-[#E11D48] text-white text-xs font-black"
                >
                  Yes, Reset Kitty
                </button>
              </div>
            </div>
          )}
        </div>

        {/* PIN-Locked Parent Section (Bugs & Ideas Inbox + Delivery Settings) */}
        <div className="rounded-2xl bg-[#FAF5FF] border-[3px] border-[#DDD6FE] p-4 flex flex-col gap-3">
          <div className="flex items-center justify-between gap-2">
            <div className="flex items-center gap-2">
              <div className="w-8 h-8 rounded-xl bg-[#EDE9FE] border-2 border-[#A78BFA] flex items-center justify-center text-[#5B21B6]">
                <LockIcon className="w-4 h-4" />
              </div>
              <div>
                <h3 className="text-base font-black text-[#5B21B6] leading-tight">
                  Parent Section — Bugs &amp; Ideas
                </h3>
                <p className="text-[11px] font-bold text-[#7C3AED]/80">
                  {parentUnlocked
                    ? 'Unlocked for this session'
                    : 'Enter Parent PIN to view reports & delivery settings'}
                </p>
              </div>
            </div>
            {parentUnlocked && (
              <button
                type="button"
                onClick={() => setParentUnlocked(false)}
                className="cozy-btn px-3 py-1 rounded-xl bg-white border border-[#C4B5FD] text-xs font-black text-[#6D28D9]"
              >
                Lock
              </button>
            )}
          </div>

          {!parentUnlocked ? (
            <form
              id="parent-pin-gate"
              onSubmit={handleUnlockParent}
              className="flex items-center gap-2"
            >
              <input
                id="input-parent-pin"
                type="password"
                inputMode="numeric"
                maxLength={12}
                value={pinInput}
                onChange={(e) => {
                  setPinInput(e.target.value)
                  if (pinError) setPinError('')
                }}
                placeholder="Enter Parent PIN"
                aria-label="Parent PIN"
                className="flex-1 min-h-[44px] rounded-xl bg-white border-2 border-[#DDD6FE] px-3 text-sm font-black text-[#4C1D95] focus:outline-none focus:border-[#8B5CF6]"
              />
              <button
                id="btn-unlock-parent"
                type="submit"
                className="cozy-btn min-h-[44px] px-4 rounded-xl bg-[#8B5CF6] text-white text-sm font-black"
              >
                Unlock
              </button>
            </form>
          ) : (
            <div id="parent-controls-unlocked" className="flex flex-col gap-3">
              <div className="flex items-center justify-between gap-2">
                <span className="text-sm font-black text-[#5B21B6]">
                  Kids&apos; Bugs &amp; Ideas ({(gameState.feedbackReports ?? []).length})
                </span>
                {(gameState.feedbackReports ?? []).length > 0 && onClearReports && (
                  <button
                    type="button"
                    onClick={onClearReports}
                    className="cozy-btn px-3 py-1 rounded-xl bg-white border border-[#C4B5FD] text-xs font-black text-[#6D28D9]"
                  >
                    Clear
                  </button>
                )}
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  id="input-webhook-url"
                  type="url"
                  value={gameState.settings.parentWebhookUrl ?? ''}
                  onChange={(e) => onUpdateSettings({ parentWebhookUrl: e.target.value })}
                  placeholder="Webhook URL (Telegram/Discord)"
                  aria-label="Parent webhook URL"
                  className="w-full rounded-xl bg-white border-2 border-[#DDD6FE] px-2.5 py-1.5 text-xs font-bold text-[#4C1D95] focus:outline-none focus:border-[#8B5CF6]"
                />
                <input
                  id="input-parent-email"
                  type="email"
                  value={gameState.settings.parentEmail ?? ''}
                  onChange={(e) => onUpdateSettings({ parentEmail: e.target.value })}
                  placeholder="Parent Email (optional)"
                  aria-label="Parent email"
                  className="w-full rounded-xl bg-white border-2 border-[#DDD6FE] px-2.5 py-1.5 text-xs font-bold text-[#4C1D95] focus:outline-none focus:border-[#8B5CF6]"
                />
              </div>

              <div className="rounded-xl bg-white/90 border border-[#DDD6FE] p-2.5 flex items-center justify-between gap-2">
                <p className="text-[11px] font-bold text-[#6D28D9]">
                  To auto-fill for all kids, copy into <code className="font-mono">.env</code> or share your webhook/email to bake into the build:
                </p>
                <button
                  type="button"
                  onClick={handleCopyEnv}
                  className="cozy-btn shrink-0 px-2.5 py-1 rounded-lg bg-[#8B5CF6] text-white text-[11px] font-black"
                >
                  {copiedEnv ? 'Copied .env!' : 'Copy .env'}
                </button>
              </div>

              {(gameState.feedbackReports ?? []).length === 0 ? (
                <p className="text-xs font-bold text-[#8A6552] italic">
                  No bug reports or ideas yet. Kids can tap &ldquo;Ideas &amp; Bugs&rdquo; at the top!
                </p>
              ) : (
                <div className="max-h-40 overflow-y-auto flex flex-col gap-2 pr-1">
                  {(gameState.feedbackReports ?? []).map((rep) => (
                    <div
                      key={rep.id}
                      className="rounded-xl bg-white border border-[#E9D5FF] p-2.5 text-xs flex flex-col gap-1"
                    >
                      <div className="flex items-center justify-between gap-2">
                        <span
                          className={`px-2 py-0.5 rounded-full font-black uppercase text-[10px] ${
                            rep.kind === 'bug'
                              ? 'bg-[#FFE4E6] text-[#9F1239]'
                              : 'bg-[#EDE9FE] text-[#5B21B6]'
                          }`}
                        >
                          {rep.kind === 'bug' ? 'Bug' : 'Idea'}
                        </span>
                        <span className="text-[10px] font-bold text-[#8A6552]">
                          {rep.catName} (Lv {rep.catLevel})
                        </span>
                      </div>
                      {rep.kind === 'bug' && (
                        <p className="font-bold text-[#7D563E]">
                          {rep.activity} &bull; {rep.symptom}
                        </p>
                      )}
                      <p className="font-bold text-[#5B3A29]">{rep.message}</p>
                    </div>
                  ))}
                </div>
              )}

              {/* Change Parent PIN */}
              <div className="rounded-xl bg-white border border-[#DDD6FE] p-2.5 flex items-center justify-between gap-3">
                <div>
                  <span className="text-xs font-black text-[#5B21B6]">Change Parent PIN</span>
                  <p className="text-[11px] font-bold text-[#8A6552]">
                    Locks the Bugs &amp; Ideas parent section
                  </p>
                </div>
                <input
                  id="input-change-pin"
                  type="password"
                  inputMode="numeric"
                  maxLength={12}
                  value={gameState.settings.parentPin ?? ''}
                  onChange={(e) => onUpdateSettings({ parentPin: e.target.value })}
                  placeholder="PIN"
                  aria-label="Change Parent PIN"
                  className="w-24 text-center rounded-xl bg-[#FAF5FF] border-2 border-[#DDD6FE] px-2 py-1 text-sm font-black text-[#4C1D95]"
                />
              </div>
            </div>
          )}

          {pinError && (
            <p id="parent-pin-error" className="text-xs font-black text-[#BE123C]">
              {pinError}
            </p>
          )}

          <p
            id="app-version-label"
            className="pt-1 text-center text-[11px] font-bold text-[#B59277] select-none"
          >
            PurrPal v{APP_VERSION}
          </p>
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
    <button
      id={id}
      type="button"
      role="switch"
      aria-checked={checked}
      onClick={onToggle}
      className="cozy-btn w-full rounded-2xl bg-[#FFF8EC] border-2 border-[#EAD3B3] p-3.5 flex items-center justify-between gap-3 text-left"
    >
      <div>
        <div className="text-base font-black text-[#5B3A29]">{title}</div>
        <div className="text-xs font-bold text-[#8A6552]">{subtitle}</div>
      </div>
      <div
        className={`w-14 h-8 rounded-full p-1 transition-colors shrink-0 ${
          checked ? 'bg-[#10B981]' : 'bg-[#D6C3AC]'
        }`}
      >
        <div
          className={`w-6 h-6 rounded-full bg-white shadow transition-transform ${
            checked ? 'translate-x-6' : 'translate-x-0'
          }`}
        />
      </div>
    </button>
  )
}
