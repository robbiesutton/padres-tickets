import { Page, expect } from '@playwright/test';
import { TESTIDS } from '../../src/lib/testids';

export class PackageBuilderPage {
  constructor(private page: Page) {}

  async goto() {
    await this.page.goto('/packages/new');
  }

  step1Continue() {
    return this.page.getByTestId(TESTIDS.packageStep1Continue);
  }

  step2Continue() {
    return this.page.getByTestId(TESTIDS.packageStep2Continue);
  }

  step3Finish() {
    return this.page.getByTestId(TESTIDS.packageStep3Finish);
  }

  async assertOnStep(n: 1 | 2 | 3) {
    // Step indicator text exists in the sidebar
    await expect(this.page.locator(`text=Step ${n}`).first()).toBeVisible();
  }
}
