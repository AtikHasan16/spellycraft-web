/**
 * Volunteer application form (src/components/support/VolunteerApplicationForm.jsx)
 * Structured public form + live editable application message. Submits both the
 * structured fields and the final customized message directly to Supabase.
 */
import { useState } from "react";
import { HiCheckCircle, HiPaperAirplane } from "react-icons/hi2";
import {
  VOLUNTEER_TRACKS,
  buildVolunteerSignature,
  buildVolunteerTemplateBody,
  composeVolunteerMessage,
  getVolunteerTrack,
  normalizeGmail,
  validateVolunteerApplication,
} from "../../utils/volunteerApplication";
import { submitVolunteerApplication } from "../../services/volunteerService";
import { showErrorAlert, showSuccessToast } from "../../utils/sweetalert";
import VolunteerMessagePreview from "./VolunteerMessagePreview";

const EMPTY_FORM = {
  fullName: "",
  designation: "",
  gmail: "",
  whatsapp: "",
  country: "",
  track: "software",
  experience: "",
};

const COOLDOWN_KEY = "spellycraft_volunteer_last_ts";
const COOLDOWN_MS = 60_000;

function FieldError({ children }) {
  if (!children) return null;
  return (
    <p role="alert" className="mt-1 text-xs font-semibold text-rose-700">
      {children}
    </p>
  );
}

