import { PrismaClient } from "@prisma/client";

const prisma = new PrismaClient();

const tasks = [
  ["Update llms.txt", "Update the llms.txt content for https://infraon.io/llms.txt.", "https://infraon.io/llms.txt", "BUG"],
  ["Mobile menu does not scroll down", "The menu does not scroll down on mobile on both the ITSM and Asset landing pages.", "https://infraon.io/itsm-tool", "BUG"],
  ["Mobile form icon does not scroll to form", "Clicking the referenced icon on mobile does not scroll to the form on both ITSM and Asset landing pages.", "https://infraon.io/itsm-tool", "BUG"],
  ["Update title and description — IT Ops", "Title: ITOps Tool | AI-Powered IT Operations Management Tool. Description: Simplify IT with Infraon Infinity — an AI-driven ITOps tool and IT operations management tool that automates monitoring, boosts uptime, and streamlines workflows.", "https://infraon.io/it-ops-management", "BUG"],
  ["Update title and description — IT Asset Management", "Title: IT Asset Management Software | Infraon ITAM Tool. Description: Cut IT costs and stay audit-ready with Infraon's IT asset management software — a smart ITAM tool that automates asset tracking, licensing, and compliance.", "https://infraon.io/it-asset-management", "BUG"],
  ["Update title and description — ITSM", "Title: ITSM Tool | AI-Enabled ITSM Software by Infraon. Description: Infraon's ITSM software auto-routes tickets, builds knowledge bases, and enforces SLA escalations — an AI-powered ITSM tool that speeds up IT service delivery.", "https://infraon.io/itsm-tool", "BUG"],
  ["Update title and description — Enterprise ITSM", "Title: Enterprise IT Management Software | IT Service Management. Description: Infraon's enterprise IT management software delivers GenAI-powered IT service management — automating incidents, changes, and requests for faster resolutions.", "https://infraon.io/enterprise/itsm-tool", "BUG"],
  ["Update title and description — Enterprise IT Asset Management", "Title: Enterprise Asset Management Software | Infraon EAM. Description: Manage the full asset lifecycle with Infraon's enterprise asset management software — AI-driven EAM software that automates compliance and cuts downtime.", "https://infraon.io/enterprise/it-asset-management", "BUG"],
  ["Add ITSM SaaS page use case", "Add the use case from the provided ITSM document. Get Nusaif's help if needed.", "https://infraon.io/itsm-tool", "NEW_FEATURE"],
  ["Check table alignment for all blogs", "Check and correct table alignment across all blogs listed in the provided spreadsheet.", "https://ivory-sonja-49.tiiny.site/", "BUG"],
  ["Expand CMDB FAQ question", "Change the CMDB question to: What is a Configuration Management Database (CMDB) and why is it important for IT teams?", "https://infraon.io/it-asset-management", "BUG"],
  ["Expand Incident Management FAQ question", "Change the question to: What is incident management and how does it differ from problem management in ITIL?", "https://infraon.io/itsm-tool", "BUG"],
  ["Add IT Ops SaaS page use case", "Add a use case to the IT Ops SaaS page. Get Nusaif's help if needed.", "https://infraon.io/it-ops-management", "NEW_FEATURE"],
  ["Add IT Asset SaaS page use case", "Add the IT Asset use case from the provided SharePoint document. Get Nusaif's help if needed.", "https://infraon.io/it-asset-management", "NEW_FEATURE"],
] as const;

async function main() {
  const qa = await prisma.user.findFirst({ where: { role: "QA" }, orderBy: { id: "asc" } });
  if (!qa) throw new Error("No QA user exists. Run the seed script first.");
  await prisma.bug.createMany({ data: tasks.map(([name, description, url, fixType]) => ({ name, description, url, fixType, creatorId: qa.id, status: "OPEN" })) });
  console.log(`Created ${tasks.length} Open bugs for ${qa.name}.`);
}

main().finally(() => prisma.$disconnect());
