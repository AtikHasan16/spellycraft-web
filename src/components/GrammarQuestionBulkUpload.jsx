import { useMemo, useRef, useState } from "react";
import { HiCheckCircle, HiCloudArrowUp, HiDocumentArrowUp, HiExclamationTriangle } from "react-icons/hi2";
import { useAuth } from "../context/AuthContext";
import apiClient from "../services/apiClient";
import { showConfirmModal, showErrorAlert, showSuccessToast } from "../utils/sweetalert";
import {
  GRAMMAR_UPLOAD_MODULES,
  MAX_GRAMMAR_QUESTIONS_PER_IMPORT,
  parseGrammarQuestionImport,
} from "../utils/grammarQuestionImport";

const EXAMPLE_MODULE = "parallelism";
const EXAMPLE_DATA = [
  "The course teaches reading, ____ and speaking.=write=writing=to write=written=writing=All items in the list use the same grammatical form.",
  "The policy aims not only to reduce waste but also ____ green jobs.=create=creating=to create=created=to create=Both parts of the correlative conjunction use matching infinitives.",
].join("\n");

export default function GrammarQuestionBulkUpload() {
  const { user } = useAuth();
  const fileInputRef = useRef(null);
  const [defaultModule, setDefaultModule] = useState(EXAMPLE_MODULE);
  const [rawText, setRawText] = useState("");
  const [importing, setImporting] = useState(false);
  const [importResult, setImportResult] = useState(null);
  const [fileError, setFileError] = useState("");

  const { questions, errors } = useMemo(
    () => parseGrammarQuestionImport(rawText, defaultModule),
    [rawText, defaultModule],
  );
  const hasTooManyQuestions = questions.length > MAX_GRAMMAR_QUESTIONS_PER_IMPORT;

  if (user?.role !== "admin") {
    return (
      <div className="imlaa-card p-6 border border-rose-200 bg-rose-50 text-rose-800">
        Admin access is required to upload grammar questions.
      </div>
    );
  }

  const handleFileChange = async (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    try {
      setRawText(await file.text());
      setImportResult(null);
      setFileError("");
    } catch (error) {
      console.error("Could not read grammar question file:", error);
      setFileError("The selected file could not be read. Please try a UTF-8 text file.");
    } finally {
      event.target.value = "";
    }
  };

  const handleImport = async () => {
    if (errors.length || !questions.length || hasTooManyQuestions) return;
    const confirmation = await showConfirmModal({
      title: "Upload grammar questions?",
      text: `Insert ${questions.length} question${questions.length === 1 ? "" : "s"} into the grammar quiz bank?`,
      confirmButtonText: "Upload Questions",
      icon: "question",
    });
    if (!confirmation.isConfirmed) return;

    setImporting(true);
    setImportResult(null);
    setFileError("");
    try {
      const response = await apiClient.post("/grammar/questions/bulk", { questions });
      setImportResult(response.data);
      setRawText("");
      showSuccessToast("Grammar Questions Uploaded", response.data.message);
    } catch (error) {
      console.error("Grammar question import failed:", error);
      setFileError(error.message || "The grammar questions could not be uploaded.");
      showErrorAlert("Grammar Import Failed", error.message || "Please correct the data and try again.");
    } finally {
      setImporting(false);
    }
  };

  return (
    <section className="flex flex-col space-y-6">
      <div className="imlaa-card p-5 border border-plum/20 bg-plum/5">
        <h3 className="text-lg font-bold text-plum">Bulk format</h3>
        <p className="mt-2 text-sm text-muted-label">
          Set the module once for this import. Add one question per line and separate
          the question, each option, the correct answer, and explanation with{" "}
          <code>=</code>.
        </p>
        <pre className="mt-3 overflow-x-auto rounded-lg border border-plum/15 bg-white p-3 text-xs text-body-dark">
          question=option 1=option 2=option 3=option 4=correct answer=explanation
        </pre>
        <p className="mt-2 text-xs text-muted-label">
          The answer must exactly match one option. Keep <code>=</code> out of question,
          option, answer, and explanation text. Up to {MAX_GRAMMAR_QUESTIONS_PER_IMPORT}{" "}
          questions can be uploaded at once.
        </p>
      </div>

      <div className="imlaa-card p-6 sm:p-8 space-y-5">
        <div className="grid gap-4 sm:grid-cols-[minmax(0,1fr)_auto] sm:items-end">
          <label className="block text-sm font-bold text-body-dark">
            Module for this question batch
            <select
              value={defaultModule}
              onChange={(event) => setDefaultModule(event.target.value)}
              className="imlaa-input mt-2 min-h-11 w-full text-base"
              required
            >
              <option value="" disabled>Select a GrammarPage module</option>
              {GRAMMAR_UPLOAD_MODULES.map(({ id, title }) => (
                <option key={id} value={id}>{title}</option>
              ))}
            </select>
          </label>

          <div className="flex gap-2">
            <input
              ref={fileInputRef}
              type="file"
              accept=".txt,.tsv"
              onChange={handleFileChange}
              className="hidden"
            />
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="imlaa-btn-secondary min-h-11 px-4 text-sm font-bold"
            >
              <HiDocumentArrowUp className="mr-2 inline h-5 w-5" />
              Load file
            </button>
            <button
              type="button"
              onClick={() => {
                setRawText(EXAMPLE_DATA);
                setImportResult(null);
                setFileError("");
              }}
              className="imlaa-btn-secondary min-h-11 px-4 text-sm font-bold"
            >
              Load example
            </button>
          </div>
        </div>

        <label className="block text-sm font-bold text-body-dark">
          Paste bulk questions
          <textarea
            rows={9}
            value={rawText}
            onChange={(event) => {
              setRawText(event.target.value);
              setImportResult(null);
              setFileError("");
            }}
            placeholder={EXAMPLE_DATA}
            className="imlaa-input mt-2 w-full font-mono text-sm leading-relaxed"
          />
        </label>

        {fileError && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <HiExclamationTriangle className="mr-2 inline h-5 w-5" />
            {fileError}
          </div>
        )}

        {errors.length > 0 && (
          <div role="alert" className="rounded-xl border border-rose-200 bg-rose-50 p-4 text-sm text-rose-800">
            <h4 className="font-bold">Fix these rows before uploading:</h4>
            <ul className="mt-2 list-inside list-disc space-y-1">
              {errors.slice(0, 20).map((error, index) => (
                <li key={`${error.line}-${index}`}>
                  {error.line ? `Line ${error.line}: ` : ""}
                  {error.message}
                </li>
              ))}
              {errors.length > 20 && <li>And {errors.length - 20} more validation errors.</li>}
            </ul>
          </div>
        )}

        <div className="flex flex-col gap-3 border-t border-plum/10 pt-4 sm:flex-row sm:items-center sm:justify-between">
          <span className="text-sm font-semibold text-body-dark">
            {questions.length} valid question{questions.length === 1 ? "" : "s"} ready
          </span>
          <div className="flex flex-wrap gap-2">
            {rawText && (
              <button
                type="button"
                onClick={() => {
                  setRawText("");
                  setImportResult(null);
                  setFileError("");
                }}
                disabled={importing}
                className="imlaa-btn-secondary min-h-11 px-5 text-sm font-bold"
              >
                Clear
              </button>
            )}
            <button
              type="button"
              onClick={handleImport}
              disabled={importing || !questions.length || errors.length > 0 || hasTooManyQuestions}
              className="imlaa-btn-primary min-h-11 px-5 text-sm font-bold disabled:cursor-not-allowed disabled:opacity-50"
            >
              <HiCloudArrowUp className="mr-2 inline h-5 w-5" />
              {importing ? "Uploading..." : `Upload ${questions.length} Questions`}
            </button>
          </div>
        </div>
      </div>

      {importResult && (
        <div role="status" className="flex items-center gap-2 rounded-xl border border-emerald-600/30 bg-emerald-50 p-4 text-emerald-800">
          <HiCheckCircle className="h-6 w-6 shrink-0" />
          {importResult.message}
        </div>
      )}

      {questions.length > 0 && (
        <div className="imlaa-card space-y-4 p-6">
          <div className="flex items-center justify-between border-b border-plum/15 pb-3">
            <h3 className="text-lg font-bold text-body-dark">Preview</h3>
            <span className="text-sm font-semibold text-plum">{questions.length} questions</span>
          </div>
          <div className="max-h-96 overflow-auto">
            <table className="w-full text-left text-sm">
              <thead className="sticky top-0 bg-white text-xs uppercase text-muted-label">
                <tr>
                  <th className="p-2">#</th>
                  <th className="p-2">Module / Question</th>
                  <th className="p-2">Options</th>
                  <th className="p-2">Answer</th>
                  <th className="p-2">Explanation</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-plum/10">
                {questions.map((question, index) => (
                  <tr key={`${question.module}-${index}`} className="align-top">
                    <td className="p-2 font-mono">{index + 1}</td>
                    <td className="max-w-xs p-2">
                      <div className="font-semibold text-plum">
                        {GRAMMAR_UPLOAD_MODULES.find(({ id }) => id === question.module)?.title ?? question.module}
                      </div>
                      <div className="mt-1 text-body-dark">{question.question}</div>
                    </td>
                    <td className="p-2">
                      <ul className="list-inside list-disc">
                        {question.options.map((option) => <li key={option}>{option}</li>)}
                      </ul>
                    </td>
                    <td className="p-2 font-bold text-emerald-700">{question.answer}</td>
                    <td className="max-w-xs p-2 text-muted-label">{question.explanation || "—"}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </section>
  );
}
