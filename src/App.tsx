import { useEffect, useRef, useState } from 'react'
import type { FormEvent } from 'react'
import type { User } from '@supabase/supabase-js'

import { supabase } from './supabase'

import './App.css'
import './Score.css'
import './Mascot.css'
import './Singer.css'
import './Auth.css'
import './Admin.css'

type AppRole = 'master' | 'user'

type Music = {
  id: string
  title: string
  artist: string
  thumbnail: string
}

type QueueItem = Music & {
  singer: string
}

type RankingItem = {
  id: string
  singer: string
  title: string
  artist: string
  score: number
  presence: number
  energy: number
  stability: number
}

type YouTubeSearchItem = {
  id: {
    videoId?: string
  }
  snippet: {
    title: string
    channelTitle: string
    thumbnails: {
      medium?: { url: string }
      high?: { url: string }
      default?: { url: string }
    }
  }
}

type YouTubeSearchResponse = {
  items?: YouTubeSearchItem[]
  error?: {
    message?: string
  }
}

type ScoreData = {
  total: number
  presence: number
  energy: number
  stability: number
}

type TvMessage =
  | {
      type: 'PLAY'
      music: QueueItem
    }
  | {
      type: 'CLEAR'
    }
  | {
      type: 'TV_READY'
    }
  | {
      type: 'TV_CLOSED'
    }
  | {
      type: 'REQUEST_STATE'
    }
  | {
      type: 'SCORE'
      score: ScoreData
    }
  | {
      type: 'RESULT'
      result: RankingItem
    }

const CHANNEL_NAME = 'videoke-tv-channel'

function decodeHtml(text: string) {
  const parser = new DOMParser()
  const doc = parser.parseFromString(text, 'text/html')
  return doc.documentElement.textContent ?? text
}

function clamp(value: number, min: number, max: number) {
  return Math.min(Math.max(value, min), max)
}

function getScoreMessage(score: number) {
  if (score >= 95) return 'SHOW! 🔥'
  if (score >= 90) return 'EXCELENTE! 🏆'
  if (score >= 80) return 'MUITO BOM! 👏'
  if (score >= 70) return 'MANDOU BEM! 🎤'
  return 'BOA! CONTINUE CANTANDO 🎵'
}


type MascotMood =
  | 'neutral'
  | 'dance'
  | 'celebrate'

function getMascotMood(score: number): MascotMood {
  if (score >= 90) {
    return 'celebrate'
  }

  if (score >= 70) {
    return 'dance'
  }

  return 'neutral'
}

function getMascotLabel(
  mood: MascotMood,
  score: number,
) {
  if (score === 0) {
    return 'Aguardando sua voz'
  }

  if (mood === 'celebrate') {
    return 'Sensacional!'
  }

  if (mood === 'dance') {
    return 'Mandando bem!'
  }

  return 'Continue cantando'
}

