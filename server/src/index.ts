import express from "express";
import cors from "cors";
import multer from "multer";
import path from "path";
import fs from "fs";
import jwt from "jsonwebtoken";
import { PrismaClient } from "@prisma/client";
type Role = "QA" | "DEVELOPER";
import "dotenv/config";
const prisma = new PrismaClient(),
  app = express(),
  secret = process.env.JWT_SECRET || "secret";
const uploads = path.resolve("uploads");
fs.mkdirSync(uploads, { recursive: true });
app.use(cors({ origin: process.env.CLIENT_URL || true }));
app.use(express.json());
app.use("/uploads", express.static(uploads));
const storage = multer.diskStorage({
  destination: uploads,
  filename: (_, f, cb) =>
    cb(
      null,
      `${Date.now()}-${Math.random().toString(36).slice(2)}${path.extname(f.originalname)}`,
    ),
});
const upload = multer({
  storage,
  fileFilter: (_, f, cb) => cb(null, /image\/(jpeg|png|webp)/.test(f.mimetype)),
  limits: { fileSize: 5 * 1024 * 1024 },
});
type AuthReq = express.Request & {
  user?: { id: number; role: Role; name: string };
};
const auth = (
  req: AuthReq,
  res: express.Response,
  next: express.NextFunction,
) => {
  try {
    req.user = jwt.verify(
      (req.headers.authorization || "").replace("Bearer ", ""),
      secret,
    ) as AuthReq["user"];
    next();
  } catch {
    res.status(401).json({ message: "Authentication required" });
  }
};
const qa = (req: AuthReq, res: express.Response, next: express.NextFunction) =>
  req.user?.role === "QA"
    ? next()
    : res.status(403).json({ message: "QA access required" });
const notify = async (userId: number, message: string, bugId: number) =>
  prisma.notification.create({ data: { userId, message, bugId } });
