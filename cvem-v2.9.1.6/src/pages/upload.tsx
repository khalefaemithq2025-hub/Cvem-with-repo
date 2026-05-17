import { useState, useRef } from "react";

export default function Upload() {
  const [status, setStatus] = useState<"idle" | "uploading" | "done" | "error">("idle");
  const [message, setMessage] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  async function handleUpload(file: File) {
    setStatus("uploading");
    setMessage("");
    const form = new FormData();
    form.append("file", file);
    try {
      const res = await fetch("/api/upload", { method: "POST", body: form });
      const data = await res.json();
      if (data.success) {
        setStatus("done");
        setMessage(`"${data.filename}" uploaded successfully. You can now ask the agent to extract and restore it.`);
      } else {
        setStatus("error");
        setMessage(data.error || "Upload failed.");
      }
    } catch {
      setStatus("error");
      setMessage("Upload failed. Please try again.");
    }
  }

  function onFileChange(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (file) handleUpload(file);
  }

  function onDrop(e: React.DragEvent<HTMLDivElement>) {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleUpload(file);
  }

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <div className="bg-white rounded-2xl shadow-lg p-8 w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-900 mb-2">Upload Backup File</h1>
        <p className="text-gray-500 text-sm mb-6">Select or drop your <code className="bg-gray-100 px-1 rounded">kcc-backup.tar.gz</code> file below.</p>

        <div
          onDrop={onDrop}
          onDragOver={(e) => e.preventDefault()}
          onClick={() => inputRef.current?.click()}
          className="border-2 border-dashed border-blue-300 rounded-xl p-10 cursor-pointer hover:bg-blue-50 transition-colors mb-4"
        >
          {status === "uploading" ? (
            <p className="text-blue-600 font-medium">Uploading...</p>
          ) : (
            <>
              <p className="text-4xl mb-3">📂</p>
              <p className="text-gray-600 font-medium">Tap to choose file</p>
              <p className="text-gray-400 text-sm mt-1">or drag and drop here</p>
            </>
          )}
        </div>

        <input
          ref={inputRef}
          type="file"
          accept=".gz,.tar.gz,.tgz"
          className="hidden"
          onChange={onFileChange}
        />

        {status === "done" && (
          <div className="bg-green-50 border border-green-200 rounded-lg p-4 text-green-800 text-sm">
            {message}
          </div>
        )}
        {status === "error" && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-4 text-red-800 text-sm">
            {message}
          </div>
        )}

        {status === "idle" && (
          <button
            onClick={() => inputRef.current?.click()}
            className="mt-2 w-full bg-blue-600 hover:bg-blue-700 text-white font-semibold py-3 px-6 rounded-xl transition-colors"
          >
            Choose File
          </button>
        )}
      </div>
    </div>
  );
}
