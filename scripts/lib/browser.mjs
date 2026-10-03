import { existsSync } from "node:fs";
import { chromium } from "playwright";

/** Uses Playwright's Chromium, or a locally installed browser on macOS. */
export async function launchBrowser() {
  try {
    return await chromium.launch();
  } catch (error) {
    const executablePath = [
      "/Applications/Google Chrome.app/Contents/MacOS/Google Chrome",
      "/Applications/Chromium.app/Contents/MacOS/Chromium",
      "/Applications/Microsoft Edge.app/Contents/MacOS/Microsoft Edge",
    ].find((candidate) => existsSync(candidate));
    if (!executablePath) throw error;
    console.warn(
      `Bundled Playwright Chromium failed to launch; retrying with ${executablePath}`,
    );
    return chromium.launch({ executablePath });
  }
}
