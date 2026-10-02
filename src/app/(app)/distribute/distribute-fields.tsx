"use client";

import { useState } from "react";
import { inputClass, labelClass } from "../../ui";

type Props = {
  events: { id: string; label: string }[];
  items: { id: string; name: string; hasSerial: boolean; stock: number }[];
  types: { id: string; name: string }[];
  serialsByItem: Record<string, string[]>;
};

export default function DistributeFields({ events, items, types, serialsByItem }: Props) {
  const [itemId, setItemId] = useState("");
  const [filter, setFilter] = useState("");
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const item = items.find((i) => i.id === itemId);
  const available = serialsByItem[itemId] ?? [];

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
      <div className="grid gap-3 sm:grid-cols-2">
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
            {items.map((i) => (
              <option key={i.id} value={i.id} disabled={i.stock <= 0}>
                {i.name} ({i.stock} in stock)
              </option>
            ))}
          </select>
        </div>
      </div>

      {item?.hasSerial && (
        <div>
          <label className={labelClass}>Serial numbers to give ({selected.size} selected, {available.length} in stock)</label>
          <input
            type="search"
            placeholder="Type to filter"
            value={filter}
            onChange={(e) => setFilter(e.target.value)}
            className={`${inputClass} mb-2`}
          />
          <div className="max-h-48 space-y-1 overflow-y-auto rounded-xl border border-line p-2">
            {available.map((s) => (
              <label
                key={s}
                hidden={!s.toLowerCase().includes(filter.trim().toLowerCase())}
                className="flex items-center gap-2 font-mono text-sm"
              >
                <input type="checkbox" name="serials" value={s} checked={selected.has(s)} onChange={() => toggle(s)} />
                {s}
              </label>
            ))}
          </div>
        </div>
      )}
      {item && !item.hasSerial && (
        <div>
          <label className={labelClass}>Quantity (max {item.stock})</label>
          <input name="quantity" type="number" min={1} max={item.stock} step={1} required className={inputClass} />
        </div>
      )}

      <div className="grid gap-3 sm:grid-cols-3">
        <div>
          <label className={labelClass}>Recipient type{item?.hasSerial ? "" : " (optional)"}</label>
          <select name="recipientTypeId" required={item?.hasSerial} defaultValue="" className={inputClass}>
            <option value="">None</option>
            {types.map((t) => <option key={t.id} value={t.id}>{t.name}</option>)}
          </select>
        </div>
        <div>
          <label className={labelClass}>Recipient name{item?.hasSerial ? "" : " (optional)"}</label>
          <input name="recipientName" required={item?.hasSerial} maxLength={120} className={inputClass} />
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
