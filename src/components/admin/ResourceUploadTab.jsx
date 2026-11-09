import { useState } from "react";
import { HiArrowTopRightOnSquare, HiCheckCircle } from "react-icons/hi2";
import { RESOURCE_CATEGORIES, createResource } from "../../services/resourceService";
import { isGoogleDriveLink } from "../../utils/googleDriveLinks";
import { showErrorAlert, showSuccessToast } from "../../utils/sweetalert";

const EMPTY_FORM = {
  title: "",
  category: "Spelling",
  shortDescription: "",
  driveUrl: "",
  visibility: "public",
};

export default function ResourceUploadTab() {
  const [form, setForm] = useState(EMPTY_FORM);
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  const updateField = (event) => {
    const { name, value } = event.target;
    setForm((current) => ({ ...current, [name]: value }));
    setError("");
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    if (saving) return;
    setSaving(true);
    setError("");

    try {
      await createResource({
        ...form,
        shortDescription: form.shortDescription,
        driveUrl: form.driveUrl,
      });
      setForm(EMPTY_FORM);
      showSuccessToast("Resource Added", "The resource listing is now available.");
    } catch (submitError) {
      console.error("Failed to create resource listing:", submitError);
      setError(
        submitError.message || "The resource could not be saved. Please try again.",
      );
      showErrorAlert(
        "Resource Not Added",
        submitError.message || "The resource could not be saved. Please try again.",
      );
    } finally {
      setSaving(false);
    }
  };

  const validDriveLink = !form.driveUrl.trim() || isGoogleDriveLink(form.driveUrl);

  return (
    <section className="space-y-6" aria-label="Admin resource upload">
      <div className="imlaa-card border border-plum/20 bg-plum/5 p-5 sm:p-6">
        <div className="flex items-start gap-3">
          <HiCheckCircle className="mt-0.5 h-6 w-6 shrink-0 text-plum" aria-hidden="true" />
          <div>
            <h3 className="text-lg font-bold text-body-dark">Moderator guide: share a Drive resource</h3>
            <ol className="mt-3 list-decimal space-y-2 pl-5 text-sm leading-relaxed text-muted-label">
              <li>Upload the PDF or document to the SpellyCraft-owned Google Drive account.</li>
              <li>
                In Drive, select <strong>Share</strong>, change General access to{" "}
                <strong>Anyone with the link</strong>, and keep the role as{" "}
                <strong>Viewer</strong> for public resources.
              </li>
              <li>Copy the link, then test it in a private/incognito browser window before publishing.</li>
              <li>
                Choose <strong>Private</strong> when the listing should appear only after SpellyCraft sign-in.
                This gates the listing, not the Drive file: anyone-with-link files can still be opened or forwarded
                outside SpellyCraft. To restrict the file itself, set Drive access to Restricted and share it with
                each intended Google account.
              </li>
            </ol>
            <p className="mt-3 text-xs text-muted-label">
              This form stores a listing and its link only. Files stay in Google Drive; deleting a listing does not remove its Drive file.
            </p>
            <a
              href="https://support.google.com/drive/answer/2494822?hl=en"
              target="_blank"
              rel="noopener noreferrer"
              className="mt-3 inline-flex min-h-11 items-center gap-1 text-sm font-semibold text-plum underline"
            >
              Google Drive sharing instructions
              <HiArrowTopRightOnSquare className="h-4 w-4" aria-hidden="true" />
            </a>
          </div>
        </div>
      </div>

      <form onSubmit={handleSubmit} className="imlaa-card space-y-5 p-5 sm:p-7">
        <div>
          <h3 className="text-xl font-bold text-body-dark">Add a resource listing</h3>
          <p className="mt-1 text-sm text-muted-label">
            Add the resource metadata to the appropriate Supabase collection.
          </p>
        </div>

        <label className="block text-sm font-semibold text-body-dark">
          Resource title
          <input
            name="title"
            value={form.title}
            onChange={updateField}
            maxLength={140}
            required
            className="imlaa-input mt-2 min-h-11"
            placeholder="e.g. Academic spelling practice set"
          />
        </label>

        <div className="grid gap-5 sm:grid-cols-2">
          <label className="block text-sm font-semibold text-body-dark">
            Category
            <select
              name="category"
              value={form.category}
              onChange={updateField}
              required
              className="imlaa-input mt-2 min-h-11"
            >
              {RESOURCE_CATEGORIES.map((category) => (
                <option key={category} value={category}>
                  {category}
                </option>
              ))}
            </select>
          </label>
          <label className="block text-sm font-semibold text-body-dark">
            Collection visibility
            <select
              name="visibility"
              value={form.visibility}
              onChange={updateField}
              className="imlaa-input mt-2 min-h-11"
            >
              <option value="public">Public — searchable without sign-in</option>
              <option value="private">Private — sign-in required</option>
            </select>
          </label>
        </div>

        <label className="block text-sm font-semibold text-body-dark">
          Short description
          <textarea
            name="shortDescription"
            value={form.shortDescription}
            onChange={updateField}
            maxLength={600}
            rows={4}
            required
            className="imlaa-input mt-2 min-h-28 resize-y"
            placeholder="Briefly explain what learners will practise or find in this material."
          />
          <span className="mt-1 block text-right text-xs font-normal text-muted-label">
            {form.shortDescription.length}/600
          </span>
        </label>

        <label className="block text-sm font-semibold text-body-dark">
          Google Drive sharing link
          <input
            name="driveUrl"
            type="url"
            value={form.driveUrl}
            onChange={updateField}
            required
            aria-invalid={!validDriveLink}
            aria-describedby="resource-drive-link-help"
            className="imlaa-input mt-2 min-h-11"
            placeholder="https://drive.google.com/file/d/…/view"
          />
          <span
            id="resource-drive-link-help"
            className={`mt-1 block text-xs font-normal ${
              validDriveLink ? "text-muted-label" : "text-rose-700"
            }`}
          >
            Use an HTTPS link from drive.google.com or docs.google.com. Confirm its access permissions before publishing.
          </span>
        </label>

        {error && (
          <p role="alert" className="rounded-lg border border-rose-200 bg-rose-50 p-3 text-sm text-rose-800">
            {error}
          </p>
        )}

        <button
          type="submit"
          disabled={saving || !validDriveLink}
          className="imlaa-btn-primary min-h-12 px-6 font-bold disabled:cursor-not-allowed disabled:opacity-50"
        >
          {saving ? "Saving resource…" : "Add resource"}
        </button>
      </form>
    </section>
  );
}
