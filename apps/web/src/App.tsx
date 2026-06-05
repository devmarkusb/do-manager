import { useCallback, useEffect, useMemo, useState } from 'react';
import type { WorkItem, WorkItemSource, WorkItemState } from '@do-manager/core';
import {
  WORK_ITEM_SOURCES,
  createWorkItem,
  fetchAttentionItems,
  fetchItemsByState,
  updateWorkItemState,
} from './api';

type InboxView = 'attention' | 'waiting' | 'done';

const VIEW_META: Record<
  InboxView,
  { label: string; subtitle: string; empty: string; countLabel: string }
> = {
  attention: {
    label: 'Attention',
    subtitle: 'Things that currently require your attention.',
    empty: 'Nothing in this column.',
    countLabel: 'attention item(s)',
  },
  waiting: {
    label: 'Waiting',
    subtitle: 'Threads blocked on external or async work.',
    empty: 'Nothing waiting on others or systems.',
    countLabel: 'waiting item(s)',
  },
  done: {
    label: 'Done',
    subtitle: 'Completed threads — reopen if work resurfaces.',
    empty: 'No completed items yet.',
    countLabel: 'completed item(s)',
  },
};

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
    case 'waiting':
      return [
        { label: 'Resume', state: 'active' },
        { label: 'Needs input', state: 'needs_input' },
        { label: 'Done', state: 'done' },
      ];
    case 'done':
      return [
        { label: 'Reopen', state: 'active' },
        { label: 'Waiting', state: 'waiting' },
        { label: 'Needs input', state: 'needs_input' },
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

function ItemList({
  items,
  emptyMessage,
  onTransition,
}: {
  items: WorkItem[];
  emptyMessage: string;
  onTransition: (id: string, state: WorkItemState) => void;
}) {
  if (items.length === 0) {
    return <p className="empty">{emptyMessage}</p>;
  }

  return (
    <ul className="item-list">
      {items.map((item) => (
        <ItemCard key={item.id} item={item} onTransition={onTransition} />
      ))}
    </ul>
  );
}

async function fetchItemsForView(view: InboxView): Promise<WorkItem[]> {
  if (view === 'attention') return fetchAttentionItems();
  if (view === 'waiting') return fetchItemsByState('waiting');
  return fetchItemsByState('done');
}

export function App() {
  const [view, setView] = useState<InboxView>('attention');
  const [items, setItems] = useState<WorkItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [title, setTitle] = useState('');
  const [source, setSource] = useState<WorkItemSource>('manual');

  const meta = VIEW_META[view];

  const load = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      setItems(await fetchItemsForView(view));
    } catch {
      setError('Could not load items. Is the API running on port 3000?');
    } finally {
      setLoading(false);
    }
  }, [view]);

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
      if (view !== 'attention') {
        setView('attention');
      } else {
        await load();
      }
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
        <p>{meta.subtitle}</p>
      </header>

      <nav className="view-nav" aria-label="Inbox views">
        {(Object.keys(VIEW_META) as InboxView[]).map((key) => (
          <button
            key={key}
            type="button"
            className={view === key ? 'view-tab active' : 'view-tab'}
            aria-current={view === key ? 'page' : undefined}
            onClick={() => setView(key)}
          >
            {VIEW_META[key].label}
          </button>
        ))}
      </nav>

      <div className="toolbar">
        <span>{loading ? 'Loading…' : `${items.length} ${meta.countLabel}`}</span>
        <button className="refresh" type="button" onClick={() => void load()}>
          Refresh
        </button>
      </div>

      {view === 'attention' ? (
        <section className="grid">
          <article className="panel">
            <h2>Needs input</h2>
            <ItemList
              items={grouped.needs_input}
              emptyMessage="Nothing blocking you right now."
              onTransition={handleTransition}
            />
          </article>

          <article className="panel">
            <h2>Active</h2>
            <ItemList
              items={grouped.active}
              emptyMessage="No threads in progress."
              onTransition={handleTransition}
            />
          </article>
        </section>
      ) : (
        <section className="panel panel-single">
          <h2>{meta.label}</h2>
          <ItemList items={items} emptyMessage={meta.empty} onTransition={handleTransition} />
        </section>
      )}

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
