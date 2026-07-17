import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

async function main() {
  const qa = await prisma.user.findFirst({ where: { role: "QA" }, orderBy: { id: "asc" } });
  if (!qa) throw new Error("No QA user exists.");
  await prisma.bug.create({
    data: {
      name: "Enterprise page content redirects to SaaS ITSM on returning session",
      description: "When a user exits an Enterprise page in the first session and returns in a later session, the URL/page content mismatches and routes directly to the SaaS ITSM experience. Check all Enterprise and SaaS pages, especially Enterprise IT Asset Management, Enterprise ITSM, and Enterprise IT Ops Management.",
      url: "https://infraon.io/enterprise/itsm-tool",
      screenshot: "/uploads/enterprise-session-content-mismatch.png",
      fixType: "BUG",
      status: "OPEN",
      creatorId: qa.id,
    },
  });
  console.log("Created enterprise session content mismatch bug.");
}

main().finally(() => prisma.$disconnect());
