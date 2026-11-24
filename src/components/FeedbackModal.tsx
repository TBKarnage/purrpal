import { useEffect, useRef, useState } from 'react'
import type { FeedbackReport, GameState } from '../types/game'
import {
  BroomIcon,
  FishBowlIcon,
  HeartIcon,
  PlayYarnIcon,
  SparklesIcon,
  StyleCrownIcon,
} from './Icons'

interface FeedbackModalProps {
  gameState: GameState
  onSubmitReport: (report: FeedbackReport) => void
  onClose: () => void
  onButtonSound?: () => void
}

const BUG_ACTIVITIES = [
  { id: 'feeding', label: 'Feeding Kitty', icon: <FishBowlIcon className="w-8 h-8" /> },
  { id: 'petting', label: 'Petting / Brushing', icon: <HeartIcon className="w-8 h-8" /> },
  { id: 'cleaning', label: 'Cleaning Room', icon: <BroomIcon className="w-8 h-8" /> },
  { id: 'minigame', label: 'Playing a Game', icon: <PlayYarnIcon className="w-8 h-8" /> },
  { id: 'dressup', label: 'Dressing Up', icon: <StyleCrownIcon className="w-8 h-8" /> },
  { id: 'other', label: 'Somewhere Else', icon: <SparklesIcon className="w-8 h-8" /> },
] as const

const BUG_SYMPTOMS = [
  {
    id: 'wrong_color',
    label: 'Weird Color / Look',
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        <circle cx="20" cy="21" r="13" fill="#FDBA74" stroke="#5B3A29" strokeWidth="2.4" />
        <path d="M20 8 A13 13 0 0 1 20 34 Z" fill="#334155" />
        <circle cx="15" cy="19" r="2" fill="#5B3A29" />
        <circle cx="25" cy="19" r="2" fill="#FFF" />
      </svg>
    ),
  },
  {
    id: 'stuck_moving',
    label: 'Stuck Moving / Bobbing',
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        <path d="M8 20 L15 14 L15 26 Z" fill="#FB7185" />
        <path d="M32 20 L25 14 L25 26 Z" fill="#FB7185" />
        <circle cx="20" cy="20" r="6" fill="#FBBF24" stroke="#5B3A29" strokeWidth="2" />
      </svg>
    ),
  },
  {
    id: 'cant_tap',
    label: "Button Wouldn't Tap",
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        <rect x="6" y="12" width="28" height="16" rx="6" fill="#E2E8F0" stroke="#64748B" strokeWidth="2.4" />
        <line x1="12" y1="15" x2="28" y2="25" stroke="#EF4444" strokeWidth="3" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    id: 'missing_item',
    label: 'Something Missing',
    icon: (
      <svg viewBox="0 0 40 40" className="w-8 h-8" aria-hidden="true">
        <rect x="9" y="10" width="22" height="20" rx="5" fill="#FEF3C7" stroke="#D97706" strokeWidth="2.4" strokeDasharray="4 2" />
        <text x="20" y="25" textAnchor="middle" fontSize="14" fontWeight="900" fill="#B45309">?</text>
      </svg>
    ),
  },
  {
    id: 'other',
    label: 'Something Else',
    icon: <SparklesIcon className="w-8 h-8" />,
  },
] as const

const IDEA_STARTERS = ['New Mini-Game', 'New Hat / Outfit', 'New Room', 'New Treat / Toy']

interface SpeechRecognitionLike {
  lang: string
  interimResults: boolean
  maxAlternatives: number
  onresult: ((event: { results: ArrayLike<ArrayLike<{ transcript: string }>> }) => void) | null
  onerror: (() => void) | null
  onend: (() => void) | null
  start: () => void
  stop: () => void
}

function getSpeechRecognitionCtor(): (new () => SpeechRecognitionLike) | null {
  if (typeof window === 'undefined') return null
  const w = window as unknown as {
    SpeechRecognition?: new () => SpeechRecognitionLike
    webkitSpeechRecognition?: new () => SpeechRecognitionLike
  }
  return w.SpeechRecognition ?? w.webkitSpeechRecognition ?? null
}

