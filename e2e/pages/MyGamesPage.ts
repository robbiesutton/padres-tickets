import { Page, expect } from '@playwright/test';

export class MyGamesPage {
  constructor(private page: Page) {}

  list() {
    return this.page.getByTestId('my-games-list');
  }

  browseButton() {
    return this.page.getByTestId('my-games-browse');
  }

  signOutButton() {
    return this.page.getByTestId('my-games-sign-out');
  }

  async assertVisible() {
    await expect(this.list()).toBeVisible();
  }
}
