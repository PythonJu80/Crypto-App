import { chromium } from 'playwright';
import configManager from '../../config/config-manager.js';

describe('Trading Flow E2E Tests', () => {
  let browser;
  let page;
  const APP_URL = process.env.APP_URL || 'http://localhost:8080';

  beforeAll(async () => {
    browser = await chromium.launch();
  });

  afterAll(async () => {
    await browser.close();
  });

  beforeEach(async () => {
    page = await browser.newPage();
    await page.goto(APP_URL);
  });

  afterEach(async () => {
    await page.close();
  });

  describe('Market Data Display', () => {
    it('should display real-time price updates', async () => {
      await page.waitForSelector('[data-testid="price-btcusdt"]');
      const initialPrice = await page.textContent('[data-testid="price-btcusdt"]');
      
      // Wait for price update
      await page.waitForTimeout(5000);
      const updatedPrice = await page.textContent('[data-testid="price-btcusdt"]');
      
      expect(initialPrice).not.toBe(updatedPrice);
    });

    it('should update order book in real-time', async () => {
      await page.waitForSelector('[data-testid="order-book"]');
      const orderBook = await page.$$('[data-testid="order-book-row"]');
      expect(orderBook.length).toBeGreaterThan(0);
    });
  });

  describe('Trading Functionality', () => {
    beforeEach(async () => {
      // Login before testing trading functionality
      await page.fill('[data-testid="email-input"]', process.env.TEST_USER_EMAIL);
      await page.fill('[data-testid="password-input"]', process.env.TEST_USER_PASSWORD);
      await page.click('[data-testid="login-button"]');
      await page.waitForSelector('[data-testid="trading-view"]');
    });

    it('should place a market buy order', async () => {
      await page.selectOption('[data-testid="order-type"]', 'market');
      await page.fill('[data-testid="order-amount"]', '0.001');
      await page.click('[data-testid="buy-button"]');

      await page.waitForSelector('[data-testid="order-success"]');
      const successMessage = await page.textContent('[data-testid="order-success"]');
      expect(successMessage).toContain('Order executed successfully');
    });

    it('should place a limit sell order', async () => {
      await page.selectOption('[data-testid="order-type"]', 'limit');
      await page.fill('[data-testid="order-amount"]', '0.001');
      await page.fill('[data-testid="limit-price"]', '50000');
      await page.click('[data-testid="sell-button"]');

      await page.waitForSelector('[data-testid="order-success"]');
      const successMessage = await page.textContent('[data-testid="order-success"]');
      expect(successMessage).toContain('Limit order placed successfully');
    });
  });

  describe('Portfolio View', () => {
    it('should display portfolio balance and assets', async () => {
      await page.click('[data-testid="portfolio-tab"]');
      await page.waitForSelector('[data-testid="portfolio-balance"]');

      const balance = await page.textContent('[data-testid="portfolio-balance"]');
      expect(parseFloat(balance)).toBeGreaterThan(0);

      const assets = await page.$$('[data-testid="asset-row"]');
      expect(assets.length).toBeGreaterThan(0);
    });

    it('should update portfolio values in real-time', async () => {
      await page.click('[data-testid="portfolio-tab"]');
      await page.waitForSelector('[data-testid="total-value"]');
      
      const initialValue = await page.textContent('[data-testid="total-value"]');
      await page.waitForTimeout(5000);
      const updatedValue = await page.textContent('[data-testid="total-value"]');
      
      expect(initialValue).not.toBe(updatedValue);
    });
  });

  describe('Error Handling', () => {
    it('should display error message for insufficient funds', async () => {
      await page.selectOption('[data-testid="order-type"]', 'market');
      await page.fill('[data-testid="order-amount"]', '999999');
      await page.click('[data-testid="buy-button"]');

      await page.waitForSelector('[data-testid="error-message"]');
      const errorMessage = await page.textContent('[data-testid="error-message"]');
      expect(errorMessage).toContain('Insufficient funds');
    });

    it('should handle network disconnection gracefully', async () => {
      await page.setOfflineMode(true);
      await page.waitForSelector('[data-testid="connection-status"]');
      
      const status = await page.textContent('[data-testid="connection-status"]');
      expect(status).toContain('Offline');

      // Verify reconnection attempt
      await page.setOfflineMode(false);
      await page.waitForSelector('[data-testid="connection-status"]');
      const reconnectedStatus = await page.textContent('[data-testid="connection-status"]');
      expect(reconnectedStatus).toContain('Connected');
    });
  });
});
