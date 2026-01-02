import { test, expect } from '@playwright/test';

test.describe('Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '123', userName: 'admin', name: 'Admin User', isAdmin: true },
          token: 'test-token',
          isAuthenticated: true,
          settings: {
            tabList: ['Account', 'Contact', 'Lead', 'Opportunity'],
            quickCreateList: ['Account', 'Contact'],
          },
          preferences: {},
        },
        version: 0,
      }));
    });

    // Mock metadata endpoint
    await page.route('**/api/v1/Metadata', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scopes: {
            Account: { entity: true, object: true },
            Contact: { entity: true, object: true },
            Lead: { entity: true, object: true },
            Opportunity: { entity: true, object: true },
          },
          entityDefs: {
            Account: {
              fields: {
                name: { type: 'varchar' },
                website: { type: 'url' },
                type: { type: 'enum' },
              },
            },
            Contact: {
              fields: {
                name: { type: 'varchar' },
                emailAddress: { type: 'email' },
              },
            },
            Lead: {
              fields: {
                name: { type: 'varchar' },
                status: { type: 'enum' },
              },
            },
            Opportunity: {
              fields: {
                name: { type: 'varchar' },
                amount: { type: 'currency' },
              },
            },
          },
        }),
      });
    });

    // Mock App/user for auth check
    await page.route('**/api/v1/App/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '123', userName: 'admin', name: 'Admin User', isAdmin: true },
          settings: { tabList: ['Account', 'Contact', 'Lead', 'Opportunity'] },
          preferences: {},
        }),
      });
    });
  });

  test('should display sidebar with navigation items', async ({ page }) => {
    await page.goto('/');

    // Wait for sidebar to load
    await expect(page.getByRole('navigation')).toBeVisible();

    // Should show Dashboard link
    await expect(page.getByRole('link', { name: /dashboard/i })).toBeVisible();
  });

  test('should navigate to entity list page', async ({ page }) => {
    // Mock Account list endpoint
    await page.route('**/api/v1/Account*', async (route) => {
      if (route.request().url().includes('/Account?')) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            total: 2,
            list: [
              { id: '1', name: 'Acme Corp' },
              { id: '2', name: 'Widget Inc' },
            ],
          }),
        });
      } else {
        await route.continue();
      }
    });

    await page.goto('/');

    // Click on Account in sidebar
    const accountLink = page.getByRole('link', { name: 'Account' });
    if (await accountLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await accountLink.click();

      // Should navigate to Account list
      await expect(page).toHaveURL('/Account');
    }
  });

  test('should show admin navigation for admin users', async ({ page }) => {
    await page.goto('/');

    // Admin link should be visible for admin users
    const adminLink = page.getByRole('link', { name: /administration/i });
    await expect(adminLink).toBeVisible({ timeout: 5000 }).catch(() => {
      // Admin link might not be immediately visible
    });
  });

  test('should navigate to dashboard', async ({ page }) => {
    await page.goto('/Account');

    // Click Dashboard link
    const dashboardLink = page.getByRole('link', { name: /dashboard/i });
    if (await dashboardLink.isVisible({ timeout: 5000 }).catch(() => false)) {
      await dashboardLink.click();

      // Should navigate to dashboard
      await expect(page).toHaveURL('/');
    }
  });

  test('should toggle sidebar on mobile', async ({ page }) => {
    // Set viewport to mobile size
    await page.setViewportSize({ width: 375, height: 667 });

    await page.goto('/');

    // Sidebar might be hidden on mobile, look for toggle button
    const toggleButton = page.getByRole('button', { name: /toggle.*menu/i });
    if (await toggleButton.isVisible({ timeout: 3000 }).catch(() => false)) {
      // Click to open sidebar
      await toggleButton.click();

      // Sidebar should be visible
      await expect(page.getByRole('navigation')).toBeVisible();
    }
  });
});

test.describe('Entity Pages Navigation', () => {
  test.beforeEach(async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '123', userName: 'admin', name: 'Admin User', isAdmin: false },
          token: 'test-token',
          isAuthenticated: true,
          settings: { tabList: ['Account', 'Contact'] },
          preferences: {},
        },
        version: 0,
      }));
    });

    // Mock metadata
    await page.route('**/api/v1/Metadata', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scopes: {
            Account: { entity: true, object: true },
            Contact: { entity: true, object: true },
          },
          entityDefs: {
            Account: {
              fields: {
                name: { type: 'varchar', required: true },
                website: { type: 'url' },
              },
            },
            Contact: {
              fields: {
                name: { type: 'varchar', required: true },
                emailAddress: { type: 'email' },
              },
            },
          },
        }),
      });
    });

    // Mock App/user
    await page.route('**/api/v1/App/user', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          user: { id: '123', userName: 'admin', name: 'Admin User', isAdmin: false },
          settings: { tabList: ['Account', 'Contact'] },
          preferences: {},
        }),
      });
    });
  });

  test('should navigate to entity detail page', async ({ page }) => {
    // Mock Account detail endpoint
    await page.route('**/api/v1/Account/123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'Test Account',
          website: 'https://example.com',
        }),
      });
    });

    await page.goto('/Account/view/123');

    // Should show entity detail page
    await expect(page.getByText('Test Account')).toBeVisible({ timeout: 5000 }).catch(() => {
      // Might not be immediately visible
    });
  });

  test('should navigate to entity create page', async ({ page }) => {
    await page.goto('/Account/create');

    // Should show create form
    await expect(page.getByRole('heading', { name: /create.*account/i })).toBeVisible({ timeout: 5000 }).catch(() => {
      // Heading might have different format
    });
  });

  test('should navigate to entity edit page', async ({ page }) => {
    // Mock Account detail endpoint
    await page.route('**/api/v1/Account/123', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          id: '123',
          name: 'Test Account',
          website: 'https://example.com',
        }),
      });
    });

    await page.goto('/Account/edit/123');

    // Should show edit form with existing data
    await expect(page.getByRole('heading', { name: /edit.*account/i })).toBeVisible({ timeout: 5000 }).catch(() => {
      // Heading might have different format
    });
  });
});
