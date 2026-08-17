import { useCallback, useEffect, useRef, useState } from 'react'
import type { ReplayApi } from '../api.ts'
import type { ReplayRuntimeFaces } from '../mount.tsx'
import type { RecordingSummary } from '../../types.ts'
import { fill, tt } from '../helpers.ts'
import { VideoModal } from './VideoModal.tsx'
import { SkillGenModal } from './SkillGenModal.tsx'

const MAX_FRAMES = 240
const FRAME_INTERVAL_MS = 2000

/** Live recording state (kept in a ref so async stop handlers see fresh state). */
interface ActiveRecording {
  title: string
  stream: MediaStream
  recorder: MediaRecorder
  videoEl: HTMLVideoElement
  canvas: HTMLCanvasElement
  ctx: CanvasRenderingContext2D
  chunks: BlobPart[]
  frames: Blob[]
  timer: ReturnType<typeof setInterval>
  clock: ReturnType<typeof setInterval>
  startedAt: number
  elapsed: number
}

function formatElapsed(seconds: number): string {
  const m = Math.floor(seconds / 60)
  const s = seconds % 60
  return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
}

function formatTime(value: number): string {
  const date = new Date(value)
  const pad = (n: number): string => String(n).padStart(2, '0')
  return `${date.getFullYear()}-${pad(date.getMonth() + 1)}-${pad(date.getDate())} ${pad(date.getHours())}:${pad(date.getMinutes())}`
}

function formatBytes(bytes: number): string {
  if (bytes < 1024) return `${bytes} B`
  if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
  return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
}

