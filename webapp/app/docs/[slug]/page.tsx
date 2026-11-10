import path from "node:path";
import { promises as fs } from "node:fs";
import { notFound } from "next/navigation";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { t } from "@/lib/i18n";
import { localeForRequest } from "@/lib/locale-server";

type DocConfig = {
  title: string;
  file?: string;
  fallback?: string;
};

const DOCS: Record<string, DocConfig> = {
  architecture: { title: "Architecture", file: "architecture.md" },
  hardware: { title: "Hardware", file: "hardware.md" },
  bom: { title: "Hardware BOM", file: "bom.md" },
  assembly: { title: "Assembly Guide", file: "assembly.md" },
  website: { title: "Website Guide", file: "website.md" },
  "mobile-app": { title: "Mobile App Guide", file: "mobile-app.md" },
  flash: { title: "Web Flasher", file: "flash.md" },
  "button-controls": { title: "Button Controls", file: "button-controls.md" },
  "api-key": { title: "Configure API Key", file: "api-key.md" },
  config: { title: "Web Configuration", file: "config.md" },
  deploy: { title: "Local Deployment", file: "deploy.md" },
  "custom-mode-dev": { title: "Custom Mode Development", file: "custom-mode-dev.md" },
  "api-reference": { title: "API Reference", file: "api.md" },
  faq: { title: "FAQ", file: "faq.md" },
  "voice-mode": { title: "AI Voice Module", file: "voice-mode.md" },
};

async function readDocMarkdown(fileName: string, locale: "zh" | "en"): Promise<string | null> {
  try {
    const filePath = locale === "en"
      ? path.resolve(process.cwd(), "..", "docs", "en", fileName)
      : path.resolve(process.cwd(), "..", "docs", fileName);
    return await fs.readFile(filePath, "utf-8");
  } catch {
    if (locale === "en") {
      try {
        const zhPath = path.resolve(process.cwd(), "..", "docs", fileName);
        return await fs.readFile(zhPath, "utf-8");
      } catch {
        return null;
      }
    }
    return null;
  }
}

export default async function DocSlugPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  const { slug } = await params;
  const cfg = DOCS[slug];
  if (!cfg) notFound();
  const locale = await localeForRequest();

  const markdown = cfg.file ? await readDocMarkdown(cfg.file, locale) : null;
  const content =
    markdown ||
    cfg.fallback ||
    `# ${cfg.title}\n\n${t(locale, "docs.fallbackTitle")}.`;

  return (
    <article className="docs-prose">
      <ReactMarkdown remarkPlugins={[remarkGfm]}>
        {content}
      </ReactMarkdown>
    </article>
  );
}
