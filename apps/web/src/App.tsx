import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkItem, WorkItemSource, WorkItemState } from '@do-manager/core';
import { WORK_ITEM_SOURCES, createWorkItem, fetchAttentionItems, updateWorkItemState } from './api';

function formatRelativeTime(iso: string): string {
  const deltaMs = Date.now() - new Date(iso).getTime();
  const minutes = Math.round(deltaMs / 60_000);
  if (minutes < 1) return 'just now';
  if (minutes < 60) return `${minutes}m ago`;
  const hours = Math.round(minutes / 60);
  if (hours < 24) return `${hours}h ago`;
  const days = Math.round(hours / 24);
  return `${days}d ago`;
}

function nextActions(state: WorkItemState): { label: string; state: WorkItemState }[] {
  switch (state) {
    case 'active':
      return [
        { label: 'Waiting', state: 'waiting' },
        { label: 'Needs input', state: 'needs_input' },
        { label: 'Done', state: 'done' },
      ];
    case 'needs_input':
      return [
        { label: 'Resume', state: 'active' },
        { label: 'Waiting', state: 'waiting' },
        { label: 'Done', state: 'done' },
      ];
    default:
      return [];
  }
}

function ItemCard({
  item,
  onTransition,
}: {
  item: WorkItem;
  onTransition: (id: string, state: WorkItemState) => void;
}) {
  return (
    <li className="item-card">
      <header>
        <h3>{item.title}</h3>
        <span className="badge">{item.source}</span>
      </header>
      <p className="meta">Last touched {formatRelativeTime(item.lastTouched)}</p>
      {item.link ? (
        <p className="meta">
          <a href={item.link} target="_blank" rel="noreferrer">
            Open link
          </a>
        </p>
      ) : null}
      <div className="actions">
        {nextActions(item.state).map((action) => (
          <button
            key={action.state}
            type="button"
            onClick={() => onTransition(item.id, action.state)}
          >
            {action.label}
          </button>
        ))}
      </div>
    </li>
  );
}

export function App() {
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<WorkItemSource>('manual');

  const load = useCallback(async () => {
    setError(null);
    try {
      setItems(await fetchAttentionItems());
    } catch {
      setError('Could not load items. Is the API running on port 3000?');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    void load();
  }, [load]);

  const grouped = useMemo(() => {
    return {
      needs_input: items.filter((item) => item.state === 'needs_input'),
      active: items.filter((item) => item.state === 'active'),
    };
  }, [items]);

  async function handleCreate(event: React.FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;

    setError(null);
    try {
      await createWorkItem({ title: title.trim(), source, state: 'active' });
      setTitle('');
      await load();
    } catch {
      setError('Failed to create item.');
    }
  }

  async function handleTransition(id: string, state: WorkItemState) {
    setError(null);
    try {
      await updateWorkItemState(id, state);
      await load();
    } catch {
      setError('Failed to update item state.');
    }
  }

  return (
    <main className="app">
      <header className="header">
        <h1>do-manager</h1>
        <p>Things that currently require your attention.</p>
      </header>

      <div className="toolbar">
        <span>{loading ? 'Loading…' : `${items.length} attention item(s)`}</span>
        <button className="refresh" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      <section className="grid">
        <article className="panel">
          <h2>Needs input</h2>
          {grouped.needs_input.length === 0 ? (
            <p className="empty">Nothing blocking you right now.</p>
          ) : (
            <ul className="item-list">
              {grouped.needs_input.map((item) => (
                <ItemCard key={item.id} item={item} onTransition={handleTransition} />
              ))}
            </ul>
          )}
        </article>

        <article className="panel">
          <h2>Active</h2>
          {grouped.active.length === 0 ? (
            <p className="empty">No threads in progress.</p>
          ) : (
            <ul className="item-list">
              {grouped.active.map((item) => (
                <ItemCard key={item.id} item={item} onTransition={handleTransition} />
              ))}
            </ul>
          )}
        </article>
      </section>

      <form className="create-form" onSubmit={(event) => void handleCreate(event)}>
        <h2>Capture work thread</h2>
        <div className="form-row">
          <input
            value={title}
            onChange={(event) => setTitle(event.target.value)}
            placeholder="Reading PR #123"
            aria-label="Title"
          />
          <select
            value={source}
            onChange={(event) => setSource(event.target.value as WorkItemSource)}
            aria-label="Source"
          >
            {WORK_ITEM_SOURCES.map((value) => (
              <option key={value} value={value}>
                {value}
              </option>
            ))}
          </select>
          <button type="submit">Add</button>
        </div>
      </form>

      {error ? <p className="error">{error}</p> : null}
    </main>
  );
}
