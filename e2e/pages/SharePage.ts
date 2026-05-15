import { Page, expect } from '@playwright/test';

export class SharePage {
  constructor(private page: Page) {}

  async goto(slug: string) {
    await this.page.goto(`/share/${slug}`);
  }

  gameList() {
    return this.page.getByTestId('game-list');
  }

  gameCards() {
    return this.page.getByTestId('game-card');
  }

  claimButtons() {
    return this.page.getByTestId('game-card-claim');
  }

  releaseButtons() {
    return this.page.getByTestId('game-card-release');
  }

  calendarToggle() {
    return this.page.getByTestId('view-toggle-calendar');
  }

  listToggle() {
    return this.page.getByTestId('view-toggle-list');
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