export function FeedbackModal({
  gameState,
  onSubmitReport,
  onClose,
  onButtonSound,
}: FeedbackModalProps) {
  const [tab, setTab] = useState<'bug' | 'request'>('bug')
  const [activity, setActivity] = useState<string>('feeding')
  const [symptom, setSymptom] = useState<string>('wrong_color')
  const [message, setMessage] = useState('')
  const [usedVoice, setUsedVoice] = useState(false)
  const [isListening, setIsListening] = useState(false)
  const [voiceHint, setVoiceHint] = useState<string | null>(null)
  const [submitted, setSubmitted] = useState<FeedbackReport | null>(null)
  const [copied, setCopied] = useState(false)

  const recognitionRef = useRef<SpeechRecognitionLike | null>(null)
  const hasVoiceSupport = getSpeechRecognitionCtor() !== null

  useEffect(() => {
    return () => {
      recognitionRef.current?.stop()
    }
  }, [])

  const handleToggleVoice = () => {
    onButtonSound?.()
    if (isListening) {
      recognitionRef.current?.stop()
      setIsListening(false)
      return
    }
    const Ctor = getSpeechRecognitionCtor()
    if (!Ctor) {
      setVoiceHint('Voice-to-text is not supported in this browser — type your idea below!')
      return
    }
    try {
      const rec = new Ctor()
      rec.lang = 'en-US'
      rec.interimResults = false
      rec.maxAlternatives = 1
      rec.onresult = (event) => {
        const transcript = event.results?.[0]?.[0]?.transcript?.trim()
        if (transcript) {
          setMessage((prev) => (prev.trim() ? `${prev.trim()} ${transcript}` : transcript))
          setUsedVoice(true)
          setVoiceHint(null)
        }
      }
      rec.onerror = () => {
        setIsListening(false)
        setVoiceHint('Could not hear clearly — try tapping Speak again or type it in!')
      }
      rec.onend = () => {
        setIsListening(false)
      }
      recognitionRef.current = rec
      setVoiceHint(null)
      setIsListening(true)
      rec.start()
    } catch {
      setIsListening(false)
      setVoiceHint('Microphone unavailable — please type your message below!')
    }
  }

  const formatReportText = (rep: FeedbackReport): string => {
    const lines = [
      `PurrPal ${rep.kind === 'bug' ? 'Bug Report' : 'Feature Request'}`,
      `Kitty: ${rep.catName} (Lv ${rep.catLevel})`,
    ]
    if (rep.kind === 'bug') {
      const actLabel = BUG_ACTIVITIES.find((a) => a.id === rep.activity)?.label ?? rep.activity
      const symLabel = BUG_SYMPTOMS.find((s) => s.id === rep.symptom)?.label ?? rep.symptom
      lines.push(`Doing: ${actLabel}`)
      lines.push(`What happened: ${symLabel}`)
    }
    if (rep.message.trim()) {
      lines.push(`Details: ${rep.message.trim()}`)
    }
    lines.push(`Sent: ${new Date(rep.createdAt).toLocaleString()}`)
    return lines.join('\n')
  }

  const handleSubmit = async () => {
    onButtonSound?.()
    const report: FeedbackReport = {
      id: `fb_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`,
      kind: tab,
      createdAt: Date.now(),
      catName: gameState.cat.name,
      catLevel: gameState.cat.level,
      activity: tab === 'bug' ? activity : undefined,
      symptom: tab === 'bug' ? symptom : undefined,
      message: message.trim() || (tab === 'bug' ? 'Reported using picture cards' : ''),
      usedVoice,
      sentToWebhook: false,
    }

    const webhookUrl = gameState.settings.parentWebhookUrl?.trim()
    if (webhookUrl && /^https?:\/\//i.test(webhookUrl)) {
      try {
        const formatted = formatReportText(report)
        await fetch(webhookUrl, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            content: formatted,
            text: formatted,
            report,
          }),
        })
        report.sentToWebhook = true
      } catch {
        // Still saved locally in Parent Corner Inbox even if offline!
      }
    }

    onSubmitReport(report)
    setSubmitted(report)
  }

  if (submitted) {
    const textBody = formatReportText(submitted)
    const subject = encodeURIComponent(
      `PurrPal ${submitted.kind === 'bug' ? 'Bug Report' : 'Idea'} from ${submitted.catName}`,
    )
    const body = encodeURIComponent(textBody)
    const mailtoHref = `mailto:${encodeURIComponent(gameState.settings.parentEmail ?? '')}?subject=${subject}&body=${body}`
    const ghIssueHref = `https://github.com/TBKarnage/purrpal/issues/new?title=${subject}&body=${body}`

    return (
      <div
        id="feedback-modal"
        role="dialog"
        aria-modal="true"
        aria-label="Report Sent"
        className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-3 sm:p-6"
      >
        <div className="w-full max-w-md rounded-[2rem] bg-[#FFFDF8] border-4 border-[#6EE7B7] shadow-[0_22px_50px_rgba(91,58,41,0.28)] p-6 flex flex-col items-center text-center gap-4">
          <div className="w-16 h-16 rounded-3xl bg-[#D1FAE5] border-[3px] border-[#10B981] flex items-center justify-center">
            <HeartIcon className="w-10 h-10" />
          </div>
          <h2 className="text-2xl font-black text-[#5B3A29]">
            Thanks for telling us!
          </h2>
          <p className="text-sm font-bold text-[#8A6552]">
            {submitted.sentToWebhook
              ? 'Your note was sent straight to your parent AND saved in Parent Corner!'
              : 'Your note is saved in Parent Corner so your parent can read it anytime!'}
          </p>

          <div className="w-full grid grid-cols-1 sm:grid-cols-2 gap-2.5">
            <a
              href={mailtoHref}
              className="cozy-btn min-h-[48px] px-3 rounded-xl bg-[#FEF3C7] border-2 border-[#F59E0B] text-[#92400E] text-sm font-black flex items-center justify-center"
            >
              Email Parent
            </a>
            <a
              href={ghIssueHref}
              target="_blank"
              rel="noreferrer"
              className="cozy-btn min-h-[48px] px-3 rounded-xl bg-[#E0F2FE] border-2 border-[#38BDF8] text-[#075985] text-sm font-black flex items-center justify-center"
            >
              Send to GitHub
            </a>
          </div>

          <div className="w-full grid grid-cols-2 gap-2.5">
            <button
              type="button"
              onClick={async () => {
                try {
                  await navigator.clipboard.writeText(textBody)
                } catch {
                  // Ignore clipboard restrictions
                }
                setCopied(true)
              }}
              className="cozy-btn min-h-[48px] rounded-xl bg-[#FFF2D6] border-2 border-[#E7C69C] text-[#5B3A29] text-sm font-black"
            >
              {copied ? 'Copied!' : 'Copy Note'}
            </button>
            <button
              id="btn-close-feedback"
              type="button"
              onClick={onClose}
              className="cozy-btn min-h-[48px] rounded-xl bg-[#10B981] border-b-4 border-[#047857] text-white text-sm font-black"
            >
              Done!
            </button>
          </div>
        </div>
      </div>
    )
  }

  return (
    <div
      id="feedback-modal"
      role="dialog"
      aria-modal="true"
      aria-label="Bugs & Ideas"
      className="fixed inset-0 z-50 flex items-center justify-center bg-[#5B3A29]/45 backdrop-blur-sm p-3 sm:p-5"
    >
      <div className="w-full max-w-2xl max-h-[92dvh] overflow-y-auto rounded-[2rem] bg-[#FFFDF8] border-4 border-[#FCD34D] shadow-[0_22px_50px_rgba(91,58,41,0.28)] p-4 sm:p-6 flex flex-col gap-4">
        {/* Header */}
        <div className="flex items-center justify-between gap-2">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-10 h-10 rounded-2xl bg-[#FEF3C7] border-2 border-[#F59E0B] flex items-center justify-center shrink-0">
              <SparklesIcon className="w-6 h-6" />
            </div>
            <div className="min-w-0">
              <h2 className="text-xl sm:text-2xl font-black text-[#5B3A29] leading-none">
                Bugs &amp; Ideas
              </h2>
              <p className="text-xs sm:text-sm font-bold text-[#8A6552] mt-0.5">
                Tell us if something looks silly or share a cool idea!
              </p>
            </div>
          </div>
          <button
            id="btn-close-feedback"
            type="button"
            onClick={onClose}
            className="cozy-btn shrink-0 min-h-[44px] px-4 rounded-xl bg-[#FFF2D6] border-2 border-[#E7C69C] text-[#5B3A29] text-sm font-black"
          >
            Close
          </button>
        </div>

        {/* Big Kid-Friendly Mode Tabs */}
        <div className="grid grid-cols-2 gap-2.5">
          <button
            id="tab-feedback-bug"
            type="button"
            onClick={() => {
              onButtonSound?.()
              setTab('bug')
            }}
            className={`cozy-btn min-h-[52px] rounded-2xl border-[3px] px-3 font-black text-sm sm:text-base flex items-center justify-center gap-2 ${
              tab === 'bug'
                ? 'bg-[#FFE4E6] border-[#FB7185] text-[#9F1239] shadow-[0_3px_0_#E11D48]'
                : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#7D563E]'
            }`}
          >
            <span>Report a Bug</span>
          </button>

          <button
            id="tab-feedback-request"
            type="button"
            onClick={() => {
              onButtonSound?.()
              setTab('request')
            }}
            className={`cozy-btn min-h-[52px] rounded-2xl border-[3px] px-3 font-black text-sm sm:text-base flex items-center justify-center gap-2 ${
              tab === 'request'
                ? 'bg-[#EDE9FE] border-[#8B5CF6] text-[#5B21B6] shadow-[0_3px_0_#7C3AED]'
                : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#7D563E]'
            }`}
          >
            <span>Share an Idea</span>
          </button>
        </div>

        {tab === 'bug' ? (
          <div className="flex flex-col gap-3.5">
            {/* Step 1: What were you doing? */}
            <div>
              <p className="text-sm font-black text-[#7D563E] mb-2">
                1. What were you doing?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUG_ACTIVITIES.map((item) => {
                  const selected = activity === item.id
                  return (
                    <button
                      key={item.id}
                      id={`bug-activity-${item.id}`}
                      type="button"
                      onClick={() => {
                        onButtonSound?.()
                        setActivity(item.id)
                      }}
                      className={`cozy-btn rounded-2xl border-[3px] p-2.5 flex flex-col items-center gap-1 text-center ${
                        selected
                          ? 'bg-[#FEF3C7] border-[#F59E0B] text-[#92400E] shadow-[0_3px_0_#D97706]'
                          : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#5B3A29]'
                      }`}
                    >
                      {item.icon}
                      <span className="text-xs font-extrabold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Step 2: What happened? */}
            <div>
              <p className="text-sm font-black text-[#7D563E] mb-2">
                2. What happened?
              </p>
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {BUG_SYMPTOMS.map((item) => {
                  const selected = symptom === item.id
                  return (
                    <button
                      key={item.id}
                      id={`bug-symptom-${item.id}`}
                      type="button"
                      onClick={() => {
                        onButtonSound?.()
                        setSymptom(item.id)
                      }}
                      className={`cozy-btn rounded-2xl border-[3px] p-2.5 flex flex-col items-center gap-1 text-center ${
                        selected
                          ? 'bg-[#FFE4E6] border-[#FB7185] text-[#9F1239] shadow-[0_3px_0_#E11D48]'
                          : 'bg-[#FFFDF8] border-[#E7CFAF] text-[#5B3A29]'
                      }`}
                    >
                      {item.icon}
                      <span className="text-xs font-extrabold">{item.label}</span>
                    </button>
                  )
                })}
              </div>
            </div>
          </div>
        ) : (
          <div>
            <p className="text-sm font-black text-[#7D563E] mb-2">
              Pick a topic or tell us your idea!
            </p>
            <div className="flex flex-wrap gap-2">
              {IDEA_STARTERS.map((starter) => (
                <button
                  key={starter}
                  type="button"
                  onClick={() => {
                    onButtonSound?.()
                    setMessage((prev) =>
                      prev.trim() ? `${prev.trim()} — ${starter}` : `${starter}: `,
                    )
                  }}
                  className="cozy-btn px-3 py-1.5 rounded-full bg-[#EDE9FE] border-2 border-[#A78BFA] text-xs font-black text-[#5B21B6]"
                >
                  + {starter}
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Type OR Voice-to-Text */}
        <div className="flex flex-col gap-2">
          <div className="flex items-center justify-between gap-2">
            <label htmlFor="feedback-message" className="text-sm font-black text-[#7D563E]">
              {tab === 'bug' ? '3. Tell us more (type or speak!)' : 'Your Idea (type or speak!)'}
            </label>
            <button
              id="btn-voice-input"
              type="button"
              onClick={handleToggleVoice}
              className={`cozy-btn inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl border-2 text-xs font-black ${
                isListening
                  ? 'bg-[#FB7185] border-[#E11D48] text-white animate-pulse'
                  : 'bg-[#E0F2FE] border-[#38BDF8] text-[#075985]'
              }`}
            >
              <svg viewBox="0 0 24 24" className="w-4 h-4" fill="none" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">
                <rect x="9" y="2" width="6" height="11" rx="3" />
                <path d="M5 10a7 7 0 0 0 14 0" />
                <line x1="12" y1="17" x2="12" y2="22" />
              </svg>
              <span>
                {isListening
                  ? 'Listening...'
                  : hasVoiceSupport
                    ? 'Tap to Speak'
                    : 'Voice (Type Below)'}
              </span>
            </button>
          </div>

          <textarea
            id="feedback-message"
            rows={3}
            maxLength={500}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            placeholder={
              tab === 'bug'
                ? 'Example: My kitty face turned dark after eating kibble...'
                : 'Example: Can we add a trampoline or a space room for our kitty?'
            }
            className="w-full rounded-2xl bg-[#FFF9EE] border-[3px] border-[#E5C9A3] p-3 text-sm sm:text-base font-bold text-[#5B3A29] placeholder:text-[#B59277] focus:outline-none focus:border-[#F59E0B]"
          />
          {voiceHint && (
            <p className="text-xs font-bold text-[#B45309]">{voiceHint}</p>
          )}
        </div>

        {/* Submit */}
        <button
          id="btn-submit-feedback"
          type="button"
          disabled={tab === 'request' && !message.trim()}
          onClick={handleSubmit}
          className="cozy-btn w-full min-h-[56px] rounded-2xl bg-gradient-to-b from-[#34D399] to-[#10B981] border-b-4 border-[#047857] text-white text-lg font-black disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {tab === 'bug' ? 'Send Bug Report!' : 'Send My Idea!'}
        </button>
      </div>
    </div>
  )
}
