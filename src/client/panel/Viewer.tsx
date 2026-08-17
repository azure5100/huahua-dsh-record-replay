import { useMemo, useState } from 'react'
import type { ReplayApi } from '../api.ts'
import type { TimelineItem } from '../../types.ts'
import { fill, tt } from '../helpers.ts'
import type { ViewerSource } from './ReplayPanel.tsx'

/** Pretty-print tool-call JSON arguments (fall back to raw). */
function prettyArgs(argsText: string): string {
  if (argsText === '') return ''
  try {
    const parsed: unknown = JSON.parse(argsText)
    return JSON.stringify(parsed, null, 2)
  } catch { return argsText }
}

/** Truncate long text for the collapsed preview. */
function preview(text: string, max: number): string {
  return text.length <= max ? text : text.slice(0, max) + '…（已截断，点击展开查看全文）'
}

/** Searchable flat text of one item. */
function searchText(item: TimelineItem): string {
  switch (item.kind) {
    case 'user': return item.text
    case 'assistant': return item.text + '\n' + (item.reasoning ?? '')
    case 'tool': return item.name + '\n' + item.argsText
    case 'result': return item.text
    default: return ''
  }
}

function ItemView({ item }: { item: TimelineItem }) {
  const [expanded, setExpanded] = useState(false)
  switch (item.kind) {
    case 'turn':
      return <div className="rrp-turnDivider">第 {item.turn} 轮</div>
    case 'step':
      return null
    case 'user':
      return <div className="rrp-item rrp-item-user">{item.text}</div>
    case 'assistant':
      return (
        <div className="rrp-item rrp-item-assistant">
          {item.reasoning !== undefined && item.reasoning !== '' && (
            <details className="rrp-details">
              <summary>{tt('viewer.reasoning')}</summary>
              <pre className="rrp-pre rrp-muted">{item.reasoning}</pre>
            </details>
          )}
          {item.text !== '' && <div>{item.text}</div>}
        </div>
      )
    case 'tool':
      return (
        <div className="rrp-item rrp-item-tool">
          <div className="rrp-itemTag">{tt('viewer.tool')} <code>{item.name}</code></div>
          {item.argsText !== '' && (
            <details className="rrp-details">
              <summary>{tt('viewer.args')}</summary>
              <pre className="rrp-pre">{prettyArgs(item.argsText)}</pre>
            </details>
          )}
        </div>
      )
    case 'result':
      return (
        <div className="rrp-item rrp-item-result">
          <div className="rrp-itemTag">{tt('viewer.result')}{item.ok === false ? ' · 失败' : ''}</div>
          {item.text === '' ? (
            <div className="rrp-muted">（无文本输出）</div>
          ) : expanded ? (
            <>
              <pre className="rrp-pre">{item.text}</pre>
              <button className="rrp-btn" onClick={() => setExpanded(false)}>{tt('viewer.collapse')}</button>
            </>
          ) : (
            <>
              <pre className="rrp-pre">{preview(item.text, 2000)}</pre>
              {item.text.length > 2000 && <button className="rrp-btn" onClick={() => setExpanded(true)}>{tt('viewer.expand')}</button>}
            </>
          )}
        </div>
      )
  }
}

export function Viewer({ source, api, onRun }: {
  source: ViewerSource
  api: ReplayApi
  onRun(title: string, items: TimelineItem[]): void
}) {
  const [query, setQuery] = useState('')
  const [copied, setCopied] = useState(false)

  const q = query.trim().toLowerCase()
  const visible = useMemo(() => {
    if (q === '') return source.items
    return source.items.filter(item => searchText(item).toLowerCase().includes(q))
  }, [source.items, q])

  const copyTimeline = async () => {
    const text = source.items.map(item => {
      switch (item.kind) {
        case 'user': return '[用户] ' + item.text
        case 'assistant': return '[助手] ' + item.text
        case 'tool': return '[工具] ' + item.name + ' ' + item.argsText
        case 'result': return '[结果] ' + preview(item.text, 400)
        default: return ''
      }
    }).filter(Boolean).join('\n\n')
    try {
      await navigator.clipboard.writeText(text)
      setCopied(true)
      setTimeout(() => setCopied(false), 1500)
    } catch { /* clipboard unavailable */ }
  }

  const stats = fill(tt('viewer.stats'), {
    turns: source.meta.turns,
    steps: source.meta.steps,
    user: source.meta.userMessages,
    tools: source.meta.toolCalls,
  })

  return (
    <div className="rrp-viewer">
      <div className="rrp-viewerToolbar">
        <span className="rrp-viewerStats">{source.title} · {stats}</span>
        <input
          className="rrp-viewerSearch"
          placeholder={tt('viewer.searchPlaceholder')}
          value={query}
          onChange={event => setQuery(event.target.value)}
        />
        <button className="rrp-btn" onClick={() => void copyTimeline()}>{copied ? tt('viewer.copied') : tt('viewer.copy')}</button>
        {source.kind === 'session' && <button className="rrp-btn" onClick={() => api.exportPack(source.sessionId)}>{tt('session.export')}</button>}
        <button className="rrp-btn" data-primary="" onClick={() => onRun(source.title, source.items)}>{tt('session.rerun')}</button>
      </div>
      <div className="rrp-timeline">
        {visible.length === 0 && <div className="rrp-empty">{tt('viewer.empty')}</div>}
        {visible.map((item, index) => <ItemView key={index} item={item} />)}
      </div>
    </div>
  )
}
