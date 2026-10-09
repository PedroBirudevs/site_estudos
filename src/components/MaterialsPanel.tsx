"use client";

import { useRouter } from "next/navigation";
import { useRef, useState } from "react";
import type { Material, Subject } from "@/lib/supabase";
import { Icon } from "./Icon";

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
  const [progress, setProgress] = useState<{ current: number; total: number; name: string } | null>(null);
  const [errors, setErrors] = useState<string[]>([]);
  const [dragging, setDragging] = useState(false);

  async function upload(files: FileList | File[]) {
    const list = Array.from(files);
    const failed: string[] = [];
    for (const [i, file] of list.entries()) {
      setProgress({ current: i + 1, total: list.length, name: file.name });
      try {
        if (file.size > MAX_FILE_BYTES) throw new Error(`"${file.name}" passa de 20 MB.`);
        const mimeType = mimeFor(file);

        const signRes = await fetch(`/api/subjects/${subject.id}/materials/upload-url`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ fileName: file.name, mimeType }),
        });
        const sign = await signRes.json();
        // Sessão expirada: para aqui em vez de falhar arquivo por arquivo.
        if (signRes.status === 401) {
          failed.push(sign.error);
          break;
        }
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
    setProgress(null);
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
    router.push("/app");
    router.refresh();
  }

  return (
    <div className="space-y-6">
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
        className={`flex cursor-pointer flex-col items-center justify-center rounded-xl border-2 border-dashed px-6 py-12 text-center transition ${
          dragging ? "border-azul-principal bg-azul-claro" : "border-borda bg-superficie hover:border-azul-principal"
        }`}
      >
        <span className="grid size-12 place-items-center rounded-full bg-azul-claro text-azul-principal">
          <Icon name="enviar" className="size-6" />
        </span>
        {progress ? (
          <span className="mt-4 w-full max-w-sm">
            <span className="block truncate text-sm font-medium">
              Enviando {progress.current} de {progress.total}: {progress.name}
            </span>
            <span className="mt-3 block h-2 overflow-hidden rounded-full bg-borda">
              <span
                className="block h-full rounded-full bg-azul-principal transition-all"
                style={{ width: `${((progress.current - 1) / progress.total) * 100}%` }}
              />
            </span>
          </span>
        ) : (
          <>
            <span className="mt-4 font-medium">Arraste arquivos aqui ou clique para escolher</span>
            <span className="mt-1 max-w-md text-sm text-texto-suave">
              PDF, fotos (PNG, JPG, WEBP) e texto (.txt, .md), até 20 MB cada. Slides do PowerPoint: exporte como PDF.
            </span>
          </>
        )}
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
        <ul className="space-y-1 text-sm text-erro">
          {errors.map((e, i) => (
            <li key={i}>{e}</li>
          ))}
        </ul>
      )}

      {materials.length > 0 ? (
        <ul className="card divide-y divide-borda p-0">
          {materials.map((m) => (
            <li key={m.id} className="flex items-center gap-4 px-5 py-4">
              <span className="w-11 shrink-0 rounded-md bg-azul-claro py-1.5 text-center text-[10px] font-bold text-azul-principal">
                {icon(m.mime_type)}
              </span>
              <span className="min-w-0 flex-1 truncate text-sm font-medium">{m.file_name}</span>
              <span className="hidden shrink-0 text-xs text-texto-suave sm:inline">{formatSize(m.size_bytes)}</span>
              <button onClick={() => remove(m)} className="shrink-0 text-sm text-texto-suave hover:text-erro">
                Remover
              </button>
            </li>
          ))}
        </ul>
      ) : (
        <p className="card text-sm text-texto-suave">Nenhum material ainda. Envie o primeiro arquivo acima.</p>
      )}

      <button onClick={removeSubject} className="text-sm text-texto-suave hover:text-erro">
        Apagar matéria
      </button>
    </div>
  );
}
