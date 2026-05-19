import { Page, expect } from '@playwright/test';
import { TESTIDS } from '../../src/lib/testids';

export class SharePage {
  constructor(private page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/share/${slug}`);
  }

  gameList() {
    return this.page.getByTestId(TESTIDS.gameList);
  }

  gameCards() {
    return this.page.getByTestId(TESTIDS.gameCard);
  }

  claimButtons() {
    return this.page.getByTestId(TESTIDS.gameCardClaim);
  }

  calendarToggle() {
    return this.page.locator(`[data-testid="${TESTIDS.viewToggleCalendar}"]:visible`);
  }

  listToggle() {
    return this.page.locator(`[data-testid="${TESTIDS.viewToggleList}"]:visible`);
  }

  magicLinkEmailInput() {
    return this.page.getByTestId('magic-link-email');
  }

  magicLinkSubmit() {
    return this.page.getByTestId('magic-link-submit');
  }

  magicLinkSentConfirmation() {
    return this.page.getByTestId('magic-link-sent');
  }

  myGamesList() {
    return this.page.getByTestId('my-games-list');
  }

  myGamesBrowse() {
    return this.page.getByTestId('my-games-browse');
  }

  async assertGameListVisible() {
    await expect(this.gameList()).toBeVisible();
  }
}
