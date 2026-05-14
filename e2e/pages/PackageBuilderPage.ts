import { Page, expect } from '@playwright/test';

export class PackageBuilderPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/packages/new');
  }

  step1Continue() {
    return this.page.getByTestId('package-step1-continue');
  }

  step2Continue() {
    return this.page.getByTestId('package-step2-continue');
  }

  step3Finish() {
    return this.page.getByTestId('package-step3-finish');
  }

  async assertOnStep(n: 1 | 2 | 3) {
    // Step indicator text exists in the sidebar
    await expect(this.page.locator(`text=Step ${n}`).first()).toBeVisible();
  }
}