export function RecordTab({ api, runtime }: { api: ReplayApi; runtime: ReplayRuntimeFaces }) {
  const [recordings, setRecordings] = useState<RecordingSummary[] | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [active, setActive] = useState<ActiveRecording | null>(null)
  const [uploading, setUploading] = useState(false)
  const [viewing, setViewing] = useState<RecordingSummary | null>(null)
  const [skillFor, setSkillFor] = useState<RecordingSummary | null>(null)
  const activeRef = useRef<ActiveRecording | null>(null)

  const load = useCallback(async () => {
    setError(null)
    try { setRecordings(await api.listRecordings()) }
    catch (reason) { setError(String(reason)) }
  }, [api])

  useEffect(() => { void load() }, [load])

  const stopRecording = useCallback(async () => {
    const rec = activeRef.current
    if (rec === null) return
    activeRef.current = null
    setActive(null)
    setUploading(true)
    clearInterval(rec.timer)
    clearInterval(rec.clock)
    rec.stream.getTracks().forEach(track => { track.stop() })
    // Let the recorder flush its final chunk, then upload everything.
    const stopPromise = new Promise<void>(resolve => {
      if (rec.recorder.state === 'inactive') { resolve(); return }
      rec.recorder.onstop = () => resolve()
      rec.recorder.stop()
    })
    await stopPromise
    const videoBlob = new Blob(rec.chunks, { type: 'video/webm' })
    try {
      const meta = await api.createRecording(rec.title)
      if (videoBlob.size > 0) await api.uploadRecordingVideo(meta.id, videoBlob)
      for (let index = 0; index < rec.frames.length; index += 1) {
        const name = 'frame-' + String(index + 1).padStart(4, '0') + '.png'
        await api.uploadRecordingFrame(meta.id, name, rec.frames[index])
      }
      await load()
    } catch (reason) { setError(String(reason)) }
    setUploading(false)
  }, [api, load])

  const startRecording = useCallback(async () => {
    try {
      const title = window.prompt(tt('record.titlePrompt'), '') ?? ''
      const stream = await navigator.mediaDevices.getDisplayMedia({ video: { frameRate: 15 }, audio: false })
      // A detached <video> feeds the frame sampler (never shown on screen).
      const videoEl = document.createElement('video')
      videoEl.muted = true
      videoEl.playsInline = true
      videoEl.srcObject = stream
      await videoEl.play()
      let mimeType = 'video/webm;codecs=vp9'
      if (typeof MediaRecorder !== 'undefined' && !MediaRecorder.isTypeSupported(mimeType)) mimeType = 'video/webm'
      const recorder = new MediaRecorder(stream, { mimeType })
      const chunks: BlobPart[] = []
      recorder.ondataavailable = event => { if (event.data.size > 0) chunks.push(event.data) }
      recorder.start(500)
      const canvas = document.createElement('canvas')
      const ctx = canvas.getContext('2d')
      if (ctx === null) throw new Error('canvas 2d context unavailable')
      const frames: Blob[] = []
      const timer = setInterval(() => {
        if (frames.length >= MAX_FRAMES || videoEl.videoWidth === 0) return
        const width = 960
        const height = Math.max(1, Math.round(videoEl.videoHeight * width / videoEl.videoWidth))
        canvas.width = width
        canvas.height = height
        ctx.drawImage(videoEl, 0, 0, width, height)
        canvas.toBlob(blob => { if (blob !== null) frames.push(blob) }, 'image/png')
      }, FRAME_INTERVAL_MS)
      const clock = setInterval(() => {
        setActive(prev => prev === null ? null : { ...prev, elapsed: Math.floor((Date.now() - prev.startedAt) / 1000) })
      }, 1000)
      const rec: ActiveRecording = { title, stream, recorder, videoEl, canvas, ctx, chunks, frames, timer, clock, startedAt: Date.now(), elapsed: 0 }
      activeRef.current = rec
      setActive(rec)
      // The browser's own "Stop sharing" button also ends the recording.
      stream.getVideoTracks()[0]?.addEventListener('ended', () => { void stopRecording() })
    } catch (reason) {
      // User cancelled the picker or capture failed.
      setError(reason instanceof Error ? reason.message : String(reason))
    }
  }, [stopRecording])

  const remove = useCallback(async (recording: RecordingSummary) => {
    if (!window.confirm(tt('record.deleteConfirm'))) return
    try { await api.deleteRecording(recording.id); await load() }
    catch (reason) { setError(String(reason)) }
  }, [api, load])

  return (
    <div>
      {error !== null && <div className="rrp-error">{error}</div>}
      <div className="rrp-recordBar">
        {active === null ? (
          <button className="rrp-recordBtn" data-primary="" onClick={() => void startRecording()} disabled={uploading}>{tt('record.start')}</button>
        ) : (
          <>
            <span className="rrp-recordLive">{tt('record.recording')}</span>
            <span className="rrp-recordTimer">{formatElapsed(active.elapsed)}</span>
            <span className="rrp-recordFrames">{fill(tt('record.frames'), { frames: active.frames.length })}</span>
            <button className="rrp-recordBtn" onClick={() => void stopRecording()}>{tt('record.stop')}</button>
          </>
        )}
        {uploading && <span className="rrp-note">{tt('record.uploading')}</span>}
      </div>
      {recordings === null ? <div className="rrp-note">{tt('sessions.loading')}</div>
        : recordings.length === 0 ? <div className="rrp-empty">{tt('record.empty')}</div>
        : (
          <div className="rrp-list">
            {recordings.map(rec => (
              <div className="rrp-row" key={rec.id}>
                <div className="rrp-rowMain">
                  <div className="rrp-rowTitle">{rec.title}</div>
                  <div className="rrp-rowMeta">{formatTime(rec.createdAt)} · {fill(tt('record.frames'), { frames: rec.frames })} · {rec.videoBytes !== undefined ? fill(tt('record.video'), { size: formatBytes(rec.videoBytes) }) : tt('record.noVideo')}</div>
                </div>
                <div className="rrp-rowActions">
                  {rec.videoBytes !== undefined && <button className="rrp-btn" onClick={() => setViewing(rec)}>{tt('record.replay')}</button>}
                  <button className="rrp-btn" data-primary="" onClick={() => setSkillFor(rec)} disabled={rec.frames === 0}>{tt('record.genSkill')}</button>
                  <button className="rrp-btn" data-danger="" onClick={() => void remove(rec)}>{tt('record.delete')}</button>
                </div>
              </div>
            ))}
          </div>
        )}
      {viewing !== null && <VideoModal api={api} recording={viewing} onClose={() => setViewing(null)} />}
      {skillFor !== null && <SkillGenModal api={api} runtime={runtime} recording={skillFor} onClose={() => setSkillFor(null)} />}
    </div>
  )
}