function KaraokeMascot({
  score,
  compact = false,
  active = false,
}: {
  score: number
  compact?: boolean
  active?: boolean
}) {
  const mood = getMascotMood(score)
  const label = getMascotLabel(
    mood,
    score,
  )

  return (
    <div
      className={`karaoke-mascot girl-mascot mascot-${mood} ${
        compact ? 'mascot-compact' : ''
      } ${active ? 'mascot-music-active' : ''}`}
      aria-label={label}
    >
      <div className="girl-stage">
        <svg
          className="girl-svg"
          viewBox="0 0 260 320"
          role="img"
          aria-hidden="true"
        >
          <defs>
            <linearGradient id="skinGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#ffd6bf" />
              <stop offset="55%" stopColor="#efb396" />
              <stop offset="100%" stopColor="#d89579" />
            </linearGradient>

            <linearGradient id="hairGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#4a342c" />
              <stop offset="55%" stopColor="#2c1d19" />
              <stop offset="100%" stopColor="#160f0d" />
            </linearGradient>

            <linearGradient id="dressGrad" x1="0" y1="0" x2="1" y2="1">
              <stop offset="0%" stopColor="#5f55ff" />
              <stop offset="100%" stopColor="#2e3db8" />
            </linearGradient>

            <filter id="girlShadow" x="-30%" y="-30%" width="160%" height="160%">
              <feDropShadow
                dx="0"
                dy="7"
                stdDeviation="7"
                floodColor="#000000"
                floodOpacity="0.34"
              />
            </filter>

            <filter id="softGlow" x="-80%" y="-80%" width="260%" height="260%">
              <feGaussianBlur stdDeviation="4" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>

          <ellipse
            className="girl-shadow"
            cx="130"
            cy="302"
            rx="72"
            ry="13"
            fill="rgba(0,0,0,.34)"
          />

          <g className="girl-body-group" filter="url(#girlShadow)">
            <path
              className="girl-ponytail"
              d="M167 46 C218 35 231 74 218 122 C207 163 201 204 221 243 C191 235 169 213 164 176 C159 139 172 105 167 46Z"
              fill="url(#hairGrad)"
            />

            <path
              d="M76 185 C54 210 53 249 72 282 C82 299 106 305 130 305 C154 305 178 299 188 282 C207 249 206 210 184 185Z"
              fill="url(#dressGrad)"
            />

            <path
              d="M95 270 L90 306"
              stroke="#202334"
              strokeWidth="20"
              strokeLinecap="round"
            />

            <path
              d="M165 270 L170 306"
              stroke="#202334"
              strokeWidth="20"
              strokeLinecap="round"
            />

            <ellipse cx="89" cy="308" rx="23" ry="10" fill="#0c101d" />
            <ellipse cx="171" cy="308" rx="23" ry="10" fill="#0c101d" />

            <path
              d="M74 198 C53 208 46 225 49 243 C51 256 60 261 69 254 C76 249 79 236 78 224"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            <path
              className="girl-right-arm"
              d="M184 199 C199 204 205 215 207 228"
              fill="none"
              stroke="url(#skinGrad)"
              strokeWidth="16"
              strokeLinecap="round"
            />

            <path
              className="girl-neck"
              d="M111 163 L110 192 C110 203 150 203 150 192 L149 163Z"
              fill="url(#skinGrad)"
            />

            <ellipse
              cx="130"
              cy="118"
              rx="70"
              ry="67"
              fill="url(#skinGrad)"
            />

            <path
              d="M65 111 C69 68 95 41 135 42 C165 42 189 60 196 92 C179 84 165 68 156 55 C135 75 101 85 68 85Z"
              fill="url(#hairGrad)"
            />

            <path
              d="M86 56 C103 39 127 31 151 38 C132 46 122 57 116 75 C103 70 93 64 86 56Z"
              fill="#5b4037"
              opacity="0.65"
            />

            <g className="girl-eye girl-eye-left">
              <path
                d="M92 105 C101 95 114 95 121 105 C113 115 101 116 92 105Z"
                fill="#ffffff"
              />
              <ellipse
                className="girl-pupil girl-pupil-left"
                cx="107"
                cy="105"
                rx="8"
                ry="10"
                fill="#3a2c2a"
              />
              <circle
                className="girl-eye-shine girl-eye-shine-left"
                cx="109"
                cy="102"
                r="2.2"
                fill="#ffffff"
              />
            </g>

            <g className="girl-eye girl-eye-right">
              <path
                d="M139 105 C148 95 161 95 168 105 C160 115 148 116 139 105Z"
                fill="#ffffff"
              />
              <ellipse
                className="girl-pupil girl-pupil-right"
                cx="153"
                cy="105"
                rx="8"
                ry="10"
                fill="#3a2c2a"
              />
              <circle
                className="girl-eye-shine girl-eye-shine-right"
                cx="155"
                cy="102"
                r="2.2"
                fill="#ffffff"
              />
            </g>

            <path
              className="girl-brow girl-brow-left"
              d="M88 91 C99 83 112 82 123 88"
              fill="none"
              stroke="#2b1b17"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              className="girl-brow girl-brow-right"
              d="M137 88 C148 82 161 83 172 91"
              fill="none"
              stroke="#2b1b17"
              strokeWidth="5"
              strokeLinecap="round"
            />

            <path
              d="M80 103 C84 98 89 95 94 93"
              fill="none"
              stroke="#18100e"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M180 103 C176 98 171 95 166 93"
              fill="none"
              stroke="#18100e"
              strokeWidth="3"
              strokeLinecap="round"
            />

            <path
              d="M128 111 C124 124 124 129 132 131"
              fill="none"
              stroke="#c77f66"
              strokeWidth="2.5"
              strokeLinecap="round"
            />

            <path
              className="girl-mouth"
              d="M116 145 C124 152 136 152 144 145"
              fill="none"
              stroke="#9d4e51"
              strokeWidth="4"
              strokeLinecap="round"
            />

            <circle cx="64" cy="127" r="8" fill="#dce8ff" />
            <circle cx="196" cy="127" r="8" fill="#dce8ff" />
            <circle cx="64" cy="127" r="4" fill="#86aee8" />
            <circle cx="196" cy="127" r="4" fill="#86aee8" />

            <g className="girl-mic-hand-group">
              <g className="girl-microphone">
                <rect
                  x="202"
                  y="196"
                  width="12"
                  height="54"
                  rx="6"
                  fill="#222634"
                  transform="rotate(18 208 223)"
                />

                <ellipse
                  cx="216"
                  cy="191"
                  rx="13"
                  ry="15"
                  fill="#474d5f"
                  transform="rotate(18 216 191)"
                />

                <ellipse
                  cx="216"
                  cy="189"
                  rx="8"
                  ry="9"
                  fill="#737d91"
                  transform="rotate(18 216 189)"
                />
              </g>

              <circle
                className="girl-right-hand"
                cx="208"
                cy="226"
                r="10"
                fill="url(#skinGrad)"
              />

              <path
                d="M203 225 C207 221 212 221 216 224"
                fill="none"
                stroke="#c98770"
                strokeWidth="2"
                strokeLinecap="round"
              />
            </g>

            <circle
              className="girl-badge"
              cx="130"
              cy="218"
              r="17"
              fill="#121629"
              stroke="#9bb7ff"
              strokeWidth="2"
            />

            <text
              x="130"
              y="224"
              textAnchor="middle"
              fill="#ffffff"
              fontSize="16"
              fontWeight="900"
              fontFamily="Arial, sans-serif"
            >
              V
            </text>
          </g>

          {mood !== 'neutral' && (
            <g className="girl-notes" filter="url(#softGlow)">
              <text x="28" y="150">♪</text>
              <text x="215" y="122">♫</text>
              <text x="225" y="168">♪</text>
            </g>
          )}
        </svg>

        {mood === 'celebrate' && (
          <div className="girl-confetti" aria-hidden="true">
            <span />
            <span />
            <span />
            <span />
            <span />
            <span />
          </div>
        )}
      </div>

      <div className="mascot-caption">
        <strong>{label}</strong>
        <span>
          {score > 0
            ? `${score} pontos`
            : 'Cante para começar'}
        </span>
      </div>
    </div>
  )
}

