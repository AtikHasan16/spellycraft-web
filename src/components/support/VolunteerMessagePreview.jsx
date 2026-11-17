/**
 * Volunteer message preview (src/components/support/VolunteerMessagePreview.jsx)
 * Renders the editable application body plus the auto-generated signature
 * block. Only the body is editable; the signature always reflects the current
 * form values, so contact details cannot drift.
 */
import { HiArrowPath, HiPencilSquare } from "react-icons/hi2";

export default function VolunteerMessagePreview({
  body,
  signature,
  isCustomized,
  onChange,
  onReset,
  disabled = false,
  error = "",
}) {
  return (
    <section
      className="imlaa-card space-y-3 p-4 sm:p-5"
      aria-label="Live application preview"
    >
      <div className="flex flex-wrap items-start justify-between gap-2 border-b border-plum/10 pb-3">
        <div>
          <h3 className="flex items-center gap-2 text-base font-black text-body-dark">
            <HiPencilSquare className="h-4 w-4 text-plum" aria-hidden="true" />
            Live application preview
          </h3>
          <p className="mt-0.5 text-xs text-muted-label">
            Type inside the message to personalize it before submitting.
          </p>
        </div>
        <span
          className={`rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ${
            isCustomized
              ? "bg-amber-100 text-amber-800"
              : "bg-emerald-100 text-emerald-800"
          }`}
        >
          {isCustomized ? "Customized" : "Auto-synced"}
        </span>
      </div>

      <label className="block text-xs font-bold uppercase tracking-wider text-muted-label">
        Message
        <textarea
          value={body}
          onChange={(event) => onChange(event.target.value)}
          disabled={disabled}
          rows={14}
          maxLength={7600}
          className="imlaa-input mt-2 min-h-56 resize-y font-mono text-sm leading-relaxed"
          aria-label="Editable volunteer application message"
        />
      </label>
      {error && (
        <p role="alert" className="text-xs font-semibold text-rose-700">
          {error}
        </p>
      )}

      <div className="rounded-xl border border-plum/15 bg-plum/5 p-3">
        <div className="mb-1 flex items-center justify-between gap-2">
          <span className="text-[10px] font-bold uppercase tracking-wider text-muted-label">
            Signature (auto-generated)
          </span>
          <span className="text-[10px] text-muted-label">
            Always uses your current details
          </span>
        </div>
        <pre className="whitespace-pre-wrap font-mono text-xs leading-relaxed text-body-dark">
          {signature}
        </pre>
      </div>

      <div className="flex flex-wrap items-center justify-between gap-2">
        <p className="text-[11px] leading-relaxed text-muted-label">
          Once you edit the message, your custom text is preserved while the
          signature continues to follow the form fields.
        </p>
        {isCustomized && (
          <button
            type="button"
            onClick={onReset}
            className="inline-flex min-h-11 items-center gap-1.5 rounded-lg border border-plum/25 bg-white px-3 text-xs font-semibold text-plum transition hover:bg-plum/5"
          >
            <HiArrowPath className="h-3.5 w-3.5" aria-hidden="true" />
            Reset template
          </button>
        )}
      </div>
    </section>
  );
}
