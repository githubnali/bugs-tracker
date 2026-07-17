import React, { useEffect, useRef, useState } from "react";
import {
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  ExternalLink,
  Pencil,
  Plus,
  Check,
  Upload,
  X,
} from "lucide-react";
import axios from "axios";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
const fmt = (value: string) =>
  new Date(value).toLocaleString([], {
    dateStyle: "medium",
    timeStyle: "short",
  });
const initials = (name?: string) =>
  name
    ? name
        .split(" ")
        .map((part) => part[0])
        .join("")
        .slice(0, 2)
        .toUpperCase()
    : "--";
function Picker({
  label,
  value,
  items,
  onChange,
}: {
  label: string;
  value: string;
  items: string[];
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    const close = (event: MouseEvent) =>
      !ref.current?.contains(event.target as Node) && setOpen(false);
    addEventListener("mousedown", close);
    return () => removeEventListener("mousedown", close);
  }, []);
  return (
    <div className="picker" ref={ref}>
      <button type="button" onClick={() => setOpen(!open)} aria-expanded={open}>
        <span>{value ? value.replace("_", " ") : label}</span>
        <ChevronDown size={16} />
      </button>
      {open && (
        <div className="picker-menu" role="listbox">
          {items.map((item) => (
            <button
              key={item}
              className={value === item ? "selected" : ""}
              onClick={() => {
                onChange(item);
                setOpen(false);
              }}
            >
              <span>{item.replace("_", " ")}</span>
              {value === item && <Check size={15} />}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
function BugEditor({
  bug,
  users,
  close,
  done,
}: {
  bug?: any;
  users: any[];
  close: () => void;
  done: () => void;
}) {
  const [form, setForm] = useState<any>(
    bug
      ? { ...bug, assigneeId: bug.assigneeId || "" }
      : {
          name: "",
          description: "",
          url: "",
          fixType: "BUG",
          screenshot: "",
        },
  );
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [dragging, setDragging] = useState(false);
  const set = (key: string, value: any) =>
    setForm((old: any) => ({ ...old, [key]: value }));
  const uploadScreenshot = async (file?: File) => {
    if (!file) return;
    if (!/image\/(jpeg|png|webp)/.test(file.type) || file.size > 5 * 1024 * 1024) {
      window.alert("Use a JPG, JPEG, PNG, or WEBP image no larger than 5 MB.");
      return;
    }
    setUploading(true);
    try {
      const data = new FormData();
      data.append("screenshot", file);
      const response = await api.post("/upload", data);
      set("screenshot", response.data.url);
    } catch {
      window.alert("Screenshot upload failed. Please try again.");
    } finally {
      setUploading(false);
      setDragging(false);
    }
  };
  const save = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !form.name ||
      !form.description ||
      !/^https?:\/\//.test(form.url)
    )
      return;
    setSaving(true);
    try {
      if (bug) {
        const { assigneeId, status, creator, assignee, createdAt, updatedAt, id, ...editable } = form;
        await api.patch(`/bugs/${bug.id}`, editable);
      }
      else await api.post("/bugs", form);
      done();
    } finally {
      setSaving(false);
    }
  };
  return (
    <div className="overlay">
      <form className="modal" onSubmit={save}>
        <button type="button" className="close" onClick={close} aria-label="Close dialog">
          <X size={22} strokeWidth={2.5} />
        </button>
        <p className="eyebrow">{bug ? "EDIT BUG" : "NEW BUG"}</p>
        <h2>{bug ? "Update registered bug" : "Capture the problem"}</h2>
        <label>
          Bug name
          <input
            required
            value={form.name}
            onChange={(e) => set("name", e.target.value)}
          />
        </label>
        <label>
          Description
          <textarea
            required
            value={form.description}
            onChange={(e) => set("description", e.target.value)}
          />
        </label>
        <label>
          Bug URL
          <input
            required
            type="url"
            value={form.url}
            onChange={(e) => set("url", e.target.value)}
          />
        </label>
        <div className="two">
          <label>
            Fix type
            <select
              value={form.fixType}
              onChange={(e) => set("fixType", e.target.value)}
            >
              <option value="BUG">Bug</option>
              <option value="NEW_FEATURE">feature</option>
            </select>
          </label>
          <div className="developer-take-note">A developer will take ownership from the Open queue.</div>
        </div>
        <div
          className={`screenshot-dropzone ${dragging ? "is-dragging" : ""}`}
          onDragOver={(event) => { event.preventDefault(); setDragging(true); }}
          onDragLeave={() => setDragging(false)}
          onDrop={(event) => { event.preventDefault(); uploadScreenshot(event.dataTransfer.files[0]); }}
        >
          {form.screenshot ? <div className="screenshot-preview"><img src={form.screenshot} alt="Selected screenshot"/><button type="button" onClick={() => set("screenshot", "")}><X size={15}/>Remove screenshot</button></div> : <><span className="upload-icon"><Upload size={22}/></span><strong>{uploading ? "Uploading screenshot…" : "Drop screenshot here"}</strong><span>or click to browse</span><small>JPG, JPEG, PNG or WEBP · Maximum 5 MB</small></>}
          <input type="file" accept="image/jpeg,image/png,image/webp" disabled={uploading} onChange={(event) => uploadScreenshot(event.target.files?.[0])}/>
        </div>
        <button className="primary wide" disabled={saving || uploading}>
          {saving ? "Saving…" : bug ? "Save changes" : "Create bug"}
        </button>
      </form>
    </div>
  );
}
export function BugsCompact() {
  const [result, setResult] = useState<any>({
      items: [],
      total: 0,
      page: 1,
      limit: 10,
    }),
    [filters, setFilters] = useState({ status: "", fixType: "", page: 1 }),
    [users, setUsers] = useState<any[]>([]),
    [statusCounts, setStatusCounts] = useState<Record<string, number>>({}),
    [lightbox, setLightbox] = useState<string | null>(null),
    [editing, setEditing] = useState<any>(undefined),
    [showNew, setShowNew] = useState(false);
  const load = async (f = filters) =>
    setResult(
      (
        await api.get("/bugs", {
          params: { ...f, limit: 10, sort: "id", order: "asc" },
        })
      ).data,
    );
  useEffect(() => {
    api.get("/users").then((r) => setUsers(r.data));
    api.get("/bugs", { params: { limit: 100 } }).then((r) => {
      const counts = r.data.items.reduce((counts: Record<string, number>, bug: any) => {
          counts[bug.status] = (counts[bug.status] || 0) + 1;
          return counts;
        }, {});
      counts.ALL = r.data.total;
      setStatusCounts(counts);
    });
  }, []);
  useEffect(() => {
    load();
  }, [filters]);
  const change = (key: string, value: string | number) =>
    setFilters((old) => ({
      ...old,
      [key]: value,
      page: key === "page" ? Number(value) : 1,
    }));
  const currentUser = JSON.parse(
      atob((localStorage.getItem("token") || ".").split(".")[1] || "e30="),
    );
  const qa = currentUser?.role === "QA";
  const updateStatus = async (id: number, status: string) => {
    try {
      await api.patch(`/bugs/${id}`, { status });
      load();
      const response = await api.get("/bugs", { params: { limit: 100 } });
      const counts = response.data.items.reduce((counts: Record<string, number>, bug: any) => {
          counts[bug.status] = (counts[bug.status] || 0) + 1;
          return counts;
        }, {});
      counts.ALL = response.data.total;
      setStatusCounts(counts);
    } catch (error: any) {
      window.alert(error.response?.data?.message || "Could not update bug status.");
    }
  };
  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Bug register</h1>
          <p>Track every issue from report to resolution.</p>
        </div>
        {qa && (
          <button className="primary" onClick={() => setShowNew(true)}>
            <Plus />
            New bug
          </button>
        )}
      </div>
      <div className="status-filter-bar" aria-label="Filter bugs by status">
        <div className="status-buttons">
          {[
            ["Open", "OPEN"],
            ["Assigned", "ASSIGNED"],
            ["Progress", "IN_PROGRESS"],
            ["Review", "REVIEW"],
            ["Closed", "CLOSED"],
          ].map(([label, status]) => (
            <button
              key={label}
              className={filters.status === status ? "active" : ""}
              onClick={() => change("status", status)}
            >
              {label} <span>({String(status ? statusCounts[status] || 0 : statusCounts.ALL || 0).padStart(2, "0")})</span>
            </button>
          ))}
        </div>
        <div className="status-filter-tools">
          <Picker label="All Fix Types" value={filters.fixType} items={["BUG", "NEW_FEATURE"]} onChange={(value) => change("fixType", value)} />
          <button className="filter-clear" onClick={() => setFilters({ status: "", fixType: "", page: 1 })}>Clear filters</button>
        </div>
      </div>
      <div className="table-wrap panel fitted-table">
        <table>
          <thead>
            <tr>
              {[
                "S.No",
                "Bug",
                "Description",
                "URL",
                "Screenshot",
                "Actions",
                "Fix Type",
                "Status",
                "Developer",
                "Created",
                "Updated",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((b: any, index: number) => (
              <tr key={b.id}>
                <td>{(filters.page - 1) * result.limit + index + 1}</td>
                <td>
                  <b>{b.name}</b>
                </td>
                <td className="truncate">{b.description}</td>
                <td>
                  <a href={b.url} target="_blank">
                    <ExternalLink size={15} />
                  </a>
                </td>
                <td>
                  {b.screenshot ? (
                    <button className="screenshot-trigger" onClick={() => setLightbox(b.screenshot)} aria-label={`Open screenshot for ${b.name}`}><img className="thumb" src={b.screenshot} alt={`Screenshot for ${b.name}`} /></button>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  {qa && (
                    <button className="text-btn" onClick={() => setEditing(b)} aria-label={`Edit ${b.name}`} title="Edit bug">
                      <Pencil size={14} />
                    </button>
                  )}
                  {!qa && b.status === "ASSIGNED" && (
                    <button className="status-action start" onClick={() => updateStatus(b.id, "IN_PROGRESS")}>Start work</button>
                  )}
                  {!qa && b.status === "OPEN" && (
                    <button className="status-action take" onClick={() => updateStatus(b.id, "ASSIGNED")}>Take</button>
                  )}
                  {!qa && b.status === "IN_PROGRESS" && (
                    <button className="status-action review" onClick={() => updateStatus(b.id, "REVIEW")}>Send to review</button>
                  )}
                  {qa && b.status === "REVIEW" && <span className="review-actions"><button className="status-action close-bug" onClick={() => updateStatus(b.id, "CLOSED")}>Close</button><button className="status-action reopen" onClick={() => updateStatus(b.id, "OPEN")}>Reopen</button></span>}
                </td>
                <td>
                  <span className={"fix-type " + b.fixType.toLowerCase()}>
                    {b.fixType === "NEW_FEATURE" ? "Feature" : "Bug"}
                  </span>
                </td>
                <td>
                  <span
                    className={
                      "status " + b.status.toLowerCase().replace("_", "-")
                    }
                  >
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td>
                  {b.assignee ? (
                    <span className="avatar" title={b.assignee.name}>
                      {initials(b.assignee.name)}
                    </span>
                  ) : (
                    "-"
                  )}
                </td>
                <td>
                  <span className="created-cell">
                    <b>{b.creator.name}</b>
                    <small>{fmt(b.createdAt)}</small>
                  </span>
                </td>
                <td>{fmt(b.updatedAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
      <div className="pagination">
        <span>{result.total} bugs</span>
        <button
          disabled={filters.page === 1}
          onClick={() => change("page", filters.page - 1)}
        >
          <ChevronLeft />
        </button>
        <b>{filters.page}</b>
        <button
          disabled={result.page * result.limit >= result.total}
          onClick={() => change("page", filters.page + 1)}
        >
          <ChevronRight />
        </button>
      </div>
      {showNew && (
        <BugEditor
          users={users}
          close={() => setShowNew(false)}
          done={() => {
            setShowNew(false);
            load();
          }}
        />
      )}
      {editing && (
        <BugEditor
          bug={editing}
          users={users}
          close={() => setEditing(undefined)}
          done={() => {
            setEditing(undefined);
            load();
          }}
        />
      )}
      {lightbox && <div className="image-lightbox" role="dialog" aria-modal="true" onClick={() => setLightbox(null)}><button className="lightbox-close" onClick={() => setLightbox(null)} aria-label="Close screenshot">×</button><img src={lightbox} alt="Bug screenshot preview" onClick={(event) => event.stopPropagation()} /></div>}
    </div>
  );
}
