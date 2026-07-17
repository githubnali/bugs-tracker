import { PrismaClient } from "@prisma/client";
const p = new PrismaClient();
async function main() {
  await p.notification.deleteMany();
  await p.activityLog.deleteMany();
  await p.comment.deleteMany();
  await p.bug.deleteMany();
  await p.user.deleteMany();
  const [vinith, sai, nagaraju, suraj] = await Promise.all(
    [
      ["Vinith", "QA"],
      ["Sai Teja", "QA"],
      ["Nagaraju", "DEVELOPER"],
      ["Suraj", "DEVELOPER"],
    ].map(([name, role]) =>
      p.user.create({
        data: { name, role: role as any, password: "bugtracker123" },
      }),
    ),
  );
  const b = await p.bug.create({
    data: {
      name: "Login button is unresponsive",
      description:
        "The login button does not respond after entering valid credentials on Safari.",
      url: "https://example.com/login",
      fixType: "BUG",
      status: "IN_PROGRESS",
      creatorId: vinith.id,
      assigneeId: nagaraju.id,
    },
  });
  await p.activityLog.createMany({
    data: [
      { bugId: b.id, userId: vinith.id, action: "Bug created" },
      { bugId: b.id, userId: vinith.id, action: "Assigned to Nagaraju" },
      { bugId: b.id, userId: nagaraju.id, action: "Moved to In Progress" },
    ],
  });
  await p.bug.create({
    data: {
      name: "Dashboard count alignment",
      description: "Critical bug count wraps incorrectly on tablet screens.",
      url: "https://example.com/dashboard",
      fixType: "NEW_FEATURE",
      status: "ASSIGNED",
      creatorId: sai.id,
      assigneeId: suraj.id,
    },
  });
  console.log("Seeded. Password for every user: bugtracker123");
}
main().finally(() => p.$disconnect());
