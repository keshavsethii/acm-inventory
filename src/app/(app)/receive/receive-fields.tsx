"use client";

import { useState } from "react";
import { inputClass, labelClass } from "../../ui";

type Props = {
  events: { id: string; label: string }[];
  items: { id: string; name: string; hasSerial: boolean }[];
};

const heading = "text-xs font-semibold uppercase tracking-[0.15em] text-primary";

export default function ReceiveFields({ events, items }: Props) {
  const [itemId, setItemId] = useState("");
  const [serialText, setSerialText] = useState("");
  const item = items.find((i) => i.id === itemId);
  const serialCount = serialText.split(/\r?\n/).filter((s) => s.trim()).length;

  return (
    <>
      <p className={heading}>What arrived</p>
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
          <select name="itemId" required value={itemId} onChange={(e) => setItemId(e.target.value)} className={inputClass}>
            <option value="" disabled>Choose an item</option>
            {items.map((i) => <option key={i.id} value={i.id}>{i.name}{i.hasSerial ? " (serial numbers)" : ""}</option>)}
          </select>
        </div>
      </div>

      {item?.hasSerial && (
        <div>
          <label className={labelClass}>
            Serial numbers, one per line <span className="ml-1 rounded-full bg-primary/15 px-2 py-0.5 text-xs font-semibold text-primary">{serialCount}</span>
          </label>
          <textarea name="serials" rows={6} value={serialText} onChange={(e) => setSerialText(e.target.value)} placeholder={"KB-001\nKB-002\nKB-003"} className={`${inputClass} font-mono`} />
        </div>
      )}
      {item && !item.hasSerial && (
        <div className="max-w-xs">
          <label className={labelClass}>Quantity</label>
          <input name="quantity" type="number" min={1} max={100000} step={1} required className={inputClass} />
        </div>
      )}

      <p className={`${heading} pt-2`}>Details</p>
      <div className="grid gap-4 sm:grid-cols-2">
        <div>
          <label className={labelClass}>Received from</label>
          <input name="receivedFrom" required maxLength={120} placeholder="Sponsor, college, vendor..." className={inputClass} />
        </div>
        <div>
          <label className={labelClass}>Remarks (optional)</label>
          <input name="remarks" maxLength={500} className={inputClass} />
        </div>
      </div>
    </>
  );
}