const activity = async (
  bugId: number,
  userId: number,
  action: string,
  details?: string,
) => prisma.activityLog.create({ data: { bugId, userId, action, details } });
app.post("/api/auth/login", async (req, res) => {
  const { name, password } = req.body;
  const user = await prisma.user.findUnique({ where: { name } });
  if (!user || user.password !== password)
    return res.status(401).json({ message: "Invalid name or password" });
  const token = jwt.sign(
    { id: user.id, role: user.role, name: user.name },
    secret,
    { expiresIn: "7d" },
  );
  res.json({ token, user: { id: user.id, name: user.name, role: user.role } });
});
app.get("/api/auth/me", auth, async (req: AuthReq, res) =>
  res.json({ user: req.user }),
);
app.get("/api/users", auth, async (_, res) =>
  res.json(
    await prisma.user.findMany({
      select: { id: true, name: true, role: true },
    }),
  ),
);
app.post("/api/upload", auth, upload.single("screenshot"), (req, res) => {
  if (!req.file)
    return res
      .status(400)
      .json({ message: "A jpg, jpeg, png, or webp image is required" });
  res.status(201).json({ url: `/uploads/${req.file.filename}` });
});
app.get("/api/bugs", auth, async (req: AuthReq, res) => {
  const q = req.query,
    where: any = {};
  if (req.user!.role === "DEVELOPER")
    where.OR = [{ assigneeId: req.user!.id }, { status: "OPEN" }];
  if (q.search)
    where.OR = [
      { name: { contains: String(q.search) } },
      { description: { contains: String(q.search) } },
    ];
  for (const k of ["status", "fixType"]) if (q[k]) where[k] = q[k];
  if (q.developer) where.assigneeId = Number(q.developer);
  if (q.qa) where.creatorId = Number(q.qa);
  if (q.from || q.to)
    where.createdAt = {
      ...(q.from ? { gte: new Date(String(q.from)) } : {}),
      ...(q.to ? { lte: new Date(String(q.to) + "T23:59:59") } : {}),
    };
  const page = Math.max(1, Number(q.page) || 1),
    limit = Math.min(100, Number(q.limit) || 10),
    sort = String(q.sort || "updatedAt"),
    order = q.order === "asc" ? "asc" : "desc";
  const [items, total] = await Promise.all([
    prisma.bug.findMany({
      where,
      include: {
        creator: { select: { id: true, name: true } },
        assignee: { select: { id: true, name: true } },
      },
      orderBy: { [sort]: order },
      skip: (page - 1) * limit,
      take: limit,
    }),
    prisma.bug.count({ where }),
  ]);
  res.json({ items, total, page, limit });
});
app.get("/api/bugs/:id", auth, async (req: AuthReq, res) => {
  const bug = await prisma.bug.findUnique({
    where: { id: +req.params.id },
    include: {
      creator: { select: { id: true, name: true } },
      assignee: { select: { id: true, name: true } },
      comments: {
        include: { user: { select: { name: true, role: true } } },
        orderBy: { createdAt: "asc" },
      },
      activities: {
        include: { user: { select: { name: true } } },
        orderBy: { createdAt: "asc" },
      },
    },
  });
  if (
    !bug ||
    (req.user!.role === "DEVELOPER" && bug.assigneeId !== req.user!.id)
  )
    return res.status(404).json({ message: "Bug not found" });
  res.json(bug);
});
app.post("/api/bugs", auth, qa, async (req: AuthReq, res) => {
  const { name, description, url, screenshot, fixType } = req.body;
  if (!name || !description || !url || !fixType || !/^https?:\/\//i.test(url))
    return res
      .status(400)
      .json({
        message:
          "Name, description, valid URL, and fix type are required",
      });
  const bug = await prisma.bug.create({
    data: {
      name,
      description,
      url,
      screenshot,
      fixType,
      creatorId: req.user!.id,
      status: "OPEN",
    },
    include: { assignee: true, creator: true },
  });
  await activity(bug.id, req.user!.id, "Bug created");
  res.status(201).json(bug);
});
app.patch("/api/bugs/:id", auth, async (req: AuthReq, res) => {
  const id = +req.params.id,
    old = await prisma.bug.findUnique({ where: { id } });
  if (!old) return res.status(404).json({ message: "Bug not found" });
  const body = req.body;
  if (req.user!.role === "DEVELOPER") {
    const takingOpenBug = old.status === "OPEN" && body.status === "ASSIGNED";
    if (!takingOpenBug && old.assigneeId !== req.user!.id)
      return res
        .status(403)
        .json({ message: "Only your assigned bugs can be updated" });
    if (!body.status || !["ASSIGNED", "IN_PROGRESS", "REVIEW"].includes(body.status))
      return res
        .status(403)
        .json({ message: "Developers can move bugs to In Progress or Review" });
    if (old.status === "CLOSED")
      return res.status(400).json({ message: "Closed bugs cannot be changed" });
  }
  const data: any = {};
  for (const k of ["name", "description", "url", "screenshot", "fixType"])
    if (body[k] !== undefined) data[k] = body[k];
  if (req.user!.role === "QA" && body.assigneeId) {
    data.assigneeId = +body.assigneeId;
    data.status = "ASSIGNED";
  }
  if (
    body.status &&
    req.user!.role === "QA" &&
    ["OPEN", "CLOSED"].includes(body.status)
  )
    data.status = body.status;
  if (body.status && req.user!.role === "DEVELOPER") data.status = body.status;
  if (req.user!.role === "DEVELOPER" && old.status === "OPEN" && body.status === "ASSIGNED")
    data.assigneeId = req.user!.id;
  const bug = await prisma.bug.update({
    where: { id },
    data,
    include: { assignee: true },
  });
  if (data.status && data.status !== old.status) {
    const labels: any = {
      ASSIGNED: "Took ownership of this bug",
      IN_PROGRESS: "Moved to In Progress",
      REVIEW: "Moved to Review",
      OPEN: "Rejected by QA",
      CLOSED: "Closed",
    };
    await activity(
      id,
      req.user!.id,
      labels[data.status] || `Status changed to ${data.status}`,
    );
    if (data.status === "REVIEW")
      await notify(old.creatorId, `Bug #${id} is ready for your review`, id);
  }
  if (data.assigneeId && data.assigneeId !== old.assigneeId) {
    await activity(id, req.user!.id, `Assigned to ${bug.assignee?.name}`);
    await notify(data.assigneeId, `You were assigned bug #${id}`, id);
  }
  res.json(bug);
});
app.delete("/api/bugs/:id", auth, qa, async (req: AuthReq, res) => {
  const b = await prisma.bug.findUnique({ where: { id: +req.params.id } });
  if (!b) return res.status(404).json({ message: "Bug not found" });
  await prisma.bug.delete({ where: { id: b.id } });
  res.status(204).end();
});
app.post("/api/bugs/:id/comments", auth, async (req: AuthReq, res) => {
  const b = await prisma.bug.findUnique({ where: { id: +req.params.id } });
  if (!b || (req.user!.role === "DEVELOPER" && b.assigneeId !== req.user!.id))
    return res.status(404).json({ message: "Bug not found" });
  if (!String(req.body.content || "").trim())
    return res.status(400).json({ message: "Comment cannot be empty" });
  const c = await prisma.comment.create({
    data: {
      bugId: b.id,
      userId: req.user!.id,
      content: req.body.content.trim(),
    },
    include: { user: { select: { name: true, role: true } } },
  });
  await activity(b.id, req.user!.id, "Added a comment");
  res.status(201).json(c);
});
app.get("/api/notifications", auth, async (req: AuthReq, res) =>
  res.json(
    await prisma.notification.findMany({
      where: { userId: req.user!.id },
      orderBy: { createdAt: "desc" },
      take: 30,
    }),
  ),
);
app.patch("/api/notifications/read", auth, async (req: AuthReq, res) => {
  await prisma.notification.updateMany({
    where: { userId: req.user!.id, read: false },
    data: { read: true },
  });
  res.json({ ok: true });
});
app.get("/api/dashboard", auth, async (req: AuthReq, res) => {
  const where: any =
    req.user!.role === "DEVELOPER" ? { assigneeId: req.user!.id } : {};
  const bugs = await prisma.bug.findMany({
    where,
    select: {
      status: true,
      fixType: true,
      createdAt: true,
      assignee: { select: { name: true } },
    },
  });
  const statuses = ["OPEN", "ASSIGNED", "IN_PROGRESS", "REVIEW", "CLOSED"];
  const counts = Object.fromEntries(
    statuses.map((s) => [s, bugs.filter((b) => b.status === s).length]),
  );
  const week = Array.from({ length: 7 }, (_, i) => {
    const d = new Date();
    d.setDate(d.getDate() - 6 + i);
    return {
      day: d.toLocaleDateString("en", { weekday: "short" }),
      count: bugs.filter((b) => b.createdAt.toDateString() === d.toDateString())
        .length,
    };
  });
  const workload =
    req.user!.role === "QA"
      ? await prisma.user
          .findMany({
            where: { role: "DEVELOPER" },
            include: { bugsAssigned: { where: { status: { not: "CLOSED" } } } },
          })
          .then((x) =>
            x.map((u) => ({ name: u.name, count: u.bugsAssigned.length })),
          )
      : [];
  res.json({
    counts,
    total: bugs.length,
    critical: bugs.filter((b) => b.fixType === "BUG").length,
    fixType: ["BUG", "NEW_FEATURE"].map((name) => ({
      name,
      count: bugs.filter((b) => b.fixType === name).length,
    })),
    status: statuses.map((name) => ({ name, count: counts[name] })),
    week,
    workload,
    recent: await prisma.activityLog.findMany({
      where:
        req.user!.role === "DEVELOPER"
          ? { bug: { assigneeId: req.user!.id } }
          : {},
      include: {
        user: { select: { name: true } },
        bug: { select: { name: true } },
      },
      orderBy: { createdAt: "desc" },
      take: 6,
    }),
  });
});
app.listen(Number(process.env.PORT) || 4000, () =>
  console.log("API on http://localhost:4000"),
);