function TvScreen() {
  const [currentMusic, setCurrentMusic] =
    useState<QueueItem | null>(null)

  const [liveScore, setLiveScore] =
    useState<ScoreData>({
      total: 0,
      presence: 0,
      energy: 0,
      stability: 0,
    })

  const [finalResult, setFinalResult] =
    useState<RankingItem | null>(null)


  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)

    channel.onmessage = (
      event: MessageEvent<TvMessage>,
    ) => {
      const message = event.data

      if (message.type === 'PLAY') {
        setCurrentMusic(message.music)

        setLiveScore({
          total: 0,
          presence: 0,
          energy: 0,
          stability: 0,
        })

        setFinalResult(null)
      }

      if (message.type === 'CLEAR') {
        setCurrentMusic(null)
        setFinalResult(null)
      }

      if (message.type === 'SCORE') {
        setLiveScore(message.score)
      }

      if (message.type === 'RESULT') {
        setFinalResult(message.result)
      }
    }

    channel.postMessage({
      type: 'TV_READY',
    } satisfies TvMessage)

    channel.postMessage({
      type: 'REQUEST_STATE',
    } satisfies TvMessage)

    const handleBeforeUnload = () => {
      channel.postMessage({
        type: 'TV_CLOSED',
      } satisfies TvMessage)
    }

    window.addEventListener(
      'beforeunload',
      handleBeforeUnload,
    )

    return () => {
      window.removeEventListener(
        'beforeunload',
        handleBeforeUnload,
      )

      channel.close()
    }
  }, [])

  function enterFullscreen() {
    document.documentElement.requestFullscreen?.()
  }

  return (
    <div className="tv-screen">
      {currentMusic ? (
        <>
          <div className="tv-video">
            <iframe
              key={currentMusic.id}
              src={`https://www.youtube.com/embed/${currentMusic.id}?autoplay=1&rel=0`}
              title={currentMusic.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
              allowFullScreen
            />
          </div>

          <div className="tv-score-badge">
            <span>PONTUAÇÃO</span>
            <strong>{liveScore.total || '--'}</strong>
          </div>

          <div className="tv-mascot-zone">
            <KaraokeMascot
              score={liveScore.total}
              active={Boolean(currentMusic)}
            />
          </div>

          <div className="tv-footer">
            <div className="tv-now-playing">
              <span>🎤 CANTANDO</span>
              <strong>{currentMusic.singer}</strong>
            </div>

            <div className="tv-song-info">
              <strong>{currentMusic.title}</strong>
              <span>{currentMusic.artist}</span>
            </div>

            <button
              type="button"
              className="tv-fullscreen-button"
              onClick={enterFullscreen}
            >
              ⛶ Tela cheia
            </button>
          </div>

          {finalResult && (
            <div className="tv-result-overlay">
              <div className="tv-result-card">
                <span className="result-label">
                  RESULTADO
                </span>

                <div className="result-trophy">
                  🏆
                </div>

                <div className="result-score">
                  {finalResult.score}
                </div>

                <h2>
                  {getScoreMessage(finalResult.score)}
                </h2>

                <strong className="result-singer">
                  🎤 {finalResult.singer}
                </strong>

                <span className="result-song">
                  {finalResult.title}
                </span>

                <div className="result-details">
                  <div>
                    <span>Presença</span>
                    <b>{finalResult.presence}</b>
                  </div>

                  <div>
                    <span>Energia</span>
                    <b>{finalResult.energy}</b>
                  </div>

                  <div>
                    <span>Constância</span>
                    <b>{finalResult.stability}</b>
                  </div>
                </div>
              </div>
            </div>
          )}
        </>
      ) : (
        <div className="tv-waiting">
          <div className="tv-waiting-logo">
            🎤
          </div>

          <h1>VideoKê</h1>

          <p>Aguardando a próxima música...</p>

          <button
            type="button"
            className="tv-fullscreen-button"
            onClick={enterFullscreen}
          >
            ⛶ Tela cheia
          </button>
        </div>
      )}
    </div>
  )
}

