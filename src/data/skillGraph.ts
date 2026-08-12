export const EXAMPLE_SEARCHES = [
  "n8n Automation",
  "AI Automation",
  "AI Chatbot",
  "WhatsApp Bot",
  "Telegram Bot",
  "Lead Generation",
  "CRM Automation",
  "Google Sheets Automation",
  "Python",
  "Data Analysis",
  "Machine Learning",
  "Web Development",
  "3D Website",
  "React",
  "WordPress",
  "SEO",
  "Graphic Design",
  "Video Editing",
];

/** Semantic expansions used for AI Smart Search (not just exact keywords). */
export const SKILL_GRAPH: Record<string, string[]> = {
  "n8n": [
    "n8n",
    "workflow automation",
    "business automation",
    "crm automation",
    "api integration",
    "ai agent",
    "whatsapp automation",
    "google sheets automation",
    "telegram automation",
    "zapier",
    "make.com",
    "integromat",
    "no-code automation",
    "low-code",
    "webhook",
    "etl",
  ],
  "n8n automation": [
    "n8n",
    "workflow automation",
    "business automation",
    "crm automation",
    "api integration",
    "ai agent",
    "whatsapp automation",
    "google sheets automation",
    "telegram automation",
    "zapier alternative",
    "process automation",
  ],
  "ai automation": [
    "ai automation",
    "workflow automation",
    "ai agent",
    "llm",
    "openai",
    "langchain",
    "autogpt",
    "rpa",
    "intelligent automation",
    "business process automation",
    "n8n",
    "zapier",
  ],
  "ai chatbot": [
    "ai chatbot",
    "ai customer support",
    "ai assistant",
    "whatsapp ai bot",
    "telegram ai bot",
    "website chatbot",
    "customer service automation",
    "conversational ai",
    "gpt chatbot",
    "rag chatbot",
    "helpdesk bot",
    "intercom",
    "dialogflow",
  ],
  "whatsapp bot": [
    "whatsapp bot",
    "whatsapp automation",
    "whatsapp api",
    "whatsapp business",
    "twilio",
    "chatbot",
    "customer support",
    "broadcast",
    "waba",
  ],
  "telegram bot": [
    "telegram bot",
    "telegram automation",
    "telegram api",
    "chatbot",
    "bot father",
    "notifications bot",
  ],
  "lead generation": [
    "lead generation",
    "lead gen",
    "outbound",
    "cold email",
    "prospecting",
    "b2b leads",
    "linkedin outreach",
    "appointment setting",
    "sales pipeline",
    "apollo",
    "clay",
  ],
  "crm automation": [
    "crm automation",
    "hubspot",
    "salesforce",
    "zoho crm",
    "pipedrive",
    "workflow",
    "lead routing",
    "n8n",
    "zapier",
  ],
  "google sheets automation": [
    "google sheets",
    "apps script",
    "spreadsheet automation",
    "airtable",
    "excel automation",
    "n8n",
    "zapier",
    "data pipeline",
  ],
  python: [
    "python",
    "django",
    "flask",
    "fastapi",
    "pandas",
    "scripting",
    "backend",
    "automation",
    "data analysis",
    "machine learning",
  ],
  "data analysis": [
    "data analysis",
    "data analyst",
    "excel",
    "sql",
    "tableau",
    "power bi",
    "pandas",
    "looker",
    "reporting",
    "dashboard",
  ],
  "machine learning": [
    "machine learning",
    "ml",
    "deep learning",
    "tensorflow",
    "pytorch",
    "scikit-learn",
    "nlp",
    "computer vision",
    "model training",
    "ai",
  ],
  "web development": [
    "web development",
    "frontend",
    "backend",
    "fullstack",
    "javascript",
    "typescript",
    "react",
    "next.js",
    "node",
    "website",
    "landing page",
  ],
  "3d website": [
    "3d website",
    "three.js",
    "webgl",
    "spline",
    "r3f",
    "react three fiber",
    "interactive website",
    "3d landing",
    "webgpu",
    "gsap",
  ],
  react: [
    "react",
    "next.js",
    "typescript",
    "frontend",
    "spa",
    "react native",
    "redux",
    "tailwind",
  ],
  wordpress: [
    "wordpress",
    "woocommerce",
    "elementor",
    "php",
    "cms",
    "wordpress plugin",
    "wordpress theme",
  ],
  seo: [
    "seo",
    "search engine optimization",
    "technical seo",
    "on-page seo",
    "content strategy",
    "ahrefs",
    "backlinks",
    "keyword research",
  ],
  "graphic design": [
    "graphic design",
    "branding",
    "logo",
    "figma",
    "illustration",
    "adobe illustrator",
    "photoshop",
    "visual identity",
  ],
  "video editing": [
    "video editing",
    "premiere pro",
    "after effects",
    "davinci resolve",
    "motion graphics",
    "short form",
    "youtube editor",
    "reels",
  ],
};

export function tokenizeQuery(raw: string): string[] {
  return raw
    .split(/[+,|/]| and /gi)
    .map((part) => part.trim().toLowerCase())
    .filter(Boolean);
}

export function expandQuery(raw: string): string[] {
  const tokens = tokenizeQuery(raw);
  const expanded = new Set<string>();
  for (const token of tokens) {
    expanded.add(token);
    const direct = SKILL_GRAPH[token];
    if (direct) direct.forEach((t) => expanded.add(t.toLowerCase()));
    for (const [key, values] of Object.entries(SKILL_GRAPH)) {
      if (token.includes(key) || key.includes(token)) {
        values.forEach((t) => expanded.add(t.toLowerCase()));
      }
    }
  }
  return [...expanded];
}

export function splitSkills(raw: string): string[] {
  return tokenizeQuery(raw).map((s) =>
    s
      .split(" ")
      .map((w) => (w.length ? w[0].toUpperCase() + w.slice(1) : w))
      .join(" "),
  );
}
