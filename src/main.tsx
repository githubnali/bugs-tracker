import React, {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useState,
} from "react";
import { createRoot } from "react-dom/client";
import {
  BrowserRouter,
  NavLink,
  Navigate,
  Route,
  Routes,
  useNavigate,
} from "react-router-dom";
import axios from "axios";
import { useForm } from "react-hook-form";
import toast, { Toaster } from "react-hot-toast";
import {
  BarChart3,
  Bell,
  Check,
  ChevronLeft,
  ChevronRight,
  ClipboardList,
  Copy,
  Download,
  ExternalLink,
  LogOut,
  Menu,
  Moon,
  Plus,
  Search,
  Sun,
  Upload,
  X,
} from "lucide-react";
import {
  Bar,
  BarChart,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  LineChart,
  Line,
} from "recharts";
import "./styles.css";
import "./rail.css";
import "./controls.css";
import { BugsCompact } from "./BugsCompact";
const api = axios.create({ baseURL: "/api" });
api.interceptors.request.use((c) => {
  const t = localStorage.getItem("token");
  if (t) c.headers.Authorization = `Bearer ${t}`;
  return c;
});
api.interceptors.response.use(
  (r) => r,
  (e) => {
    if (e.response?.status === 401) {
      localStorage.clear();
      location.href = "/login";
    }
    return Promise.reject(e);
  },
);
type User = { id: number; name: string; role: "QA" | "DEVELOPER" };
const Auth = createContext<{
  user: User | null;
  setUser: (u: User | null) => void;
}>({ user: null, setUser: () => {} });
const useAuth = () => useContext(Auth);
const statusClass = (s: string) =>
    `status ${s.toLowerCase().replace("_", "-")}`,
  priorityClass = (s: string) => `priority ${s.toLowerCase()}`;
const fmt = (v: string) =>
  new Date(v).toLocaleString([], { dateStyle: "medium", timeStyle: "short" });
