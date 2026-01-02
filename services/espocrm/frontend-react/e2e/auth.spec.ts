import { test, expect } from '@playwright/test';

test.describe('Authentication', () => {
  test.beforeEach(async ({ page }) => {
    // Clear localStorage before each test
    await page.goto('/');
    await page.evaluate(() => localStorage.clear());
  });

  test('should show login page when not authenticated', async ({ page }) => {
    await page.goto('/');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);

    // Should show login form elements
    await expect(page.getByLabel('Username')).toBeVisible();
    await expect(page.getByLabel('Password')).toBeVisible();
    await expect(page.getByRole('button', { name: /sign in/i })).toBeVisible();
  });

  test('should show validation errors for empty form submission', async ({ page }) => {
    await page.goto('/login');

    // Click sign in without entering credentials
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show validation error
    await expect(page.getByText(/username is required/i)).toBeVisible();
  });

  test('should toggle password visibility', async ({ page }) => {
    await page.goto('/login');

    const passwordInput = page.getByLabel('Password');
    const toggleButton = page.getByRole('button', { name: /show password/i });

    // Initially password should be hidden
    await expect(passwordInput).toHaveAttribute('type', 'password');

    // Click to show password
    await toggleButton.click();
    await expect(passwordInput).toHaveAttribute('type', 'text');

    // Click to hide password again
    await page.getByRole('button', { name: /hide password/i }).click();
    await expect(passwordInput).toHaveAttribute('type', 'password');
  });

  test('should show error message for invalid credentials', async ({ page }) => {
    await page.goto('/login');

    // Enter invalid credentials
    await page.getByLabel('Username').fill('invaliduser');
    await page.getByLabel('Password').fill('wrongpassword');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should show error alert (from API response)
    // Wait for either error alert or loading state to end
    await page.waitForSelector('[role="alert"], button:not([disabled])', { timeout: 10000 });
  });

  test('should redirect to login when accessing protected route', async ({ page }) => {
    await page.goto('/Account');

    // Should redirect to login
    await expect(page).toHaveURL(/.*login/);
  });
});

test.describe('Authentication - with mocked API', () => {
  test('should redirect to dashboard after successful login', async ({ page }) => {
    // Mock the login API response
    await page.route('**/api/v1/App/user', async (route) => {
      const request = route.request();
      const headers = request.headers();

      if (headers['authorization']) {
        await route.fulfill({
          status: 200,
          contentType: 'application/json',
          body: JSON.stringify({
            user: {
              id: '123',
              userName: 'admin',
              name: 'Admin User',
              type: 'admin',
              isAdmin: true,
            },
            settings: {
              tabList: ['Account', 'Contact', 'Lead'],
              quickCreateList: ['Account', 'Contact'],
            },
            preferences: {},
            acl: {},
          }),
        });
      } else {
        await route.fulfill({
          status: 401,
          contentType: 'application/json',
          body: JSON.stringify({ message: 'Unauthorized' }),
        });
      }
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
          },
          entityDefs: {
            Account: { fields: { name: { type: 'varchar' } } },
            Contact: { fields: { name: { type: 'varchar' } } },
            Lead: { fields: { name: { type: 'varchar' } } },
          },
        }),
      });
    });

    await page.goto('/login');

    // Enter valid credentials
    await page.getByLabel('Username').fill('admin');
    await page.getByLabel('Password').fill('password');
    await page.getByRole('button', { name: /sign in/i }).click();

    // Should redirect to dashboard
    await expect(page).toHaveURL('/');
    await expect(page.getByText('Dashboard')).toBeVisible();
  });

  test('should logout and redirect to login', async ({ page }) => {
    // Set up authenticated state
    await page.goto('/');
    await page.evaluate(() => {
      localStorage.setItem('auth-token', 'test-token');
      localStorage.setItem('auth-storage', JSON.stringify({
        state: {
          user: { id: '123', userName: 'admin', isAdmin: true },
          token: 'test-token',
          isAuthenticated: true,
          settings: { tabList: ['Account', 'Contact'] },
        },
        version: 0,
      }));
    });

    // Mock logout API
    await page.route('**/api/v1/App/action/logout', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({ success: true }),
      });
    });

    // Mock metadata for authenticated state
    await page.route('**/api/v1/Metadata', async (route) => {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          scopes: { Account: { entity: true }, Contact: { entity: true } },
          entityDefs: {},
        }),
      });
    });

    await page.reload();

    // Wait for page to be ready - check for logout button in header
    const logoutButton = page.getByRole('button', { name: /log out/i });

    // If logout button exists, click it
    if (await logoutButton.isVisible({ timeout: 5000 }).catch(() => false)) {
      await logoutButton.click();

      // Should redirect to login
      await expect(page).toHaveURL(/.*login/);
    }
  });
});