function ControlPanel({
  currentUser,
  role,
  onLogout,
}: {
  currentUser: User
  role: AppRole
  onLogout: () => Promise<void>
}) {
  const [showUserSettings, setShowUserSettings] =
    useState(false)

  const [search, setSearch] = useState('')
  const [results, setResults] = useState<Music[]>([])
  const [queue, setQueue] = useState<QueueItem[]>([])

  const [currentMusic, setCurrentMusic] =
    useState<QueueItem | null>(null)

  const [selectedMusic, setSelectedMusic] =
    useState<Music | null>(null)

  const [singers, setSingers] = useState<string[]>([])
  const [selectedSinger, setSelectedSinger] = useState('')
  const [newSingerName, setNewSingerName] = useState('')
  const [showNewSinger, setShowNewSinger] = useState(false)
  const [showSingerManager, setShowSingerManager] = useState(false)
  const [singerMessage, setSingerMessage] = useState('')
  const [loading, setLoading] = useState(false)
  const [searchDone, setSearchDone] = useState(false)
  const [error, setError] = useState('')
  const [tvConnected, setTvConnected] = useState(false)
  const [micActive, setMicActive] = useState(false)
  const [micError, setMicError] = useState('')

  const [liveScore, setLiveScore] =
    useState<ScoreData>({
      total: 0,
      presence: 0,
      energy: 0,
      stability: 0,
    })

  const [ranking, setRanking] =
    useState<RankingItem[]>([])

  const [changingMusic, setChangingMusic] =
    useState(false)

  const channelRef =
    useRef<BroadcastChannel | null>(null)

  const currentMusicRef =
    useRef<QueueItem | null>(null)

  const liveScoreRef =
    useRef<ScoreData>({
      total: 0,
      presence: 0,
      energy: 0,
      stability: 0,
    })

  const audioContextRef =
    useRef<AudioContext | null>(null)

  const analyserRef =
    useRef<AnalyserNode | null>(null)

  const streamRef =
    useRef<MediaStream | null>(null)

  const animationRef =
    useRef<number | null>(null)

  const lastAnalysisRef = useRef(0)
  const previousRmsRef = useRef(0)
  const scoreTotalRef = useRef(0)
  const scoreCountRef = useRef(0)
  const presenceTotalRef = useRef(0)
  const energyTotalRef = useRef(0)
  const stabilityTotalRef = useRef(0)

  const youtubeApiKey =
    import.meta.env.VITE_YOUTUBE_API_KEY

  useEffect(() => {
    try {
      const saved = localStorage.getItem(
        'videoke-singers',
      )

      if (!saved) return

      const parsed = JSON.parse(saved)

      if (!Array.isArray(parsed)) return

      const cleanNames = Array.from(
        new Set(
          parsed
            .filter(
              (name): name is string =>
                typeof name === 'string' &&
                name.trim().length > 0,
            )
            .map((name) => name.trim()),
        ),
      )

      setSingers(cleanNames)
    } catch (error) {
      console.error(
        'Não foi possível carregar os cantores salvos.',
        error,
      )
    }
  }, [])

  function saveSingers(names: string[]) {
    const cleanNames = Array.from(
      new Set(
        names
          .map((name) => name.trim())
          .filter(Boolean),
      ),
    )

    setSingers(cleanNames)

    try {
      localStorage.setItem(
        'videoke-singers',
        JSON.stringify(cleanNames),
      )
    } catch (error) {
      console.error(
        'Não foi possível salvar os cantores no navegador.',
        error,
      )
    }
  }

  useEffect(() => {
    currentMusicRef.current = currentMusic
  }, [currentMusic])

  useEffect(() => {
    liveScoreRef.current = liveScore
  }, [liveScore])

  useEffect(() => {
    const channel = new BroadcastChannel(CHANNEL_NAME)
    channelRef.current = channel

    channel.onmessage = (
      event: MessageEvent<TvMessage>,
    ) => {
      const message = event.data

      if (
        message.type === 'TV_READY' ||
        message.type === 'REQUEST_STATE'
      ) {
        setTvConnected(true)

        if (currentMusicRef.current) {
          channel.postMessage({
            type: 'PLAY',
            music: currentMusicRef.current,
          } satisfies TvMessage)

          channel.postMessage({
            type: 'SCORE',
            score: liveScoreRef.current,
          } satisfies TvMessage)
        } else {
          channel.postMessage({
            type: 'CLEAR',
          } satisfies TvMessage)
        }
      }

      if (message.type === 'TV_CLOSED') {
        setTvConnected(false)
      }
    }

    return () => {
      channel.close()
      channelRef.current = null
    }
  }, [])

  useEffect(() => {
    if (!channelRef.current) return

    if (currentMusic) {
      channelRef.current.postMessage({
        type: 'PLAY',
        music: currentMusic,
      } satisfies TvMessage)
    } else {
      channelRef.current.postMessage({
        type: 'CLEAR',
      } satisfies TvMessage)
    }
  }, [currentMusic])

  useEffect(() => {
    resetScoreSession()
  }, [currentMusic?.id])

  useEffect(() => {
    return () => {
      stopMicrophone()
    }
  }, [])

  function resetScoreSession() {
    scoreTotalRef.current = 0
    scoreCountRef.current = 0
    presenceTotalRef.current = 0
    energyTotalRef.current = 0
    stabilityTotalRef.current = 0
    previousRmsRef.current = 0

    const cleanScore: ScoreData = {
      total: 0,
      presence: 0,
      energy: 0,
      stability: 0,
    }

    liveScoreRef.current = cleanScore
    setLiveScore(cleanScore)

    channelRef.current?.postMessage({
      type: 'SCORE',
      score: cleanScore,
    } satisfies TvMessage)
  }

  async function startMicrophone() {
    try {
      setMicError('')

      const stream =
        await navigator.mediaDevices.getUserMedia({
          audio: {
            echoCancellation: true,
            noiseSuppression: true,
            autoGainControl: true,
          },
        })

      const audioContext = new AudioContext()

      const source =
        audioContext.createMediaStreamSource(stream)

      const analyser = audioContext.createAnalyser()

      analyser.fftSize = 2048
      analyser.smoothingTimeConstant = 0.65

      source.connect(analyser)

      streamRef.current = stream
      audioContextRef.current = audioContext
      analyserRef.current = analyser

      setMicActive(true)
      analyseMicrophone()
    } catch (err) {
      console.error(err)

      setMicError(
        'Não foi possível acessar o microfone. Verifique a permissão do navegador.',
      )

      setMicActive(false)
    }
  }

  function stopMicrophone() {
    if (animationRef.current !== null) {
      cancelAnimationFrame(animationRef.current)
      animationRef.current = null
    }

    streamRef.current
      ?.getTracks()
      .forEach((track) => track.stop())

    streamRef.current = null

    audioContextRef.current
      ?.close()
      .catch(() => {})

    audioContextRef.current = null
    analyserRef.current = null

    setMicActive(false)
  }

  function analyseMicrophone() {
    const analyser = analyserRef.current
    if (!analyser) return

    const buffer =
      new Float32Array(analyser.fftSize)

    const analyse = (timestamp: number) => {
      const activeAnalyser = analyserRef.current
      if (!activeAnalyser) return

      activeAnalyser.getFloatTimeDomainData(buffer)

      if (
        timestamp - lastAnalysisRef.current >=
        220
      ) {
        lastAnalysisRef.current = timestamp

        let sumSquares = 0

        for (let i = 0; i < buffer.length; i++) {
          sumSquares += buffer[i] * buffer[i]
        }

        const rms = Math.sqrt(
          sumSquares / buffer.length,
        )

        const voiceDetected = rms > 0.012

        const energy = clamp(
          Math.round(60 + rms * 800),
          60,
          100,
        )

        const presence = voiceDetected
          ? clamp(
              Math.round(78 + rms * 350),
              78,
              100,
            )
          : 55

        const rmsDifference = Math.abs(
          rms - previousRmsRef.current,
        )

        const stability = clamp(
          Math.round(
            96 - rmsDifference * 850,
          ),
          60,
          100,
        )

        previousRmsRef.current = rms

        let total = 0

        if (voiceDetected) {
          total = Math.round(
            presence * 0.42 +
              energy * 0.28 +
              stability * 0.3,
          )

          total = clamp(total, 60, 99)

          if (currentMusicRef.current) {
            scoreTotalRef.current += total
            scoreCountRef.current += 1
            presenceTotalRef.current += presence
            energyTotalRef.current += energy
            stabilityTotalRef.current += stability
          }
        }

        const scoreData: ScoreData = {
          total,
          presence,
          energy,
          stability,
        }

        liveScoreRef.current = scoreData
        setLiveScore(scoreData)

        if (currentMusicRef.current) {
          channelRef.current?.postMessage({
            type: 'SCORE',
            score: scoreData,
          } satisfies TvMessage)
        }
      }

      animationRef.current =
        requestAnimationFrame(analyse)
    }

    animationRef.current =
      requestAnimationFrame(analyse)
  }

  function getFinalScore() {
    const count = scoreCountRef.current

    if (count === 0) {
      return {
        total: 70,
        presence: 70,
        energy: 70,
        stability: 70,
      }
    }

    return {
      total: clamp(
        Math.round(
          scoreTotalRef.current / count,
        ),
        60,
        99,
      ),

      presence: clamp(
        Math.round(
          presenceTotalRef.current / count,
        ),
        60,
        100,
      ),

      energy: clamp(
        Math.round(
          energyTotalRef.current / count,
        ),
        60,
        100,
      ),

      stability: clamp(
        Math.round(
          stabilityTotalRef.current / count,
        ),
        60,
        100,
      ),
    }
  }

  function finalizeCurrentSong() {
    if (!currentMusic) return null

    const finalScore = getFinalScore()

    const result: RankingItem = {
      id: `${Date.now()}-${currentMusic.id}`,
      singer: currentMusic.singer,
      title: currentMusic.title,
      artist: currentMusic.artist,
      score: finalScore.total,
      presence: finalScore.presence,
      energy: finalScore.energy,
      stability: finalScore.stability,
    }

    setRanking((current) =>
      [...current, result].sort(
        (a, b) => b.score - a.score,
      ),
    )

    channelRef.current?.postMessage({
      type: 'RESULT',
      result,
    } satisfies TvMessage)

    return result
  }

  function openTvScreen() {
    const tvWindow = window.open(
      '/tv',
      'videoke-tv',
      'width=1280,height=720',
    )

    if (!tvWindow) {
      alert(
        'O navegador bloqueou a janela da TV. Permita pop-ups para localhost.',
      )

      return
    }

    tvWindow.focus()
  }

  async function searchYouTube(
    event: FormEvent,
  ) {
    event.preventDefault()

    const term = search.trim()
    if (!term) return

    if (!youtubeApiKey) {
      setError(
        'A chave VITE_YOUTUBE_API_KEY não foi encontrada no arquivo .env.',
      )

      return
    }

    try {
      setLoading(true)
      setError('')
      setSearchDone(false)

      const query = encodeURIComponent(
        `${term} karaoke`,
      )

      const url =
        `https://www.googleapis.com/youtube/v3/search` +
        `?part=snippet` +
        `&type=video` +
        `&videoEmbeddable=true` +
        `&videoSyndicated=true` +
        `&maxResults=12` +
        `&order=relevance` +
        `&q=${query}` +
        `&key=${youtubeApiKey}`

      const response = await fetch(url)

      const data =
        (await response.json()) as YouTubeSearchResponse

      if (!response.ok) {
        throw new Error(
          data.error?.message ||
            'Não foi possível consultar o YouTube.',
        )
      }

      const songs: Music[] =
        data.items
          ?.filter((item) => item.id.videoId)
          .map((item) => ({
            id: item.id.videoId as string,
            title: decodeHtml(
              item.snippet.title,
            ),
            artist: decodeHtml(
              item.snippet.channelTitle,
            ),
            thumbnail:
              item.snippet.thumbnails.high?.url ||
              item.snippet.thumbnails.medium?.url ||
              item.snippet.thumbnails.default?.url ||
              '',
          })) ?? []

      setResults(songs)
      setSearchDone(true)
    } catch (err) {
      console.error(err)

      setResults([])
      setSearchDone(true)

      if (err instanceof Error) {
        setError(err.message)
      } else {
        setError(
          'Ocorreu um erro ao pesquisar no YouTube.',
        )
      }
    } finally {
      setLoading(false)
    }
  }

  function chooseMusic(music: Music) {
    setSelectedMusic(music)
    setSelectedSinger('')
    setNewSingerName('')
    setSingerMessage('')
    setShowNewSinger(singers.length === 0)
    setShowSingerManager(false)
  }

  function registerSinger() {
    const name = newSingerName.trim()

    if (!name) {
      setSingerMessage(
        'Digite o nome do cantor.',
      )
      return
    }

    const existing = singers.find(
      (singer) =>
        singer.trim().toLocaleLowerCase('pt-BR') ===
        name.toLocaleLowerCase('pt-BR'),
    )

    if (existing) {
      setSelectedSinger(existing)
      setNewSingerName('')
      setShowNewSinger(false)
      setSingerMessage(
        `${existing} já estava cadastrado e foi selecionado.`,
      )
      return
    }

    const updated = [...singers, name]

    saveSingers(updated)
    setSelectedSinger(name)
    setNewSingerName('')
    setShowNewSinger(false)
    setSingerMessage(
      `${name} cadastrado com sucesso.`,
    )
  }

  function removeSinger(name: string) {
    const updated = singers.filter(
      (singer) => singer !== name,
    )

    saveSingers(updated)

    if (selectedSinger === name) {
      setSelectedSinger('')
    }

    if (updated.length === 0) {
      setShowSingerManager(false)
      setShowNewSinger(true)
    }
  }

  function addToQueue() {
    if (!selectedMusic || !selectedSinger) {
      return
    }

    const newItem: QueueItem = {
      ...selectedMusic,
      singer: selectedSinger,
    }

    if (!currentMusic) {
      setCurrentMusic(newItem)
    } else {
      setQueue((current) => [
        ...current,
        newItem,
      ])
    }

    setSelectedMusic(null)
    setSelectedSinger('')
    setNewSingerName('')
    setShowNewSinger(false)
    setShowSingerManager(false)
    setSingerMessage('')
  }

  function playMusic(index: number) {
    if (changingMusic) return

    const selected = queue[index]
    if (!selected) return

    if (currentMusic) {
      finalizeCurrentSong()
    }

    const oldCurrent = currentMusic

    setCurrentMusic(selected)

    setQueue((current) => {
      const remaining = current.filter(
        (_, itemIndex) => itemIndex !== index,
      )

      if (oldCurrent) {
        return [...remaining, oldCurrent]
      }

      return remaining
    })
  }

  function playNext() {
    if (changingMusic || !currentMusic) {
      return
    }

    finalizeCurrentSong()
    setChangingMusic(true)

    window.setTimeout(() => {
      if (queue.length === 0) {
        setCurrentMusic(null)
        setChangingMusic(false)
        return
      }

      const [next, ...remaining] = queue

      setCurrentMusic(next)
      setQueue(remaining)
      setChangingMusic(false)
    }, 4000)
  }

  function removeFromQueue(index: number) {
    setQueue((current) =>
      current.filter(
        (_, itemIndex) => itemIndex !== index,
      ),
    )
  }

  return (
    <div className="app control-app">
      <header className="topbar">
        <div className="brand">
          <div className="brand-icon">🎤</div>

          <div>
            <h1>VideoKê</h1>
            <span>Painel de controle</span>
          </div>
        </div>

        <div className="topbar-actions">
          {role === 'master' && (
            <button
              type="button"
              className="user-settings-button"
              onClick={() =>
                setShowUserSettings(true)
              }
            >
              <span className="user-settings-icon">
                ⚙
              </span>
              Configuração de usuários
            </button>
          )}

          <div className="account-chip">
            <div className="account-chip-text">
              <strong>
                {role === 'master'
                  ? 'Master'
                  : 'Usuário'}
              </strong>
              <span>
                {currentUser.email ?? 'Usuário'}
              </span>
            </div>

            <button
              type="button"
              className="logout-button"
              onClick={() => {
                void onLogout()
              }}
            >
              Sair
            </button>
          </div>

          <button
            type="button"
            className={`mic-button ${
              micActive ? 'active' : ''
            }`}
            onClick={
              micActive
                ? stopMicrophone
                : startMicrophone
            }
          >
            {micActive
              ? '🎤 Microfone ativo'
              : '🎙 Ativar microfone'}
          </button>

          <div
            className={`tv-status ${
              tvConnected ? 'connected' : ''
            }`}
          >
            <span className="status-dot"></span>

            {tvConnected
              ? 'TV conectada'
              : 'TV não aberta'}
          </div>

          <button
            type="button"
            className="tv-open-button"
            onClick={openTvScreen}
          >
            🖥 Abrir Tela da TV
          </button>
        </div>
      </header>

      {micError && (
        <div className="mic-error">
          {micError}
        </div>
      )}

      <main className="control-layout">
        <section className="catalog-panel">
          <div className="panel-heading">
            <div>
              <span className="eyebrow">
                CATÁLOGO
              </span>

              <h2>
                Escolha a próxima música
              </h2>
            </div>

            <span className="youtube-badge">
              ▶ YouTube
            </span>
          </div>

          <form
            className="search-box"
            onSubmit={searchYouTube}
          >
            <span>🔎</span>

            <input
              type="text"
              placeholder="Digite música ou artista..."
              value={search}
              onChange={(event) =>
                setSearch(event.target.value)
              }
            />

            <button
              type="submit"
              className="primary-button"
              disabled={loading}
            >
              {loading
                ? 'Buscando...'
                : 'Buscar'}
            </button>
          </form>

          {error && (
            <div className="search-error">
              {error}
            </div>
          )}

          {!searchDone &&
            !loading &&
            results.length === 0 && (
              <div className="results-info">
                Pesquise uma música ou artista no
                YouTube.
              </div>
            )}

          {loading && (
            <div className="results-info">
              Pesquisando no YouTube...
            </div>
          )}

          {searchDone && !loading && (
            <div className="results-info">
              {results.length} resultado(s)
              encontrado(s)
            </div>
          )}

          <div className="control-results-grid">
            {results.map((music) => (
              <button
                key={music.id}
                type="button"
                className="control-music-card"
                onClick={() =>
                  chooseMusic(music)
                }
              >
                <div className="control-thumbnail">
                  <img
                    src={music.thumbnail}
                    alt=""
                  />

                  <div className="control-play">
                    ▶
                  </div>
                </div>

                <div className="control-music-info">
                  <strong>
                    {music.title}
                  </strong>

                  <span>{music.artist}</span>

                  <small>YOUTUBE</small>
                </div>
              </button>
            ))}
          </div>
        </section>

        <aside className="side-control-panel">
          <section className="now-control-card">
            <div className="panel-heading compact">
              <div>
                <span className="eyebrow">
                  AGORA
                </span>

                <h2>Cantando</h2>
              </div>

              {currentMusic && micActive && (
                <div className="live-score">
                  <small>PONTOS</small>
                  <strong>
                    {liveScore.total || '--'}
                  </strong>
                </div>
              )}
            </div>

            {currentMusic ? (
              <div className="now-control-content">
                <img
                  src={currentMusic.thumbnail}
                  alt=""
                />

                <strong>
                  {currentMusic.title}
                </strong>

                <span>
                  {currentMusic.artist}
                </span>

                <div className="now-singer">
                  <small>CANTOR</small>
                  <b>🎤 {currentMusic.singer}</b>
                </div>

                <div className="operator-mascot-zone">
                  <KaraokeMascot
                    score={liveScore.total}
                    compact
                    active={Boolean(currentMusic)}
                  />
                </div>

                {micActive && (
                  <div className="score-meters">
                    <div>
                      <span>Presença</span>
                      <b>{liveScore.presence}</b>
                    </div>

                    <div>
                      <span>Energia</span>
                      <b>{liveScore.energy}</b>
                    </div>

                    <div>
                      <span>Constância</span>
                      <b>{liveScore.stability}</b>
                    </div>
                  </div>
                )}

                <button
                  type="button"
                  className="primary-button next-control-button"
                  onClick={playNext}
                  disabled={changingMusic}
                >
                  {changingMusic
                    ? '🏆 Mostrando resultado...'
                    : '⏭ Próxima música'}
                </button>
              </div>
            ) : (
              <div className="empty-control">
                <span>🎵</span>

                <strong>
                  Nenhuma música tocando
                </strong>

                <small>
                  Escolha uma música.
                </small>
              </div>
            )}
          </section>

          <section className="queue-card control-queue">
            <div className="queue-header">
              <div>
                <span className="eyebrow">
                  FILA
                </span>

                <h2>
                  Próximos cantores
                </h2>
              </div>

              <span className="queue-count">
                {queue.length}
              </span>
            </div>

            {queue.length === 0 ? (
              <div className="empty-queue">
                A fila está vazia.
              </div>
            ) : (
              <div className="queue-list">
                {queue.map(
                  (music, index) => (
                    <div
                      className="queue-item"
                      key={`${music.id}-${index}`}
                    >
                      <div className="queue-position">
                        {index + 1}
                      </div>

                      <div className="queue-info">
                        <strong>
                          {music.title}
                        </strong>

                        <span>
                          {music.artist}
                        </span>

                        <small>
                          🎤 {music.singer}
                        </small>
                      </div>

                      <div className="queue-actions">
                        <button
                          type="button"
                          title="Tocar agora"
                          onClick={() =>
                            playMusic(index)
                          }
                        >
                          ▶
                        </button>

                        <button
                          type="button"
                          title="Remover"
                          onClick={() =>
                            removeFromQueue(
                              index,
                            )
                          }
                        >
                          ✕
                        </button>
                      </div>
                    </div>
                  ),
                )}
              </div>
            )}
          </section>

          <section className="ranking-card">
            <div className="ranking-heading">
              <div>
                <span className="eyebrow">
                  🏆 RANKING
                </span>

                <h2>Ranking da noite</h2>
              </div>
            </div>

            {ranking.length === 0 ? (
              <div className="ranking-empty">
                As pontuações aparecerão aqui.
              </div>
            ) : (
              <div className="ranking-list">
                {ranking
                  .slice(0, 10)
                  .map((item, index) => (
                    <div
                      className="ranking-item"
                      key={item.id}
                    >
                      <div className="ranking-position">
                        {index === 0
                          ? '🥇'
                          : index === 1
                            ? '🥈'
                            : index === 2
                              ? '🥉'
                              : index + 1}
                      </div>

                      <div className="ranking-info">
                        <strong>
                          {item.singer}
                        </strong>

                        <span>
                          {item.title}
                        </span>
                      </div>

                      <div className="ranking-score">
                        {item.score}
                      </div>
                    </div>
                  ))}
              </div>
            )}
          </section>
        </aside>
      </main>

      {selectedMusic && (
        <div className="modal-overlay">
          <div className="modal singer-modal">
            <button
              type="button"
              className="modal-close"
              onClick={() => {
                setSelectedMusic(null)
                setSelectedSinger('')
                setNewSingerName('')
                setShowNewSinger(false)
                setShowSingerManager(false)
                setSingerMessage('')
              }}
            >
              ✕
            </button>

            <div className="modal-icon">
              🎤
            </div>

            <span className="eyebrow">
              ADICIONAR À FILA
            </span>

            <h2>{selectedMusic.title}</h2>
            <p>{selectedMusic.artist}</p>

            <div className="singer-section">
              <div className="singer-title-row">
                <div>
                  <label>Quem vai cantar?</label>
                  <span>
                    Selecione um cantor já cadastrado.
                  </span>
                </div>

                {singers.length > 0 && (
                  <button
                    type="button"
                    className="singer-manage-button"
                    onClick={() =>
                      setShowSingerManager(
                        (current) => !current,
                      )
                    }
                  >
                    {showSingerManager
                      ? 'Fechar'
                      : 'Gerenciar'}
                  </button>
                )}
              </div>

              {singers.length > 0 && (
                <div className="singer-grid">
                  {singers.map((singer) => (
                    <button
                      key={singer}
                      type="button"
                      className={`singer-option ${
                        selectedSinger === singer
                          ? 'selected'
                          : ''
                      }`}
                      onClick={() => {
                        setSelectedSinger(singer)
                        setShowNewSinger(false)
                      }}
                    >
                      <span className="singer-avatar">
                        {singer
                          .charAt(0)
                          .toUpperCase()}
                      </span>

                      <strong>{singer}</strong>

                      {selectedSinger === singer && (
                        <span className="singer-check">
                          ✓
                        </span>
                      )}
                    </button>
                  ))}
                </div>
              )}

              {singers.length === 0 && (
                <div className="singer-empty">
                  Ainda não há cantores cadastrados.
                  Cadastre o primeiro abaixo.
                </div>
              )}

              <button
                type="button"
                className="new-singer-button"
                onClick={() => {
                  setShowNewSinger(
                    (current) => !current,
                  )
                  setShowSingerManager(false)
                }}
              >
                ＋ Novo cantor
              </button>

              {showNewSinger && (
                <div className="new-singer-form">
                  <input
                    autoFocus
                    type="text"
                    placeholder="Digite o nome do novo cantor"
                    value={newSingerName}
                    onChange={(event) =>
                      setNewSingerName(
                        event.target.value,
                      )
                    }
                    onKeyDown={(event) => {
                      if (event.key === 'Enter') {
                        registerSinger()
                      }
                    }}
                  />

                  <button
                    type="button"
                    className="singer-register-button"
                    onClick={registerSinger}
                    disabled={
                      !newSingerName.trim()
                    }
                  >
                    Cadastrar
                  </button>
                </div>
              )}

              {showUserSettings &&
                role === 'master' && (
                  <div
                    className="user-settings-overlay"
                    onMouseDown={(event) => {
                      if (
                        event.target ===
                        event.currentTarget
                      ) {
                        setShowUserSettings(false)
                      }
                    }}
                  >
                    <section className="user-settings-modal">
                      <header className="user-settings-header">
                        <div>
                          <span className="user-settings-kicker">
                            ÁREA MASTER
                          </span>
                          <h2>
                            Configuração de usuários
                          </h2>
                          <p>
                            Esta área é exclusiva do
                            perfil Master.
                          </p>
                        </div>

                        <button
                          type="button"
                          className="user-settings-close"
                          onClick={() =>
                            setShowUserSettings(false)
                          }
                          aria-label="Fechar configurações de usuários"
                        >
                          ×
                        </button>
                      </header>

                      <div className="user-settings-info">
                        <div className="user-settings-current">
                          <span>
                            Usuário conectado
                          </span>
                          <strong>
                            {currentUser.email ??
                              'Master'}
                          </strong>
                        </div>

                        <span className="user-settings-role">
                          Master
                        </span>
                      </div>

                      <div className="user-settings-grid">
                        <article className="user-settings-card">
                          <div className="user-settings-card-icon">
                            👤
                          </div>
                          <div>
                            <strong>
                              Usuários do VideoKê
                            </strong>
                            <p>
                              Gerenciamento de contas
                              será feito nesta área.
                            </p>
                          </div>
                        </article>

                        <article className="user-settings-card">
                          <div className="user-settings-card-icon">
                            🔐
                          </div>
                          <div>
                            <strong>
                              Acesso protegido
                            </strong>
                            <p>
                              Usuários comuns não veem
                              este botão nem este painel.
                            </p>
                          </div>
                        </article>
                      </div>

                      <div className="user-settings-note">
                        <strong>
                          VideoKê continua completo para
                          o usuário comum.
                        </strong>
                        <span>
                          Busca de músicas, cadastro de
                          cantores, fila, reprodução,
                          tela da TV, tela cheia,
                          microfone, pontuação e ranking
                          permanecem disponíveis.
                        </span>
                      </div>

                      <footer className="user-settings-footer">
                        <button
                          type="button"
                          onClick={() =>
                            setShowUserSettings(false)
                          }
                        >
                          Fechar
                        </button>
                      </footer>
                    </section>
                  </div>
                )}

              {showSingerManager &&
                singers.length > 0 && (
                  <div className="singer-manager">
                    <strong>
                      Cantores cadastrados
                    </strong>

                    <div className="singer-manager-list">
                      {singers.map((singer) => (
                        <div
                          className="singer-manager-item"
                          key={singer}
                        >
                          <span>{singer}</span>

                          <button
                            type="button"
                            onClick={() =>
                              removeSinger(singer)
                            }
                          >
                            Excluir
                          </button>
                        </div>
                      ))}
                    </div>
                  </div>
                )}
            </div>

            {singerMessage && (
              <div
                style={{
                  marginBottom: '12px',
                  padding: '10px 12px',
                  borderRadius: '10px',
                  background:
                    'rgba(34, 197, 94, 0.12)',
                  border:
                    '1px solid rgba(34, 197, 94, 0.28)',
                  color: '#bbf7d0',
                  fontSize: '12px',
                  fontWeight: 700,
                  textAlign: 'center',
                }}
              >
                {singerMessage}
              </div>
            )}

            <button
              type="button"
              className="primary-button singer-add-queue-button"
              onClick={addToQueue}
              disabled={!selectedSinger}
            >
              {selectedSinger
                ? `Adicionar ${selectedSinger} à fila`
                : 'Selecione um cantor'}
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

function LoginScreen() {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [showPassword, setShowPassword] =
    useState(false)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

  async function handleLogin(
    event: FormEvent<HTMLFormElement>,
  ) {
    event.preventDefault()

    const cleanEmail = email.trim()

    if (!cleanEmail || !password) {
      setError('Informe o e-mail e a senha.')
      return
    }

    setLoading(true)
    setError('')

    const { error: loginError } =
      await supabase.auth.signInWithPassword({
        email: cleanEmail,
        password,
      })

    if (loginError) {
      setError(
        'E-mail ou senha inválidos. Confira os dados e tente novamente.',
      )
      setLoading(false)
      return
    }

    setLoading(false)
  }

  return (
    <div className="auth-page">
      <div className="auth-background-glow auth-glow-one" />
      <div className="auth-background-glow auth-glow-two" />

      <section className="auth-card">
        <div className="auth-logo">
          <div className="auth-logo-icon">🎤</div>

          <div>
            <h1>VideoKê</h1>
            <span>Seu palco começa aqui</span>
          </div>
        </div>

        <div className="auth-heading">
          <span className="auth-kicker">
            ACESSO AO SISTEMA
          </span>

          <h2>Entrar</h2>

          <p>
            Use seu usuário cadastrado para acessar
            o painel do VideoKê.
          </p>
        </div>

        <form
          className="auth-form"
          onSubmit={handleLogin}
        >
          <label>
            <span>E-mail</span>

            <input
              type="email"
              value={email}
              onChange={(event) =>
                setEmail(event.target.value)
              }
              placeholder="seuemail@exemplo.com"
              autoComplete="email"
              autoFocus
            />
          </label>

          <label>
            <span>Senha</span>

            <div className="auth-password-field">
              <input
                type={
                  showPassword
                    ? 'text'
                    : 'password'
                }
                value={password}
                onChange={(event) =>
                  setPassword(event.target.value)
                }
                placeholder="Digite sua senha"
                autoComplete="current-password"
              />

              <button
                type="button"
                className="auth-show-password"
                onClick={() =>
                  setShowPassword(
                    (current) => !current,
                  )
                }
              >
                {showPassword
                  ? 'Ocultar'
                  : 'Mostrar'}
              </button>
            </div>
          </label>

          {error && (
            <div className="auth-error">
              {error}
            </div>
          )}

          <button
            type="submit"
            className="auth-submit"
            disabled={loading}
          >
            {loading
              ? 'Entrando...'
              : 'Entrar no VideoKê'}
          </button>
        </form>

        <div className="auth-footer">
          Acesso permitido somente para usuários
          cadastrados.
        </div>
      </section>
    </div>
  )
}

function AuthLoadingScreen() {
  return (
    <div className="auth-page">
      <div className="auth-loading-card">
        <div className="auth-loading-icon">🎤</div>
        <strong>VideoKê</strong>
        <span>Carregando...</span>
      </div>
    </div>
  )
}

function App() {
  const [currentUser, setCurrentUser] =
    useState<User | null>(null)

  const [role, setRole] =
    useState<AppRole | null>(null)

  const [authLoading, setAuthLoading] =
    useState(true)

  useEffect(() => {
    let active = true

    async function loadUserRole(user: User) {
      const { data, error } = await supabase
        .from('profiles')
        .select('role')
        .eq('id', user.id)
        .maybeSingle()

      if (!active) return

      if (error) {
        console.error(
          'Não foi possível carregar o perfil do usuário.',
          error,
        )
        setRole('user')
        return
      }

      setRole(
        data?.role === 'master'
          ? 'master'
          : 'user',
      )
    }

    async function loadSession() {
      const { data } =
        await supabase.auth.getSession()

      if (!active) return

      const user =
        data.session?.user ?? null

      setCurrentUser(user)

      if (user) {
        await loadUserRole(user)
      } else {
        setRole(null)
      }

      if (active) {
        setAuthLoading(false)
      }
    }

    void loadSession()

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange(
      (_event, session) => {
        const user = session?.user ?? null

        setCurrentUser(user)

        if (user) {
          void loadUserRole(user)
        } else {
          setRole(null)
          setAuthLoading(false)
        }
      },
    )

    return () => {
      active = false
      subscription.unsubscribe()
    }
  }, [])

  async function handleLogout() {
    await supabase.auth.signOut()
    setCurrentUser(null)
    setRole(null)
  }

  if (authLoading) {
    return <AuthLoadingScreen />
  }

  if (!currentUser || !role) {
    return <LoginScreen />
  }

  const isTvScreen =
    window.location.pathname === '/tv'

  if (isTvScreen) {
    return <TvScreen />
  }

  return (
    <ControlPanel
      currentUser={currentUser}
      role={role}
      onLogout={handleLogout}
    />
  )
}

export default App
