import path from "node:path";
import { existsSync } from "node:fs";
import { fileURLToPath, pathToFileURL } from "node:url";
import { chromium } from "playwright";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(__dirname, "..");
const htmlPath = path.join(root, "codex_rollout_healthcare.html");
const target = pathToFileURL(htmlPath).href;

const viewports = [
  {
    name: "desktop",
    width: 1440,
    height: 1200,
    screenshot: "/private/tmp/codex-rollout-healthcare-desktop.png"
  },
  {
    name: "mobile",
    width: 390,
    height: 1000,
    screenshot: "/private/tmp/codex-rollout-healthcare-mobile.png"
  }
];

async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const fallbackPaths = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge"
    ];
    const executablePath = fallbackPaths.find((candidate) => existsSync(candidate));

    if (!executablePath) {
      throw error;
    }

    console.warn(
      `Bundled Playwright Chromium failed to launch; retrying with ${executablePath}`
    );
    return chromium.launch({ executablePath });
  }
}

const browser = await launchBrowser();
const failures = [];

for (const viewport of viewports) {
  const page = await browser.newPage({
    viewport: {
      width: viewport.width,
      height: viewport.height
    }
  });

  const consoleErrors = [];
  const pageErrors = [];

  page.on("console", (message) => {
    if (message.type() === "error") {
      consoleErrors.push(message.text());
    }
  });
  page.on("pageerror", (error) => {
    pageErrors.push(error.message);
  });

  await page.goto(target, { waitUntil: "load" });

  const result = await page.evaluate(() => {
    const missingImages = [...document.images]
      .filter((image) => !image.complete || image.naturalWidth === 0)
      .map((image) => image.getAttribute("src"));

    return {
      title: document.title,
      missingImages,
      scrollWidth: document.documentElement.scrollWidth,
      clientWidth: document.documentElement.clientWidth,
      sectionCount: document.querySelectorAll("section").length
    };
  });

  await page.screenshot({
    path: viewport.screenshot,
    fullPage: true
  });

  if (consoleErrors.length > 0) {
    failures.push(`${viewport.name}: console errors: ${consoleErrors.join(" | ")}`);
  }
  if (pageErrors.length > 0) {
    failures.push(`${viewport.name}: page errors: ${pageErrors.join(" | ")}`);
  }
  if (result.missingImages.length > 0) {
    failures.push(`${viewport.name}: missing images: ${result.missingImages.join(", ")}`);
  }
  if (result.scrollWidth > result.clientWidth) {
    failures.push(`${viewport.name}: horizontal overflow ${result.scrollWidth}px > ${result.clientWidth}px`);
  }
  if (result.sectionCount !== 16) {
    failures.push(`${viewport.name}: expected 16 sections, found ${result.sectionCount}`);
  }

  console.log(
    `${viewport.name}: title="${result.title}", sections=${result.sectionCount}, screenshot=${viewport.screenshot}`
  );

  await page.close();
}

await browser.close();

if (failures.length > 0) {
  console.error(failures.join("\n"));
  process.exit(1);
}
