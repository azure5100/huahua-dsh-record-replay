import type { ReplayApi } from '../api.ts'
import type { RecordingSummary } from '../../types.ts'
import { tt } from '../helpers.ts'

/** Full-screen video playback for one recording. */
export function VideoModal({ api, recording, onClose }: {
  api: ReplayApi
  recording: RecordingSummary
  onClose(): void
}) {
  return (
    <div className="rrp-modalBackdrop" onClick={onClose}>
      <div className="rrp-modal" onClick={event => event.stopPropagation()} style={{ width: 'min(760px, 94%)' }}>
        <div className="rrp-modalTitle">{recording.title}</div>
        <video
          className="rrp-recordVideo"
          controls
          autoPlay
          src={api.videoUrl(recording.id)}
          style={{ maxHeight: '62vh' }}
        />
        <div className="rrp-modalActions">
          <button className="rrp-btn" onClick={onClose}>{tt('run.close')}</button>
        </div>
      </div>
    </div>
  )
}
