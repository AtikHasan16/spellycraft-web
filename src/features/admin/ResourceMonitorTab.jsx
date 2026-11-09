import { useEffect, useRef, useState } from "react";
import {
  HiChevronLeft,
  HiChevronRight,
  HiInformationCircle,
  HiTrash,
} from "react-icons/hi2";
import {
  deleteResource,
  listResources,
} from "../../services/resourceService";
import {
  showConfirmModal,
  showErrorAlert,
  showSuccessToast,
} from "../../utils/sweetalert";

const PAGE_SIZE = 20;

export default function ResourceMonitorTab() {
  const [visibility, setVisibility] = useState("public");
  const [resources, setResources] = useState([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [refresh, setRefresh] = useState(0);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [selectedResource, setSelectedResource] = useState(null);
  const dialogRef = useRef(null);

  useEffect(() => {
    let active = true;
    setLoading(true);
    setError("");

    listResources({ visibility, page, pageSize: PAGE_SIZE })
      .then(({ data, count }) => {
        if (!active) return;
        setResources(data);
        setTotal(count);
      })
      .catch((requestError) => {
        if (!active) return;
        console.error(`Failed to load ${visibility} resource monitor:`, requestError);
        setError("Resources could not be loaded. Please try again.");
      })
      .finally(() => {
        if (active) setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [visibility, page, refresh]);

  useEffect(() => {
    if (selectedResource && !dialogRef.current?.open) {
      dialogRef.current?.showModal();
    } else if (!selectedResource && dialogRef.current?.open) {
      dialogRef.current.close();
    }
  }, [selectedResource]);

  const pageCount = Math.max(1, Math.ceil(total / PAGE_SIZE));

  const handleDelete = async (resource) => {
    const result = await showConfirmModal({
      title: `Delete "${resource.title}"?`,
      text: "This removes the resource listing from SpellyCraft. The file in Google Drive will not be deleted.",
      confirmButtonText: "Delete listing",
      cancelButtonText: "Cancel",
      isDanger: true,
      icon: "warning",
    });

    if (!result.isConfirmed) return;

    try {
      await deleteResource({ visibility, id: resource.id });
      showSuccessToast("Resource Removed", "The SpellyCraft listing was deleted.");
      setSelectedResource(null);
      if (resources.length === 1 && page > 1) setPage((current) => current - 1);
      else setRefresh((current) => current + 1);
    } catch (deleteError) {
      console.error("Failed to delete resource listing:", deleteError);
      showErrorAlert(
        "Delete Failed",
        deleteError.message || "The resource listing could not be deleted.",
      );
    }
  };

  return (
    <section className="imlaa-card space-y-5 p-5 sm:p-7" aria-label="Resource monitor">
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h3 className="text-xl font-bold text-body-dark">Resource Listings</h3>
          <p className="mt-1 text-sm text-muted-label">
            Inspect or remove resource metadata. Drive files remain in their owners’ accounts.
          </p>
        </div>
        <div className="flex flex-wrap gap-2" aria-label="Resource visibility filter">
          {["public", "private"].map((item) => (
            <button
              key={item}
              type="button"
              onClick={() => {
                setVisibility(item);
                setPage(1);
                setSelectedResource(null);
              }}
              aria-pressed={visibility === item}
              className={`min-h-11 rounded-xl border px-4 py-2 text-sm font-bold capitalize transition ${
                visibility === item
                  ? "border-plum bg-plum text-white"
                  : "border-plum/20 text-body-dark hover:bg-plum/5"
              }`}
            >
              {item} resources
            </button>
          ))}
        </div>
      </div>

      {error && (
        <p className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800" role="alert">
          {error}
        </p>
      )}

      <div className="overflow-x-auto">
        <table className="w-full min-w-2xl text-left text-sm">
          <thead>
            <tr className="border-b border-plum/20 text-xs font-bold uppercase tracking-wide text-muted-label">
              <th className="px-3 py-3">Title</th>
              <th className="px-3 py-3">Category</th>
              <th className="px-3 py-3">Added</th>
              <th className="px-3 py-3 text-right">Actions</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-plum/10">
            {resources.map((resource) => (
              <tr key={resource.id} className="hover:bg-plum/5">
                <td className="px-3 py-3 font-semibold text-body-dark">
                  {resource.title}
                </td>
                <td className="px-3 py-3 text-muted-label">{resource.category}</td>
                <td className="px-3 py-3 text-muted-label">
                  {new Date(resource.created_at).toLocaleDateString()}
                </td>
                <td className="px-3 py-3">
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setSelectedResource(resource)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-plum/20 text-plum hover:bg-plum/5"
                      aria-label={`View details for ${resource.title}`}
                    >
                      <HiInformationCircle className="h-5 w-5" aria-hidden="true" />
                    </button>
                    <button
                      type="button"
                      onClick={() => handleDelete(resource)}
                      className="inline-flex min-h-11 min-w-11 items-center justify-center rounded-lg border border-rose-200 text-rose-700 hover:bg-rose-50"
                      aria-label={`Delete ${resource.title}`}
                    >
                      <HiTrash className="h-5 w-5" aria-hidden="true" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
            {!loading && resources.length === 0 && (
              <tr>
                <td colSpan="4" className="px-3 py-10 text-center text-muted-label">
                  No {visibility} resources have been added yet.
                </td>
              </tr>
            )}
            {loading && (
              <tr>
                <td colSpan="4" className="px-3 py-10 text-center text-muted-label" role="status">
                  Loading resources…
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      {total > PAGE_SIZE && (
        <nav className="flex items-center justify-center gap-3" aria-label="Monitor pages">
          <button
            type="button"
            onClick={() => setPage((current) => Math.max(1, current - 1))}
            disabled={page === 1 || loading}
            className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:opacity-50"
          >
            <HiChevronLeft className="h-4 w-4" aria-hidden="true" />
            Previous
          </button>
          <span className="text-sm font-semibold text-body-dark">
            Page {page} of {pageCount}
          </span>
          <button
            type="button"
            onClick={() => setPage((current) => Math.min(pageCount, current + 1))}
            disabled={page === pageCount || loading}
            className="imlaa-btn-secondary inline-flex min-h-11 items-center gap-1 px-4 disabled:opacity-50"
          >
            Next
            <HiChevronRight className="h-4 w-4" aria-hidden="true" />
          </button>
        </nav>
      )}

      <dialog
        ref={dialogRef}
        aria-labelledby="resource-details-title"
        onClose={() => setSelectedResource(null)}
        className="m-auto w-[min(90vw,38rem)] rounded-2xl border border-plum/20 bg-white p-0 text-body-dark shadow-2xl backdrop:bg-slate-950/50"
      >
        {selectedResource && (
          <div className="space-y-4 p-6">
            <div className="flex items-start justify-between gap-4">
              <div>
                <p className="text-xs font-bold uppercase tracking-[0.14em] text-plum">
                  {visibility} resource · {selectedResource.category}
                </p>
                <h2 id="resource-details-title" className="mt-2 text-2xl font-black">
                  {selectedResource.title}
                </h2>
              </div>
              <button
                type="button"
                onClick={() => setSelectedResource(null)}
                className="min-h-11 rounded-lg border border-plum/20 px-3 text-sm font-semibold"
              >
                Close
              </button>
            </div>
            <p className="whitespace-pre-line leading-relaxed text-muted-label">
              {selectedResource.short_description}
            </p>
            <a
              href={selectedResource.drive_url}
              target="_blank"
              rel="noopener noreferrer"
              className="break-all text-sm font-semibold text-plum underline"
            >
              {selectedResource.drive_url}
            </a>
            <p className="text-xs text-muted-label">
              Added {new Date(selectedResource.created_at).toLocaleString()}
            </p>
          </div>
        )}
      </dialog>
    </section>
  );
}