function Login() {
  const { setUser } = useAuth(),
    nav = useNavigate();
  const {
    register,
    handleSubmit,
    formState: { errors, isSubmitting },
  } = useForm();
  const submit = async (d: any) => {
    try {
      const r = await api.post("/auth/login", d);
      localStorage.setItem("token", r.data.token);
      setUser(r.data.user);
      nav("/");
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Login failed");
    }
  };
  return (
    <main className="login">
      <section>
        <p className="eyebrow">QUALITY, VISIBLE</p>
        <h1>
          Bug
          <br />
          <i>Tracker.</i>
        </h1>
        <p className="intro">
          A focused home for the work between “found it” and “fixed it.”
        </p>
        <div className="login-note">
          Demo password for all accounts
          <br />
          <strong>bugtracker123</strong>
        </div>
      </section>
      <form onSubmit={handleSubmit(submit)} className="login-card">
        <span className="mark">BT</span>
        <h2>Welcome back</h2>
        <p>Choose your workspace identity.</p>
        <label>
          Name
          <select {...register("name", { required: true })} defaultValue="">
            <option value="" disabled>
              Select a user
            </option>
            {["Vinith", "Sai Teja", "Nagaraju", "Suraj"].map((x) => (
              <option key={x}>{x}</option>
            ))}
          </select>
          {errors.name && <small>Select your name</small>}
        </label>
        <label>
          Password
          <input
            type="password"
            {...register("password", { required: true })}
            defaultValue="bugtracker123"
          />
          {errors.password && <small>Password required</small>}
        </label>
        <button disabled={isSubmitting} className="primary">
          {isSubmitting ? "Entering…" : "Enter workspace"}
        </button>
      </form>
    </main>
  );
}
function Shell() {
  const { user, setUser } = useAuth(),
    [dark, setDark] = useState(false),
    [open, setOpen] = useState(false),
    [notes, setNotes] = useState<any[]>([]);
  const nav = useNavigate();
  useEffect(() => {
    api
      .get("/notifications")
      .then((r) => setNotes(r.data))
      .catch(() => {});
  }, []);
  useEffect(() => {
    document.documentElement.dataset.theme = dark ? "dark" : "light";
  }, [dark]);
  const logout = () => {
    localStorage.clear();
    setUser(null);
    nav("/login");
  };
  return (
    <div className="app">
      <aside className={open ? "shown" : ""}>
        <div className="brand">
          <span>BT</span> Bug Tracker
        </div>
        <nav>
          <NavLink to="/" end>
            <BarChart3 />
            Overview
          </NavLink>
          <NavLink to="/bugs">
            <ClipboardList />
            Bug register
          </NavLink>
        </nav>
        <div className="side-bottom">
          <div className="user-chip">
            <b>{user?.name.slice(0, 1)}</b>
            <span>
              {user?.name}
              <small>{user?.role}</small>
            </span>
          </div>
          <button onClick={logout}>
            <LogOut />
            Sign out
          </button>
        </div>
      </aside>
      <main className="workspace">
        <header>
          <button className="icon mobile" onClick={() => setOpen(!open)}>
            <Menu />
          </button>
          <div>
            <p className="eyebrow">
              {user?.role === "QA"
                ? "QUALITY ASSURANCE"
                : "DEVELOPER WORKSPACE"}
            </p>
            <h2>
              Good {new Date().getHours() < 12 ? "morning" : "afternoon"},{" "}
              {user?.name}.
            </h2>
          </div>
          <div className="head-actions">
            <button className="icon" onClick={() => setDark(!dark)}>
              {dark ? <Sun /> : <Moon />}
            </button>
            <div className="notification">
              <button className="icon">
                <Bell />
                {notes.filter((n) => !n.read).length > 0 && (
                  <em>{notes.filter((n) => !n.read).length}</em>
                )}
              </button>
              <div className="note-menu">
                <b>Notifications</b>
                {notes.length ? (
                  <>
                    {notes.map((n) => (
                      <p className={n.read ? "" : "unread"} key={n.id}>
                        {n.message}
                      </p>
                    ))}
                    <button
                      onClick={async () => {
                        await api.patch("/notifications/read");
                        setNotes(notes.map((n) => ({ ...n, read: true })));
                      }}
                    >
                      Mark all read
                    </button>
                  </>
                ) : (
                  <p>All caught up.</p>
                )}
              </div>
            </div>
          </div>
        </header>
        <Routes>
          <Route path="/" element={<Dashboard />} />
          <Route path="/bugs" element={<BugsCompact />} />
          <Route path="*" element={<NotFound />} />
        </Routes>
      </main>
    </div>
  );
}
function Dashboard() {
  const { user } = useAuth(),
    [data, setData] = useState<any>();
  useEffect(() => {
    api.get("/dashboard").then((r) => setData(r.data));
  }, []);
  if (!data) return <div className="skeleton-page" />;
  const cards = [
    ["Total Bugs", data.total],
    ["Open", data.counts.OPEN],
    ["Assigned", data.counts.ASSIGNED],
    ["In Progress", data.counts.IN_PROGRESS],
    ["Review", data.counts.REVIEW],
    ["Closed", data.counts.CLOSED],
    ["Critical", data.critical],
  ];
  return (
    <div className="page">
      <div className="card-grid">
        {cards.map(([n, v]) => (
          <article
            className={"metric " + (n === "Critical" ? "critical-card" : "")}
            key={n}
          >
            <span>{n}</span>
            <strong>{v}</strong>
          </article>
        ))}
      </div>
      <section className="chart-grid">
        <Chart title="Status distribution">
          <PieChart>
            <Pie
              data={data.status}
              dataKey="count"
              nameKey="name"
              innerRadius={55}
              outerRadius={83}
              paddingAngle={4}
            >
              {data.status.map((_: any, i: number) => (
                <Cell
                  key={i}
                  fill={
                    ["#fc6c26", "#f6ba58", "#4e7c73", "#8d73b5", "#516f8d"][i]
                  }
                />
              ))}
            </Pie>
            <Tooltip />
            <Legend />
          </PieChart>
        </Chart>
        <Chart title="Fix type balance">
          <BarChart data={data.fixType}>
            <XAxis dataKey="name" />
            <YAxis />
            <Tooltip />
            <Bar dataKey="count" fill="#fc6c26" radius={[6, 6, 0, 0]} />
          </BarChart>
        </Chart>
        <Chart title="Weekly intake">
          <LineChart data={data.week}>
            <XAxis dataKey="day" />
            <YAxis allowDecimals={false} />
            <Tooltip />
            <Line
              type="monotone"
              dataKey="count"
              stroke="#fc6c26"
              strokeWidth={3}
            />
          </LineChart>
        </Chart>
        {user?.role === "QA" && (
          <Chart title="Developer workload">
            <BarChart data={data.workload}>
              <XAxis dataKey="name" />
              <YAxis allowDecimals={false} />
              <Tooltip />
              <Bar dataKey="count" fill="#4e7c73" radius={[6, 6, 0, 0]} />
            </BarChart>
          </Chart>
        )}
      </section>
      <section className="recent panel">
        <div className="section-title">
          <h3>Recent activity</h3>
        </div>
        {data.recent.map((a: any) => (
          <div key={a.id}>
            <span className="dot" />
            <p>
              <b>{a.user.name}</b> {a.action.toLowerCase()}{" "}
              <strong>{a.bug.name}</strong>
              <small>{fmt(a.createdAt)}</small>
            </p>
          </div>
        ))}
      </section>
    </div>
  );
}
function Chart({ title, children }: { title: string; children: any }) {
  return (
    <section className="panel chart">
      <h3>{title}</h3>
      <ResponsiveContainer width="100%" height={230}>
        {children}
      </ResponsiveContainer>
    </section>
  );
}
function Bugs() {
  const { user } = useAuth(),
    [result, setResult] = useState<any>({ items: [], total: 0 }),
    [filters, setFilters] = useState<any>({
      search: "",
      status: "",
      priority: "",
      developer: "",
      qa: "",
      page: 1,
    }),
    [users, setUsers] = useState<User[]>([]),
    [modal, setModal] = useState(false),
    [selected, setSelected] = useState<any>(null);
  const load = async (f = filters) =>
    setResult((await api.get("/bugs", { params: { ...f, limit: 10 } })).data);
  useEffect(() => {
    api.get("/users").then((r) => setUsers(r.data));
  }, []);
  useEffect(() => {
    const t = setTimeout(() => load(), 300);
    return () => clearTimeout(t);
  }, [filters]);
  const change = (k: string, v: any) =>
    setFilters((x: any) => ({ ...x, [k]: v, page: 1 }));
  const download = () => {
    const h = [
      "S.No",
      "Bug Name",
      "Description",
      "URL",
      "Priority",
      "Status",
      "Developer",
      "Created By",
      "Created Date",
    ];
    const rows = result.items.map((b: any) =>
      [
        b.id,
        b.name,
        b.description,
        b.url,
        b.priority,
        b.status,
        b.assignee?.name || "",
        b.creator.name,
        b.createdAt,
      ].map((v: any) => `"${String(v).replaceAll('"', '""')}"`),
    );
    const a = document.createElement("a");
    a.href = URL.createObjectURL(
      new Blob([[h, ...rows].map((r) => r.join(",")).join("\n")], {
        type: "text/csv",
      }),
    );
    a.download = "bugs.csv";
    a.click();
  };
  return (
    <div className="page">
      <div className="page-title">
        <div>
          <h1>Bug register</h1>
          <p>Track every issue from report to resolution.</p>
        </div>
        <div>
          {user?.role === "QA" && (
            <button className="secondary" onClick={download}>
              <Download />
              Export
            </button>
          )}{" "}
          {user?.role === "QA" && (
            <button className="primary" onClick={() => setModal(true)}>
              <Plus />
              New bug
            </button>
          )}
        </div>
      </div>
      <div className="filters panel">
        <div className="search">
          <Search />
          <input
            placeholder="Search bugs…"
            value={filters.search}
            onChange={(e) => change("search", e.target.value)}
          />
        </div>
        {[
          [
            "status",
            ["", "OPEN", "ASSIGNED", "IN_PROGRESS", "REVIEW", "CLOSED"],
          ],
          ["priority", ["", "LOW", "MEDIUM", "HIGH", "CRITICAL"]],
        ].map(([k, vals]: any) => (
          <select
            key={k}
            value={filters[k]}
            onChange={(e) => change(k, e.target.value)}
          >
            <option value="">All {k}s</option>
            {vals.slice(1).map((x: string) => (
              <option key={x}>{x}</option>
            ))}
          </select>
        ))}
        {user?.role === "QA" && (
          <>
            <select
              value={filters.developer}
              onChange={(e) => change("developer", e.target.value)}
            >
              <option value="">All developers</option>
              {users
                .filter((u) => u.role === "DEVELOPER")
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
            <select
              value={filters.qa}
              onChange={(e) => change("qa", e.target.value)}
            >
              <option value="">All QA</option>
              {users
                .filter((u) => u.role === "QA")
                .map((u) => (
                  <option value={u.id} key={u.id}>
                    {u.name}
                  </option>
                ))}
            </select>
          </>
        )}
      </div>
      <div className="table-wrap panel">
        <table>
          <thead>
            <tr>
              {[
                "S.No",
                "Bug name",
                "Description",
                "URL",
                "Screenshot",
                "Priority",
                "Status",
                "Assigned developer",
                "Created by",
                "Created date",
                "Last updated",
                "Actions",
              ].map((x) => (
                <th key={x}>{x}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {result.items.map((b: any) => (
              <tr key={b.id} onClick={() => setSelected(b.id)}>
                <td>#{b.id}</td>
                <td>
                  <b>{b.name}</b>
                </td>
                <td className="truncate">{b.description}</td>
                <td>
                  <a
                    href={b.url}
                    target="_blank"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <ExternalLink size={15} />
                  </a>
                </td>
                <td>
                  {b.screenshot ? (
                    <img className="thumb" src={b.screenshot} />
                  ) : (
                    <span>—</span>
                  )}
                </td>
                <td>
                  <span className={priorityClass(b.priority)}>
                    {b.priority}
                  </span>
                </td>
                <td>
                  <span className={statusClass(b.status)}>
                    {b.status.replace("_", " ")}
                  </span>
                </td>
                <td>{b.assignee?.name || "Unassigned"}</td>
                <td>{b.creator.name}</td>
                <td>{fmt(b.createdAt)}</td>
                <td>{fmt(b.updatedAt)}</td>
                <td>
                  <button
                    className="text-btn"
                    onClick={(e) => {
                      e.stopPropagation();
                      setSelected(b.id);
                    }}
                  >
                    Open
                  </button>
                </td>
              </tr>
            ))}
            {!result.items.length && (
              <tr>
                <td colSpan={12}>
                  <div className="empty">No bugs match these filters.</div>
                </td>
              </tr>
            )}
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
      {modal && (
        <BugForm
          users={users}
          close={() => setModal(false)}
          done={() => {
            setModal(false);
            load();
          }}
        />
      )}
      {selected && (
        <Drawer
          id={selected}
          users={users}
          close={() => setSelected(null)}
          refresh={load}
        />
      )}
    </div>
  );
}
function BugForm({
  users,
  close,
  done,
}: {
  users: User[];
  close: () => void;
  done: () => void;
}) {
  const {
    register,
    handleSubmit,
    setValue,
    watch,
    formState: { errors, isSubmitting },
  } = useForm();
  const [uploading, setUploading] = useState(false),
    screenshot = watch("screenshot");
  const upload = async (f: File) => {
    if (!/image\/(jpeg|png|webp)/.test(f.type)) {
      toast.error("Use jpg, jpeg, png, or webp");
      return;
    }
    setUploading(true);
    try {
      const d = new FormData();
      d.append("screenshot", f);
      const r = await api.post("/upload", d);
      setValue("screenshot", r.data.url);
      toast.success("Screenshot uploaded");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };
  useEffect(() => {
    const esc = (e: KeyboardEvent) => e.key === "Escape" && close();
    addEventListener("keydown", esc);
    return () => removeEventListener("keydown", esc);
  }, []);
  return (
    <div className="overlay" onMouseDown={close}>
      <form
        className="modal"
        onMouseDown={(e) => e.stopPropagation()}
        onSubmit={handleSubmit(async (d) => {
          try {
            await api.post("/bugs", d);
            toast.success("Bug created and assigned");
            done();
          } catch (e: any) {
            toast.error(e.response?.data?.message || "Could not create bug");
          }
        })}
      >
        <button type="button" className="close" onClick={close}>
          <X />
        </button>
        <p className="eyebrow">NEW REPORT</p>
        <h2>Capture the problem.</h2>
        <label>
          Bug name
          <input
            autoFocus
            {...register("name", { required: "Bug name is required" })}
          />
          {errors.name && <small>{String(errors.name.message)}</small>}
        </label>
        <label>
          Description
          <textarea
            {...register("description", {
              required: "Description is required",
            })}
          />
          {errors.description && (
            <small>{String(errors.description.message)}</small>
          )}
        </label>
        <label>
          Bug URL
          <input
            placeholder="https://"
            {...register("url", {
              required: "URL is required",
              pattern: {
                value: /^https?:\/\//,
                message: "Enter a valid http(s) URL",
              },
            })}
          />
          {errors.url && <small>{String(errors.url.message)}</small>}
        </label>
        <div className="two">
          <label>
            Priority
            <select {...register("priority", { required: true })}>
              <option value="">Select</option>
              {["LOW", "MEDIUM", "HIGH", "CRITICAL"].map((x) => (
                <option key={x}>{x}</option>
              ))}
            </select>
          </label>
          <label>
            Assign developer
            <select {...register("assigneeId", { required: true })}>
              <option value="">Select</option>
              {users
                .filter((x) => x.role === "DEVELOPER")
                .map((x) => (
                  <option value={x.id} key={x.id}>
                    {x.name}
                  </option>
                ))}
            </select>
          </label>
        </div>
        <input type="hidden" {...register("screenshot")} />
        <label className="dropzone">
          {screenshot ? (
            <img src={screenshot} />
          ) : (
            <>
              <Upload />
              <span>
                {uploading
                  ? "Uploading…"
                  : "Drop an image or choose a screenshot"}
              </span>
              <small>JPG, PNG or WEBP · max 5MB</small>
            </>
          )}
          <input
            type="file"
            accept="image/jpeg,image/png,image/webp"
            onChange={(e) => e.target.files?.[0] && upload(e.target.files[0])}
          />
        </label>
        <button className="primary wide" disabled={isSubmitting || uploading}>
          {isSubmitting ? "Saving…" : "Create bug"}
        </button>
      </form>
    </div>
  );
}
function Drawer({
  id,
  users,
  close,
  refresh,
}: {
  id: number;
  users: User[];
  close: () => void;
  refresh: () => void;
}) {
  const { user } = useAuth(),
    [bug, setBug] = useState<any>(),
    [comment, setComment] = useState("");
  const load = () => api.get("/bugs/" + id).then((r) => setBug(r.data));
  useEffect(() => {
    load();
  }, [id]);
  if (!bug) return <div className="drawer">Loading…</div>;
  const update = async (data: any) => {
    try {
      await api.patch("/bugs/" + id, data);
      toast.success("Bug updated");
      load();
      refresh();
    } catch (e: any) {
      toast.error(e.response?.data?.message || "Update failed");
    }
  };
  const add = async () => {
    if (!comment.trim()) return;
    try {
      await api.post("/bugs/" + id + "/comments", { content: comment });
      setComment("");
      load();
    } catch {
      toast.error("Comment failed");
    }
  };
  return (
    <div className="drawer">
      <button className="close" onClick={close}>
        <X />
      </button>
      <p className="eyebrow">BUG #{bug.id}</p>
      <h2>{bug.name}</h2>
      <div className="actions">
        {user?.role === "DEVELOPER" && bug.status !== "CLOSED" && (
          <>
            {bug.status !== "IN_PROGRESS" && (
              <button
                className="secondary"
                onClick={() => update({ status: "IN_PROGRESS" })}
              >
                Start progress
              </button>
            )}
            {bug.status !== "REVIEW" && (
              <button
                className="primary"
                onClick={() => update({ status: "REVIEW" })}
              >
                Send to review
              </button>
            )}
          </>
        )}
        {user?.role === "QA" && bug.status === "REVIEW" && (
          <>
            <button
              className="primary"
              onClick={() => update({ status: "CLOSED" })}
            >
              <Check />
              Close bug
            </button>
            <button
              className="secondary"
              onClick={() =>
                update({ status: "OPEN", assigneeId: bug.assigneeId })
              }
            >
              Reject & reopen
            </button>
          </>
        )}
      </div>
      <p className="detail">{bug.description}</p>
      <div className="meta">
        <div>
          <small>Priority</small>
          <br />
          <span className={priorityClass(bug.priority)}>{bug.priority}</span>
        </div>
        <div>
          <small>Status</small>
          <br />
          <span className={statusClass(bug.status)}>
            {bug.status.replace("_", " ")}
          </span>
        </div>
        <div>
          <small>Developer</small>
          <br />
          {bug.assignee?.name || "Unassigned"}
        </div>
        <div>
          <small>Reported by</small>
          <br />
          {bug.creator.name}
        </div>
      </div>
      <a className="text-btn" href={bug.url} target="_blank">
        <ExternalLink size={14} />
        Open reported URL
      </a>
      {bug.screenshot && (
        <>
          <h3>Screenshot</h3>
          <a href={bug.screenshot} target="_blank">
            <img className="screenshot" src={bug.screenshot} />
          </a>
        </>
      )}
      <h3>Activity timeline</h3>
      {bug.activities.map((a: any) => (
        <div className="activity" key={a.id}>
          <b>{a.action}</b>
          <small>
            {a.user.name} · {fmt(a.createdAt)}
          </small>
        </div>
      ))}
      <h3>Comments</h3>
      {bug.comments.map((c: any) => (
        <div className="comment" key={c.id}>
          <small>
            <b>{c.user.name}</b> · {fmt(c.createdAt)}
          </small>
          {c.content}
        </div>
      ))}
      <div className="comment-box">
        <textarea
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Add a permanent comment…"
        />
        <button className="primary" onClick={add}>
          Post
        </button>
      </div>
    </div>
  );
}
function NotFound() {
  return (
    <div className="page">
      <h1>Page not found</h1>
      <p>The page you requested does not exist.</p>
    </div>
  );
}
function App() {
  const [user, setUser] = useState<User | null>(null),
    [ready, setReady] = useState(false);
  useEffect(() => {
    if (!localStorage.getItem("token")) {
      setReady(true);
      return;
    }
    api
      .get("/auth/me")
      .then((r) => setUser(r.data.user))
      .catch(() => {})
      .finally(() => setReady(true));
  }, []);
  if (!ready) return <div className="skeleton-page" />;
  return (
    <Auth.Provider value={{ user, setUser }}>
      <Routes>
        <Route path="/login" element={user ? <Navigate to="/" /> : <Login />} />
        <Route
          path="/*"
          element={user ? <Shell /> : <Navigate to="/login" />}
        />
      </Routes>
      <Toaster position="top-right" />
    </Auth.Provider>
  );
}
createRoot(document.getElementById("root")!).render(
  <BrowserRouter>
    <App />
  </BrowserRouter>,
);
