import { z } from 'zod';

// Raw user schema from API
const RawUserSchema = z.object({
  id: z.string(),
  userName: z.string(),
  name: z.string().optional(),
  type: z.string(),
  isAdmin: z.boolean().optional(),
});

// User schema with derived isAdmin
export const UserSchema = RawUserSchema.transform((user) => ({
  ...user,
  // EspoCRM: admin users have type='admin', or explicit isAdmin=true
  isAdmin: user.isAdmin === true || user.type === 'admin',
}));

export type User = z.infer<typeof UserSchema>;

// Settings schema (tabList is key for navigation)
// Note: API returns null for optional fields, so use .nullish() instead of .optional()
export const SettingsSchema = z.object({
  tabList: z.array(z.union([z.string(), z.object({
    type: z.string(),
    text: z.string().nullish(),
    id: z.string().nullish(),
    iconClass: z.string().nullish(),
    color: z.string().nullish(),
    itemList: z.array(z.string()).optional(),
  })])).optional(),
  quickCreateList: z.array(z.string()).optional(),
  language: z.string().optional(),
  dateFormat: z.string().optional(),
  timeFormat: z.string().optional(),
  timeZone: z.string().optional(),
  weekStart: z.number().optional(),
  thousandSeparator: z.string().optional(),
  decimalMark: z.string().optional(),
  currencyList: z.array(z.string()).optional(),
  defaultCurrency: z.string().optional(),
}).passthrough();

export type Settings = z.infer<typeof SettingsSchema>;

// Preferences schema
export const PreferencesSchema = z.object({
  tabList: z.array(z.string()).optional(),
  useCustomTabList: z.boolean().optional(),
  addCustomTabs: z.boolean().optional(),
  dashboardLayout: z.array(z.unknown()).optional(),
}).passthrough();

export type Preferences = z.infer<typeof PreferencesSchema>;

// Auth data from login response
export const AuthDataSchema = z.object({
  userName: z.string(),
  token: z.string(),
  anotherUser: z.string().nullish(),
});

export type AuthData = z.infer<typeof AuthDataSchema>;

// Auth response from API
export const AuthResponseSchema = z.object({
  user: UserSchema,
  auth: AuthDataSchema.optional(),
  token: z.string().optional(), // Legacy fallback
  acl: z.record(z.unknown()).optional(),
  preferences: PreferencesSchema.optional(),
  settings: SettingsSchema.optional(),
  language: z.string().optional(),
});

export type AuthResponse = z.infer<typeof AuthResponseSchema>;

// Login form data
export const LoginFormSchema = z.object({
  username: z.string().min(1, 'Username is required'),
  password: z.string().min(1, 'Password is required'),
});

export type LoginFormData = z.infer<typeof LoginFormSchema>;

// Auth state
export interface AuthState {
  user: User | null;
  token: string | null;
  acl: Record<string, unknown> | null;
  preferences: Preferences | null;
  settings: Settings | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  error: string | null;
}

// Auth actions
export interface AuthActions {
  login: (username: string, password: string) => Promise<void>;
  logout: () => Promise<void>;
  checkAuth: () => Promise<boolean>;
  clearError: () => void;
}

export type AuthStore = AuthState & AuthActions;
