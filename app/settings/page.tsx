"use client";

import { useCallback, useEffect, useState } from "react";
import { Toast, useToast } from "@/components/Toast";
import {
  getExpensePresets,
  addExpensePreset,
  updateExpensePreset,
  deleteExpensePreset,
} from "@/actions/presets";
import { CATEGORIES } from "@/components/OtherExpenseRow";
import type { ExpensePresetItem } from "@/lib/schema";

type Preset = ExpensePresetItem & { id: string };

type PendingPreset = {
  tempId: string;
  label: string;
  category: string;
  amount: number;
  note: string;
};

export default function SettingsPage() {
  const [presets, setPresets] = useState<Preset[]>([]);
  const [pending, setPending] = useState<PendingPreset[]>([]);
  const [loading, setLoading] = useState(true);
  const [savingId, setSavingId] = useState<string | null>(null);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const { toast, showToast, hideToast } = useToast();

  const loadPresets = useCallback(async () => {
    setLoading(true);
    try {
      const items = await getExpensePresets();
      setPresets(items as Preset[]);
    } catch {
      showToast("Failed to load presets.", "error");
    } finally {
      setLoading(false);
    }
  }, [showToast]);

  useEffect(() => {
    loadPresets();
  }, [loadPresets]);

  /* ── Update parent list after a successful save ── */

  const savePreset = async (preset: Preset) => {
    setSavingId(preset.id);
    try {
      await updateExpensePreset(preset.id, {
        label: preset.label.trim() || "Unnamed",
        category: preset.category,
        amount: preset.amount,
        note: preset.note.trim(),
      });
      showToast("Preset saved!", "success");
    } catch {
      showToast("Failed to save preset.", "error");
    } finally {
      setSavingId(null);
    }
  };

  const handleDelete = async (id: string) => {
    setDeletingId(id);
    try {
      await deleteExpensePreset(id);
      setPresets((prev) => prev.filter((p) => p.id !== id));
      showToast("Preset deleted.", "success");
    } catch {
      showToast("Failed to delete preset.", "error");
    } finally {
      setDeletingId(null);
    }
  };

  /* ── Pending (new, unsaved) preset helpers ── */
  const addPending = () => {
    setPending((prev) => [
      ...prev,
      {
        tempId: crypto.randomUUID(),
        label: "",
        category: "Transport",
        amount: 0,
        note: "",
      },
    ]);
  };

  const updatePendingField = (
    tempId: string,
    field: keyof Omit<PendingPreset, "tempId">,
    value: string | number
  ) => {
    setPending((prev) =>
      prev.map((p) => (p.tempId === tempId ? { ...p, [field]: value } : p))
    );
  };

  const discardPending = (tempId: string) => {
    setPending((prev) => prev.filter((p) => p.tempId !== tempId));
  };

  const savePending = async (p: PendingPreset) => {
    setSavingId(p.tempId);
    try {
      const newPreset = await addExpensePreset({
        label: p.label.trim() || "Unnamed",
        category: p.category,
        amount: p.amount,
        note: p.note.trim(),
      });
      setPresets((prev) => [newPreset as Preset, ...prev]);
      setPending((prev) => prev.filter((x) => x.tempId !== p.tempId));
      showToast("Preset added!", "success");
    } catch {
      showToast("Failed to add preset.", "error");
    } finally {
      setSavingId(null);
    }
  };

  return (
    <>
      {toast && (
        <Toast message={toast.message} type={toast.type} onClose={hideToast} />
      )}

      <div className="space-y-6 pb-12">
        {/* Header */}
        <div className="space-y-1">
          <h1 className="text-xl font-bold text-white">Settings</h1>
          <p className="text-sm text-slate-400">
            Manage your reusable expense presets.
          </p>
        </div>

        {/* Presets section */}
        <div className="rounded-2xl border border-slate-800 bg-slate-900 p-4 space-y-4">
          <div className="flex items-start justify-between gap-3">
            <div>
              <h2 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">
                Expense Presets
              </h2>
              <p className="mt-1 text-xs text-slate-500">
                Presets let you quickly add recurring expenses (rent, transport,
                etc.) from the Log page with a single tap.
              </p>
            </div>
            <button
              type="button"
              onClick={addPending}
              className="shrink-0 flex items-center gap-1.5 rounded-xl bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 transition-colors"
            >
              <svg
                className="h-3.5 w-3.5"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 3a1 1 0 011 1v5h5a1 1 0 110 2h-5v5a1 1 0 11-2 0v-5H4a1 1 0 110-2h5V4a1 1 0 011-1z"
                  clipRule="evenodd"
                />
              </svg>
              New Preset
            </button>
          </div>

          {/* Loading state */}
          {loading ? (
            <div className="flex items-center justify-center py-10">
              <svg
                className="h-7 w-7 animate-spin text-brand-500"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            </div>
          ) : (
            <div className="space-y-3">
              {/* Pending (new unsaved) presets */}
              {pending.map((p) => (
                <div
                  key={p.tempId}
                  className="rounded-xl border border-brand-700/60 bg-brand-950/20 p-3 space-y-3"
                >
                  <div className="flex items-center gap-1.5 mb-1">
                    <span className="text-xs font-semibold text-brand-400 uppercase tracking-wide">
                      New preset
                    </span>
                  </div>

                  {/* Row 1: label + category */}
                  <div className="flex flex-col gap-2 sm:flex-row">
                    <input
                      type="text"
                      value={p.label}
                      onChange={(e) =>
                        updatePendingField(p.tempId, "label", e.target.value)
                      }
                      placeholder="Preset name (e.g. Monthly Rent)"
                      className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                    <select
                      value={p.category}
                      onChange={(e) =>
                        updatePendingField(
                          p.tempId,
                          "category",
                          e.target.value
                        )
                      }
                      className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-48"
                    >
                      {CATEGORIES.map((cat) => (
                        <option key={cat} value={cat}>
                          {cat}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Row 2: amount + note */}
                  <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
                    <div className="flex items-center gap-1.5">
                      <span className="text-xs text-slate-400 shrink-0">
                        Rs.
                      </span>
                      <input
                        type="number"
                        min={0}
                        value={p.amount || ""}
                        placeholder="0"
                        onChange={(e) =>
                          updatePendingField(
                            p.tempId,
                            "amount",
                            parseInt(e.target.value) || 0
                          )
                        }
                        className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 no-spinner"
                      />
                    </div>
                    <input
                      type="text"
                      value={p.note}
                      onChange={(e) =>
                        updatePendingField(p.tempId, "note", e.target.value)
                      }
                      placeholder="Optional note"
                      className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
                    />
                  </div>

                  {/* Actions */}
                  <div className="flex gap-2 justify-end pt-1">
                    <button
                      type="button"
                      onClick={() => discardPending(p.tempId)}
                      className="rounded-lg border border-slate-700 bg-slate-800 px-3 py-2 text-xs font-medium text-slate-400 hover:text-white transition-colors"
                    >
                      Discard
                    </button>
                    <button
                      type="button"
                      onClick={() => savePending(p)}
                      disabled={savingId === p.tempId}
                      className="rounded-lg bg-brand-600 px-3 py-2 text-xs font-semibold text-white hover:bg-brand-500 disabled:opacity-60 disabled:cursor-not-allowed transition-colors"
                    >
                      {savingId === p.tempId ? "Saving…" : "Save"}
                    </button>
                  </div>
                </div>
              ))}

              {/* Saved presets */}
              {presets.length === 0 && pending.length === 0 ? (
                <div className="py-8 text-center">
                  <p className="text-sm text-slate-600">
                    No presets yet.
                  </p>
                  <p className="text-xs text-slate-700 mt-1">
                    Click &ldquo;New Preset&rdquo; to create your first one.
                  </p>
                </div>
              ) : (
                presets.map((preset) => (
                  <PresetRow
                    key={preset.id}
                    preset={preset}
                    isSaving={savingId === preset.id}
                    isDeleting={deletingId === preset.id}
                    onSave={savePreset}
                    onDelete={handleDelete}
                  />
                ))
              )}
            </div>
          )}
        </div>
      </div>
    </>
  );
}

/* ──────────────────────────────────────────
   PresetRow — owns local state, saves on blur
────────────────────────────────────────── */
function PresetRow({
  preset,
  isSaving,
  isDeleting,
  onSave,
  onDelete,
}: {
  preset: Preset;
  isSaving: boolean;
  isDeleting: boolean;
  onSave: (preset: Preset) => void;
  onDelete: (id: string) => void;
}) {
  const [local, setLocal] = useState<Preset>(preset);

  // If a save comes back and updates the parent, sync local too
  useEffect(() => {
    setLocal(preset);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [preset.id]);

  const handleBlurSave = () => onSave(local);

  return (
    <div className="rounded-xl border border-slate-700 bg-slate-800/50 p-3 space-y-3">
      {/* Row 1: label + category + actions */}
      <div className="flex flex-col gap-2 sm:flex-row sm:items-center">
        <input
          type="text"
          value={local.label}
          onChange={(e) => setLocal((p) => ({ ...p, label: e.target.value }))}
          onBlur={handleBlurSave}
          placeholder="Preset name"
          className="flex-1 rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
        <select
          value={local.category}
          onChange={(e) => {
            const updated = { ...local, category: e.target.value };
            setLocal(updated);
            // Save immediately — blur doesn't reliably fire after a select change
            onSave(updated);
          }}
          className="rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 sm:w-48"
        >
          {CATEGORIES.map((cat) => (
            <option key={cat} value={cat}>
              {cat}
            </option>
          ))}
        </select>

        {/* Save + Delete buttons */}
        <div className="flex gap-1 shrink-0">
          <button
            type="button"
            onClick={handleBlurSave}
            disabled={isSaving}
            title="Save changes"
            className="rounded-lg border border-slate-600 bg-slate-800 p-2 text-slate-400 hover:border-brand-600 hover:text-brand-400 disabled:opacity-50 transition-colors"
          >
            {isSaving ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
          <button
            type="button"
            onClick={() => onDelete(preset.id)}
            disabled={isDeleting}
            title="Delete preset"
            className="rounded-lg p-2 text-slate-500 hover:bg-red-900/30 hover:text-red-400 disabled:opacity-50 transition-colors"
          >
            {isDeleting ? (
              <svg
                className="h-4 w-4 animate-spin"
                viewBox="0 0 24 24"
                fill="none"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                />
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"
                />
              </svg>
            ) : (
              <svg
                className="h-4 w-4"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M9 2a1 1 0 00-.894.553L7.382 4H4a1 1 0 000 2v10a2 2 0 002 2h8a2 2 0 002-2V6a1 1 0 100-2h-3.382l-.724-1.447A1 1 0 0011 2H9zM7 8a1 1 0 012 0v6a1 1 0 11-2 0V8zm5-1a1 1 0 00-1 1v6a1 1 0 102 0V8a1 1 0 00-1-1z"
                  clipRule="evenodd"
                />
              </svg>
            )}
          </button>
        </div>
      </div>

      {/* Row 2: amount + note */}
      <div className="grid gap-2 sm:grid-cols-[160px_1fr]">
        <div className="flex items-center gap-1.5">
          <span className="text-xs text-slate-400 shrink-0">Rs.</span>
          <input
            type="number"
            min={0}
            value={local.amount || ""}
            placeholder="0"
            onChange={(e) =>
              setLocal((p) => ({
                ...p,
                amount: parseInt(e.target.value) || 0,
              }))
            }
            onBlur={handleBlurSave}
            className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500 no-spinner"
          />
        </div>
        <input
          type="text"
          value={local.note}
          onChange={(e) => setLocal((p) => ({ ...p, note: e.target.value }))}
          onBlur={handleBlurSave}
          placeholder="Optional note"
          className="w-full rounded-lg border border-slate-600 bg-slate-800 px-3 py-2.5 text-sm text-white placeholder-slate-500 focus:border-brand-500 focus:outline-none focus:ring-1 focus:ring-brand-500"
        />
      </div>
    </div>
  );
}
