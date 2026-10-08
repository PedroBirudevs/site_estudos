"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Material, Subject } from "@/lib/supabase";

const MAX_FILE_BYTES = 20 * 1024 * 1024;

function mimeFor(file: File) {
  const name = file.name.toLowerCase();
  if (name.endsWith(".md")) return "text/markdown";
  if (name.endsWith(".txt")) return "text/plain";
  return file.type;
}

function formatSize(bytes: number) {
  if (bytes < 1024 * 1024) return `${Math.max(1, Math.round(bytes / 1024))} KB`;
  return `${(bytes / 1024 / 1024).toFixed(1)} MB`;
}

function icon(mime: string) {
  if (mime === "application/pdf") return "PDF";
  if (mime.startsWith("image/")) return "IMG";
  return "TXT";
}

export function MaterialsPanel({ subject, materials }: { subject: Subject; materials: Material[] }) {
  const router = useRouter();
  const inputRef = useRef<HTMLInputElement>(null);
  const [progress, setProgress] = useState("");
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    const failed: string[] = [];
    for (const [i, file] of list.entries()) {
      setProgress(`Enviando ${i + 1} de ${list.length}: ${file.name}`);
      try {
        if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" passa de 20 MB.`);
        const mimeType = mimeFor(file);

        const signRes = await fetch(`/api/subjects/${subject.id}/materials/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType }),
        });
        const sign = await signRes.json();
        if (!signRes.ok) throw new Error(sign.error);

        const put = await fetch(sign.signedUrl, {
          method: "PUT",
          headers: { "Content-Type": mimeType, "x-upsert": "false" },
          body: file,
        });
        if (!put.ok) throw new Error(`Falha ao enviar "${file.name}" para o armazenamento.`);

        const regRes = await fetch(`/api/subjects/${subject.id}/materials`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ path: sign.path, fileName: file.name, mimeType, size: file.size }),
        });
        if (!regRes.ok) throw new Error((await regRes.json()).error);
      } catch (err) {
        failed.push(err instanceof Error ? err.message : String(err));
      }
    }
    setProgress("");
    setErrors(failed);
    if (inputRef.current) inputRef.current.value = "";
    router.refresh();
  }

  async function remove(m: Material) {
    if (!confirm(`Remover "${m.file_name}"?`)) return;
    await fetch(`/api/materials/${m.id}`, { method: "DELETE" });
    router.refresh();
  }

  async function removeSubject() {
    if (!confirm(`Apagar a matéria "${subject.name}" e todos os materiais dela?`)) return;
    await fetch(`/api/subjects/${subject.id}`, { method: "DELETE" });
    router.push("/");
    router.refresh();
  }

  return (
    <div className="space-y-5">
      <label
        onDragOver={(e) => {
          e.preventDefault();
          setDragging(true);
        }}
        onDragLeave={() => setDragging(false)}
        onDrop={(e) => {
          e.preventDefault();
          setDragging(false);
          if (e.dataTransfer.files.length) upload(e.dataTransfer.files);
        }}
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-10 text-center transition ${
          dragging ? "border-accent bg-accent-soft" : "border-line hover:border-accent"
        }`}
      >
        <span className="font-medium">{progress || "Arraste arquivos aqui ou clique para escolher"}</span>
        <span className="mt-1 text-xs text-muted">
          PDF, fotos (PNG, JPG, WEBP) e texto (.txt, .md), até 20 MB cada. Slides do PowerPoint: exporte como PDF.
        </span>
        <input
          ref={inputRef}
          type="file"
          multiple
          hidden
          disabled={!!progress}
          accept=".pdf,.png,.jpg,.jpeg,.webp,.gif,.txt,.md,application/pdf,image/*,text/plain"
          onChange={(e) => e.target.files?.length && upload(e.target.files)}
        />
      </label>

      {errors.length > 0 && (
        <ul className="space-y-1 text-sm text-bad">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {materials.length > 0 ? (
        <ul className="divide-y divide-line rounded-xl border border-line bg-card">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-3 px-4 py-3">
              <span className="w-10 shrink-0 rounded bg-accent-soft py-1 text-center text-[10px] font-bold text-accent">
                {icon(m.mime_type)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm">{m.file_name}</span>
              <span className="shrink-0 text-xs text-muted">{formatSize(m.size_bytes)}</span>
              <button onClick={() => remove(m)} className="shrink-0 text-xs text-muted hover:text-bad">
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="text-sm text-muted">Nenhum material ainda.</p>
      )}

      <button onClick={removeSubject} className="text-xs text-muted hover:text-bad">
        Apagar matéria
      </button>
    </div>
  );
}
