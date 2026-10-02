"use client";

import { useState } from "react";
import { inputClass, labelClass } from "../../ui";

type Props = {
  events: { id: string; label: string }[];
  items: { id: string; name: string; hasSerial: boolean; stock: number }[];
  types: { id: string; name: string }[];
  serialsByItem: Record<string, string[]>;
};

const heading = "text-xs font-semibold uppercase tracking-[0.15em] text-primary";
const pillBox =
  "inline-flex cursor-pointer rounded-full border border-line bg-surface-2 px-4 py-1.5 text-sm font-medium transition peer-checked:border-primary peer-checked:bg-primary/15 peer-checked:text-primary peer-focus-visible:ring-2 peer-focus-visible:ring-primary/40";

function TypePill(props: { value: string; label: string; checked?: boolean; required?: boolean }) {
  return (
    <label>
      <input type="radio" name="recipientTypeId" value={props.value} defaultChecked={props.checked} required={props.required} className="peer sr-only" />
      <span className={pillBox}>{props.label}</span>
    </label>
  );
}

export default function DistributeFields({ events, items, types, serialsByItem }: Props) {
  const [itemId, setItemId] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const item = items.find((i) => i.id === itemId);
  const available = serialsByItem[itemId] ?? [];
  const needsRecipient = Boolean(item?.hasSerial);

  function toggle(serial: string) {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(serial)) next.delete(serial);
      else next.add(serial);
      return next;
    });
  }

  return (
    <>
      <p className={heading}>What is going out</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Event</label>
          <select name="eventId" required defaultValue="" className={inputClass}>
            <option value="" disabled>Choose an event</option>
            {events.map((e) => <option key={e.id} value={e.id}>{e.label}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Item</label>
          <select
            name="itemId"
            required
            value={itemId}
            onChange={(e) => { setItemId(e.target.value); setSelected(new Set()); setFilter(""); }}
            className={inputClass}
          >
            <option value="" disabled>Choose an item</option>
            {items.map((i) => <option key={i.id} value={i.id} disabled={i.stock <= 0}>{i.name} ({i.stock} left)</option>)}
          </select>
        </div>
      </div>

      {item?.hasSerial && (
        <div className="space-y-3">
          <div className="flex items-center justify-between gap-3">
            <label className={`${labelClass} mb-0`}>
              Pick serial numbers <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{selected.size} selected</span>
            </label>
            <span className="text-xs text-muted">{available.length} in stock</span>
          </div>
          {available.length > 8 && (
            <input type="search" placeholder="Filter serial numbers" value={filter} onChange={(e) => setFilter(e.target.value)} className={inputClass} />
          )}
          <div className="flex max-h-56 flex-wrap gap-2 overflow-y-auto rounded-xl border border-line p-3">
            {available.map((s) => (
              <label key={s} hidden={!s.toLowerCase().includes(filter.trim().toLowerCase())}>
                <input type="checkbox" name="serials" value={s} checked={selected.has(s)} onChange={() => toggle(s)} className="peer sr-only" />
                <span className={`${pillBox} rounded-lg px-2.5 py-1 font-mono text-xs`}>{s}</span>
              </label>
            ))}
          </div>
        </div>
      )}
      {item && !item.hasSerial && (
        <div className="max-w-xs">
          <label className={labelClass}>Quantity <span className="text-muted">(up to {item.stock})</span></label>
          <input name="quantity" type="number" min={1} max={item.stock} step={1} required className={inputClass} />
        </div>
      )}

      <p className={`${heading} pt-2`}>Who gets it{needsRecipient ? "" : " (optional)"}</p>
      <div role="radiogroup" aria-label="Recipient type" className="flex flex-wrap gap-2">
        {!needsRecipient && <TypePill value="" label="No recipient" checked />}
        {types.map((t) => <TypePill key={t.id} value={t.id} label={t.name} required={needsRecipient} />)}
      </div>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Name</label>
          <input name="recipientName" required={needsRecipient} maxLength={120} className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Roll number (optional)</label>
          <input name="rollNumber" maxLength={40} className={inputClass} />
        </div>
      </div>
      <div>
        <label className={labelClass}>Remarks (optional)</label>
        <input name="remarks" maxLength={500} className={inputClass} />
      </div>
    </>
  );
}