export default function VolunteerApplicationForm() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [customBody, setCustomBody] = useState(null);
  const [touched, setTouched] = useState({});
  const [submitAttempted, setSubmitAttempted] = useState(false);
  const [honeypot, setHoneypot] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [submitted, setSubmitted] = useState(null);

  const defaultBody = buildVolunteerTemplateBody(form);
  const body = customBody ?? defaultBody;
  const signature = buildVolunteerSignature(form);
  const errors = validateVolunteerApplication({ ...form, messageBody: body });

  const visibleError = (field) =>
    submitAttempted || touched[field] ? errors[field] : "";

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
  };

  const markTouched = (field) => {
    setTouched((current) => ({ ...current, [field]: true }));
  };

  const inputClass = (field) =>
    `imlaa-input mt-2 min-h-11 ${visibleError(field) ? "border-rose-400" : ""}`;

  const resetForm = () => {
    setForm(EMPTY_FORM);
    setCustomBody(null);
    setTouched({});
    setSubmitAttempted(false);
    setHoneypot("");
    setSubmitted(null);
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    setSubmitAttempted(true);

    // Honeypot: real users never fill this hidden field. Pretend success so
    // bots do not learn that they were blocked.
    if (honeypot.trim()) {
      setSubmitted({ name: form.fullName, gmail: form.gmail, track: form.track });
      return;
    }

    const firstError = Object.keys(errors)[0];
    if (firstError) {
      document.querySelector(`[name="${firstError}"]`)?.focus();
      return;
    }

    try {
      const lastSubmit = Number(localStorage.getItem(COOLDOWN_KEY) || 0);
      if (lastSubmit && Date.now() - lastSubmit < COOLDOWN_MS) {
        const waitSeconds = Math.ceil(
          (COOLDOWN_MS - (Date.now() - lastSubmit)) / 1000,
        );
        await showErrorAlert(
          "Anti-Spam Cooldown",
          `Please wait ${waitSeconds} seconds before submitting another application.`,
        );
        return;
      }
    } catch {
      // localStorage can be unavailable in hardened browsers; the database
      // cooldown still protects the endpoint.
    }

    setSubmitting(true);
    try {
      const message = composeVolunteerMessage(body, form);
      await submitVolunteerApplication({ ...form, message });
      try {
        localStorage.setItem(COOLDOWN_KEY, Date.now().toString());
      } catch {
        // Non-blocking.
      }
      setSubmitted({
        name: form.fullName.trim(),
        gmail: normalizeGmail(form.gmail),
        track: form.track,
      });
      showSuccessToast(
        "Application submitted",
        "Thank you for offering your time to SpellyCraft.",
      );
    } catch (submitError) {
      console.error("Volunteer application failed:", submitError);
      showErrorAlert(
        "Application not submitted",
        submitError.message || "Please try again in a moment.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (submitted) {
    const track = getVolunteerTrack(submitted.track);
    return (
      <section className="imlaa-card space-y-3 p-6 text-center sm:p-8">
        <HiCheckCircle className="mx-auto h-14 w-14 text-emerald-600" aria-hidden="true" />
        <h3 className="text-xl font-black text-body-dark">Application received</h3>
        <p className="mx-auto max-w-xl text-sm leading-relaxed text-muted-label">
          Thank you{submitted.name ? `, ${submitted.name}` : ""}. Your volunteer
          application for the{" "}
          <strong className="text-body-dark">
            {track?.label || "SpellyCraft"}
          </strong>{" "}
          track was saved. Every applicant receives a prompt response
          {submitted.gmail ? (
            <>
              {" "}
              at <strong className="text-body-dark">{submitted.gmail}</strong>
            </>
          ) : null}
          .
        </p>
        <button
          type="button"
          onClick={resetForm}
          className="imlaa-btn-secondary min-h-11 px-5 text-sm font-semibold"
        >
          Submit another application
        </button>
      </section>
    );
  }

  return (
    <div className="grid gap-5 sm:gap-6 lg:grid-cols-[minmax(0,1.05fr)_minmax(0,0.95fr)] lg:items-start xl:gap-8">
      <form onSubmit={handleSubmit} noValidate className="imlaa-card space-y-4 p-4 sm:p-6 lg:p-7">
        {/* Invisible anti-bot honeypot */}
        <input
          type="text"
          name="website_shield"
          value={honeypot}
          onChange={(event) => setHoneypot(event.target.value)}
          tabIndex={-1}
          autoComplete="off"
          aria-hidden="true"
          style={{ display: "none", position: "absolute", left: "-9999px" }}
        />

        <div className="grid gap-4 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-body-dark">
            Full name <span className="text-rose-500">*</span>
            <input
              name="fullName"
              value={form.fullName}
              onChange={updateField}
              onBlur={() => markTouched("fullName")}
              autoComplete="name"
              maxLength={120}
              aria-invalid={Boolean(visibleError("fullName"))}
              className={inputClass("fullName")}
              placeholder="e.g. Amina Rahman"
            />
            <FieldError>{visibleError("fullName")}</FieldError>
          </label>

          <label className="block text-sm font-semibold text-body-dark">
            Current designation / role <span className="text-rose-500">*</span>
            <input
              name="designation"
              value={form.designation}
              onChange={updateField}
              onBlur={() => markTouched("designation")}
              maxLength={160}
              aria-invalid={Boolean(visibleError("designation"))}
              className={inputClass("designation")}
              placeholder="e.g. Student, English Educator"
            />
            <FieldError>{visibleError("designation")}</FieldError>
          </label>

          <label className="block text-sm font-semibold text-body-dark">
            Gmail address <span className="text-rose-500">*</span>
            <input
              type="email"
              name="gmail"
              value={form.gmail}
              onChange={updateField}
              onBlur={() => markTouched("gmail")}
              autoComplete="email"
              inputMode="email"
              maxLength={254}
              aria-invalid={Boolean(visibleError("gmail"))}
              className={inputClass("gmail")}
              placeholder="yourname@gmail.com"
            />
            <FieldError>{visibleError("gmail")}</FieldError>
            <span className="mt-1 block text-[11px] font-normal text-muted-label">
              Only addresses ending in @gmail.com are accepted.
            </span>
          </label>

          <label className="block text-sm font-semibold text-body-dark">
            WhatsApp number <span className="text-rose-500">*</span>
            <input
              type="tel"
              name="whatsapp"
              value={form.whatsapp}
              onChange={updateField}
              onBlur={() => markTouched("whatsapp")}
              autoComplete="tel"
              inputMode="tel"
              maxLength={24}
              aria-invalid={Boolean(visibleError("whatsapp"))}
              className={inputClass("whatsapp")}
              placeholder="+8801XXXXXXXXX"
            />
            <FieldError>{visibleError("whatsapp")}</FieldError>
          </label>
        </div>

        <label className="block text-sm font-semibold text-body-dark">
          Country of origin <span className="text-rose-500">*</span>
          <input
            name="country"
            value={form.country}
            onChange={updateField}
            onBlur={() => markTouched("country")}
            autoComplete="country-name"
            maxLength={80}
            aria-invalid={Boolean(visibleError("country"))}
            className={inputClass("country")}
            placeholder="e.g. Bangladesh"
          />
          <FieldError>{visibleError("country")}</FieldError>
        </label>

        <fieldset>
          <legend className="text-sm font-semibold text-body-dark">
            Area of interest <span className="text-rose-500">*</span>
          </legend>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            {VOLUNTEER_TRACKS.map((track) => {
              const selected = form.track === track.value;
              return (
                <label
                  key={track.value}
                  className={`cursor-pointer rounded-xl border p-3 transition focus-within:ring-2 focus-within:ring-plum/30 ${
                    selected
                      ? "border-plum bg-plum/5"
                      : "border-plum/20 bg-white hover:border-plum/40"
                  }`}
                >
                  <input
                    type="radio"
                    name="track"
                    value={track.value}
                    checked={selected}
                    onChange={() => {
                      setForm((current) => ({ ...current, track: track.value }));
                      markTouched("track");
                    }}
                    className="sr-only"
                  />
                  <span className="block text-sm font-bold text-body-dark">
                    {track.label}
                  </span>
                  <span className="mt-0.5 block text-xs text-muted-label">
                    {track.description}
                  </span>
                </label>
              );
            })}
          </div>
          <FieldError>{visibleError("track")}</FieldError>
        </fieldset>

        <label className="block text-sm font-semibold text-body-dark">
          Previous experience &amp; relevant skills{" "}
          <span className="text-rose-500">*</span>
          <textarea
            name="experience"
            value={form.experience}
            onChange={updateField}
            onBlur={() => markTouched("experience")}
            rows={4}
            maxLength={4000}
            aria-invalid={Boolean(visibleError("experience"))}
            className={`imlaa-input mt-2 min-h-28 resize-y ${
              visibleError("experience") ? "border-rose-400" : ""
            }`}
            placeholder="Tell us about your coding stack, teaching background, editing experience, or curriculum work."
          />
          <FieldError>{visibleError("experience")}</FieldError>
        </label>

        <button
          type="submit"
          disabled={submitting}
          className="imlaa-btn-primary min-h-11 w-full px-5 text-base font-bold disabled:opacity-50"
        >
          <span>{submitting ? "Submitting…" : "Submit application"}</span>
          <HiPaperAirplane
            className={`ml-2 h-5 w-5 rotate-45 ${submitting ? "animate-pulse" : ""}`}
            aria-hidden="true"
          />
        </button>
        <p className="text-center text-[11px] leading-relaxed text-muted-label">
          Your details are stored securely and used only to respond to this
          application. Basic anti-spam protection is applied.
        </p>
      </form>

      <div className="lg:sticky lg:top-24">
        <VolunteerMessagePreview
          body={body}
          signature={signature}
          isCustomized={customBody !== null}
          onChange={setCustomBody}
          onReset={() => setCustomBody(null)}
          disabled={submitting}
          error={visibleError("messageBody")}
        />
      </div>
    </div>
  );
}
