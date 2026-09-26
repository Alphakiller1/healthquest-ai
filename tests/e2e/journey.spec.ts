import { expect, test } from "@playwright/test";

test("adult can onboard, log, learn, export, see an emergency screen, and delete", async ({ page }) => {
  const email = `audit-${Date.now()}@example.com`;
  await page.goto("/login");
  await page.getByLabel("Email").fill(email);
  await page.getByRole("button", { name: "Continue in demo" }).click();
  // Onboarding: the full "Make it mine" path, one question per screen, most of it skippable.
  await expect(page.getByRole("heading", { name: "Let's set up HealthQuest for you" })).toBeVisible();
  await page.getByRole("button", { name: /Make it mine/ }).click();
  await page.getByLabel("Birth date").fill("1990-01-15");
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("checkbox", { name: "Understand how meals fit what I want to learn" }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  await page.getByRole("radio", { name: /^Some days/ }).check();
  await page.getByRole("button", { name: "Continue" }).click();
  // Skip sleep, food, health topics, family history, and smoking.
  for (let skipped = 0; skipped < 5; skipped += 1) await page.getByRole("button", { name: "Skip" }).click();
  await page.getByRole("button", { name: "Continue" }).click();
  // The review shows the effect of the answers before anything is saved.
  await expect(page.getByRole("heading", { name: "Here's how HealthQuest will work for you" })).toBeVisible();
  await expect(page.getByText("2 sessions a week")).toBeVisible();
  await page.getByRole("checkbox", { name: /third-party AI provider/ }).check();
  await page.getByRole("checkbox", { name: /store the health and wellness/ }).check();
  await page.getByRole("checkbox", { name: /privacy commitment/ }).check();
  await page.getByRole("checkbox", { name: /not medical advice/ }).check();
  await page.getByRole("button", { name: "Begin my HealthQuest" }).click();
  await expect(page.getByRole("heading", { level: 1, name: /^Good (morning|afternoon|evening)/ })).toBeVisible();
  await expect(page.getByRole("list", { name: /This week/ })).toBeVisible();
  // The shell lives in the root layout; it must show the tabs right after onboarding, without a reload.
  await expect(page.locator(".hq-tabbar").getByRole("link", { name: "Now" })).toBeVisible();

  await page.goto("/journal");
  await page.getByRole("textbox", { name: "Food", exact: true }).fill("rolled oats");
  await page.getByRole("button", { name: "Find nutrition match" }).click();
  await expect(
    page.getByText(/FoodData Central|Sample data, not USDA|nutrition service is busy|No confident nutrition match/).first(),
  ).toBeVisible();

  await page.getByRole("textbox", { name: "Food", exact: true }).fill("beans");
  await page.getByLabel("Approximate cost, optional").fill("2");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(page.getByRole("heading", { name: "Saved" })).toBeVisible();

  await page.goto("/move");
  await page.getByLabel("Activity").fill("walk");
  await page.getByLabel("Minutes").fill("15");
  await page.getByRole("radio", { name: "easy" }).check();
  await page.getByRole("button", { name: "Save movement" }).click();
  await expect(page.getByText("10 XP")).toBeVisible();

  // Free text anywhere goes through the emergency check, including the activity name.
  await page.goto("/move");
  await page.getByLabel("Activity").fill("I cant breathe and my chest hurts");
  await page.getByLabel("Minutes").fill("5");
  await page.getByRole("radio", { name: "easy" }).check();
  await page.getByRole("button", { name: "Save movement" }).click();
  await expect(page.getByRole("link", { name: "Call 911" })).toBeVisible();

  await page.goto("/learn/food-labels");
  await page.getByRole("radio", { name: "The serving size listed" }).check();
  await page.getByRole("button", { name: "Save lesson" }).click();
  await expect(page.getByText("Quiz recorded")).toBeVisible();
  // Sources sit one layer down unless the detail level opens them; either way they are one tap away.
  const fdaLink = page.getByRole("link", { name: /FDA/ });
  if (!(await fdaLink.isVisible())) await page.getByText(/^Sources \(\d+\)/).click();
  await expect(fdaLink).toBeVisible();

  await page.goto("/quests");
  await expect(page.getByText("Completed this week").first()).toBeVisible();

  await page.goto("/settings");
  await page.getByRole("checkbox", { name: /Plain language/ }).check();
  await page.getByRole("button", { name: "Save preferences" }).click();
  await expect(page.getByText("Preferences saved.")).toBeVisible();
  await expect(page.getByText("Zero Data Retention is not enabled.")).toBeVisible();

  const download = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("link", { name: "Export my data" }).click(),
  ]);
  expect(download[0].suggestedFilename()).toContain("healthquest-export");

  await page.goto("/journal");
  await page.getByRole("textbox", { name: "Food", exact: true }).fill("I can't breathe");
  await page.getByRole("button", { name: "Save meal" }).click();
  await expect(page.getByRole("link", { name: "Call 911" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Saved" })).toHaveCount(0);

  await page.goto("/settings");
  await page.getByLabel("Confirmation").fill("DELETE");
  await page.getByRole("button", { name: "Delete my account and data" }).click();
  await expect(page.getByRole("heading", { name: /Learn one useful thing/ })).toBeVisible();
});
