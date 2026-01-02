import { Suspense, lazy } from 'react';
import { Routes, Route } from 'react-router-dom';
import { MainLayout } from '@/components/layout/MainLayout';
import { ProtectedRoute } from '@/components/common/ProtectedRoute';
import { LoadingSpinner } from '@/components/common/LoadingSpinner';

// Lazy load pages
const LoginPage = lazy(() => import('@/features/auth/pages/LoginPage'));
const DashboardPage = lazy(() => import('@/features/dashboard/DashboardPage'));
const EntityListPage = lazy(
  () => import('@/features/entities/pages/EntityListPage')
);
const EntityDetailPage = lazy(
  () => import('@/features/entities/pages/EntityDetailPage')
);
const EntityCreatePage = lazy(
  () => import('@/features/entities/pages/EntityCreatePage')
);
const EntityEditPage = lazy(
  () => import('@/features/entities/pages/EntityEditPage')
);

// Admin pages
const AdminLayout = lazy(
  () => import('@/features/admin/components/AdminLayout')
);
const AdminProtectedRoute = lazy(
  () => import('@/features/admin/components/AdminProtectedRoute')
);
const AdminIndexPage = lazy(
  () => import('@/features/admin/pages/AdminIndexPage')
);

// System admin pages
const SettingsPage = lazy(
  () => import('@/features/admin/pages/system/SettingsPage')
);
const UserInterfacePage = lazy(
  () => import('@/features/admin/pages/system/UserInterfacePage')
);
const AuthenticationPage = lazy(
  () => import('@/features/admin/pages/system/AuthenticationPage')
);
const CurrencyPage = lazy(
  () => import('@/features/admin/pages/system/CurrencyPage')
);
const NotificationsPage = lazy(
  () => import('@/features/admin/pages/system/NotificationsPage')
);
const ScheduledJobsPage = lazy(
  () => import('@/features/admin/pages/system/ScheduledJobsPage')
);
const ClearCachePage = lazy(
  () => import('@/features/admin/pages/system/ClearCachePage')
);
const RebuildPage = lazy(
  () => import('@/features/admin/pages/system/RebuildPage')
);

// Users admin pages
const UsersListPage = lazy(
  () => import('@/features/admin/pages/users/UsersListPage')
);
const TeamsListPage = lazy(
  () => import('@/features/admin/pages/users/TeamsListPage')
);
const RolesListPage = lazy(
  () => import('@/features/admin/pages/users/RolesListPage')
);
const RoleDetailPage = lazy(
  () => import('@/features/admin/pages/users/RoleDetailPage')
);
const AuthLogPage = lazy(
  () => import('@/features/admin/pages/users/AuthLogPage')
);
const AuthTokensPage = lazy(
  () => import('@/features/admin/pages/users/AuthTokensPage')
);
const ApiUsersPage = lazy(
  () => import('@/features/admin/pages/users/ApiUsersPage')
);

// Customization admin pages
const EntityManagerPage = lazy(
  () => import('@/features/admin/pages/customization/EntityManagerPage')
);
const EntityManagerScopePage = lazy(
  () => import('@/features/admin/pages/customization/EntityManagerScopePage')
);
const AdminEntityCreatePage = lazy(
  () => import('@/features/admin/pages/customization/EntityCreatePage')
);
const AdminEntityEditPage = lazy(
  () => import('@/features/admin/pages/customization/EntityEditPage')
);
const FieldManagerPage = lazy(
  () => import('@/features/admin/pages/customization/FieldManagerPage')
);
const FieldAddPage = lazy(
  () => import('@/features/admin/pages/customization/FieldAddPage')
);
const AdminFieldEditPage = lazy(
  () => import('@/features/admin/pages/customization/FieldEditPage')
);
const LayoutsIndexPage = lazy(
  () => import('@/features/admin/pages/customization/LayoutsIndexPage')
);
const LayoutManagerPage = lazy(
  () => import('@/features/admin/pages/customization/LayoutManagerPage')
);
const LayoutEditorPage = lazy(
  () => import('@/features/admin/pages/customization/LayoutEditorPage')
);
const LabelManagerPage = lazy(
  () => import('@/features/admin/pages/customization/LabelManagerPage')
);
const TemplateManagerPage = lazy(
  () => import('@/features/admin/pages/customization/TemplateManagerPage')
);

// Messaging admin pages
const OutboundEmailsPage = lazy(
  () => import('@/features/admin/pages/messaging/OutboundEmailsPage')
);
const InboundEmailsPage = lazy(
  () => import('@/features/admin/pages/messaging/InboundEmailsPage')
);
const EmailTemplatesPage = lazy(
  () => import('@/features/admin/pages/messaging/EmailTemplatesPage')
);
const SmsPage = lazy(
  () => import('@/features/admin/pages/messaging/SmsPage')
);

// Portal admin pages
const PortalsPage = lazy(
  () => import('@/features/admin/pages/portal/PortalsPage')
);
const PortalUsersPage = lazy(
  () => import('@/features/admin/pages/portal/PortalUsersPage')
);
const PortalRolesPage = lazy(
  () => import('@/features/admin/pages/portal/PortalRolesPage')
);

// Data admin pages
const ImportPage = lazy(
  () => import('@/features/admin/pages/data/ImportPage')
);
const AttachmentsPage = lazy(
  () => import('@/features/admin/pages/data/AttachmentsPage')
);
const JobsPage = lazy(
  () => import('@/features/admin/pages/data/JobsPage')
);
const WebhooksPage = lazy(
  () => import('@/features/admin/pages/data/WebhooksPage')
);
const LeadCapturePage = lazy(
  () => import('@/features/admin/pages/data/LeadCapturePage')
);
const LeadCaptureDetailPage = lazy(
  () => import('@/features/admin/pages/data/LeadCaptureDetailPage')
);
const LeadCaptureCreatePage = lazy(
  () => import('@/features/admin/pages/data/LeadCaptureCreatePage')
);

// Public pages (no auth required)
const LeadCaptureFormPage = lazy(
  () => import('@/features/public/pages/LeadCaptureFormPage')
);

function PageLoader(): React.ReactElement {
  return (
    <div className="flex items-center justify-center min-h-[50vh]">
      <LoadingSpinner size="lg" />
    </div>
  );
}

function App(): React.ReactElement {
  return (
    <Routes>
      {/* Public routes */}
      <Route
        path="/login"
        element={
          <Suspense fallback={<PageLoader />}>
            <LoginPage />
          </Suspense>
        }
      />
      <Route
        path="/lead-capture/:formId"
        element={
          <Suspense fallback={<PageLoader />}>
            <LeadCaptureFormPage />
          </Suspense>
        }
      />

      {/* Protected routes */}
      <Route
        path="/"
        element={
          <ProtectedRoute>
            <MainLayout />
          </ProtectedRoute>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <DashboardPage />
            </Suspense>
          }
        />

        {/* Entity routes - must be in specific order */}
        <Route
          path=":entityType/create"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityCreatePage />
            </Suspense>
          }
        />
        <Route
          path=":entityType/view/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityDetailPage />
            </Suspense>
          }
        />
        <Route
          path=":entityType/edit/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityEditPage />
            </Suspense>
          }
        />
        <Route
          path=":entityType"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityListPage />
            </Suspense>
          }
        />
      </Route>

      {/* Admin routes */}
      <Route
        path="/Admin"
        element={
          <Suspense fallback={<PageLoader />}>
            <AdminProtectedRoute>
              <AdminLayout />
            </AdminProtectedRoute>
          </Suspense>
        }
      >
        <Route
          index
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminIndexPage />
            </Suspense>
          }
        />
        {/* System routes */}
        <Route
          path="settings"
          element={
            <Suspense fallback={<PageLoader />}>
              <SettingsPage />
            </Suspense>
          }
        />
        <Route
          path="userInterface"
          element={
            <Suspense fallback={<PageLoader />}>
              <UserInterfacePage />
            </Suspense>
          }
        />
        <Route
          path="authentication"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthenticationPage />
            </Suspense>
          }
        />
        <Route
          path="currency"
          element={
            <Suspense fallback={<PageLoader />}>
              <CurrencyPage />
            </Suspense>
          }
        />
        <Route
          path="notifications"
          element={
            <Suspense fallback={<PageLoader />}>
              <NotificationsPage />
            </Suspense>
          }
        />
        <Route
          path="scheduledJobs"
          element={
            <Suspense fallback={<PageLoader />}>
              <ScheduledJobsPage />
            </Suspense>
          }
        />
        <Route
          path="clearCache"
          element={
            <Suspense fallback={<PageLoader />}>
              <ClearCachePage />
            </Suspense>
          }
        />
        <Route
          path="rebuild"
          element={
            <Suspense fallback={<PageLoader />}>
              <RebuildPage />
            </Suspense>
          }
        />
        {/* Users routes */}
        <Route
          path="users"
          element={
            <Suspense fallback={<PageLoader />}>
              <UsersListPage />
            </Suspense>
          }
        />
        <Route
          path="teams"
          element={
            <Suspense fallback={<PageLoader />}>
              <TeamsListPage />
            </Suspense>
          }
        />
        <Route
          path="roles"
          element={
            <Suspense fallback={<PageLoader />}>
              <RolesListPage />
            </Suspense>
          }
        />
        <Route
          path="roles/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <RoleDetailPage />
            </Suspense>
          }
        />
        <Route
          path="authLog"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthLogPage />
            </Suspense>
          }
        />
        <Route
          path="authTokens"
          element={
            <Suspense fallback={<PageLoader />}>
              <AuthTokensPage />
            </Suspense>
          }
        />
        <Route
          path="apiUsers"
          element={
            <Suspense fallback={<PageLoader />}>
              <ApiUsersPage />
            </Suspense>
          }
        />
        {/* Customization routes */}
        <Route
          path="entityManager"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityManagerPage />
            </Suspense>
          }
        />
        <Route
          path="entityManager/create"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminEntityCreatePage />
            </Suspense>
          }
        />
        <Route
          path="entityManager/scope/:scope"
          element={
            <Suspense fallback={<PageLoader />}>
              <EntityManagerScopePage />
            </Suspense>
          }
        />
        <Route
          path="entityManager/scope/:scope/edit"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminEntityEditPage />
            </Suspense>
          }
        />
        {/* Field Manager routes */}
        <Route
          path="fieldManager"
          element={
            <Suspense fallback={<PageLoader />}>
              <FieldManagerPage />
            </Suspense>
          }
        />
        <Route
          path="fieldManager/scope/:scope"
          element={
            <Suspense fallback={<PageLoader />}>
              <FieldManagerPage />
            </Suspense>
          }
        />
        <Route
          path="fieldManager/scope/:scope/add"
          element={
            <Suspense fallback={<PageLoader />}>
              <FieldAddPage />
            </Suspense>
          }
        />
        <Route
          path="fieldManager/scope/:scope/field/:field"
          element={
            <Suspense fallback={<PageLoader />}>
              <AdminFieldEditPage />
            </Suspense>
          }
        />
        {/* Layout Manager routes */}
        <Route
          path="layouts"
          element={
            <Suspense fallback={<PageLoader />}>
              <LayoutsIndexPage />
            </Suspense>
          }
        />
        <Route
          path="layouts/scope/:scope"
          element={
            <Suspense fallback={<PageLoader />}>
              <LayoutManagerPage />
            </Suspense>
          }
        />
        <Route
          path="layouts/scope/:scope/type/:type"
          element={
            <Suspense fallback={<PageLoader />}>
              <LayoutEditorPage />
            </Suspense>
          }
        />
        {/* Label Manager route */}
        <Route
          path="labelManager"
          element={
            <Suspense fallback={<PageLoader />}>
              <LabelManagerPage />
            </Suspense>
          }
        />
        {/* Template Manager route */}
        <Route
          path="templateManager"
          element={
            <Suspense fallback={<PageLoader />}>
              <TemplateManagerPage />
            </Suspense>
          }
        />
        {/* Messaging routes */}
        <Route
          path="outboundEmails"
          element={
            <Suspense fallback={<PageLoader />}>
              <OutboundEmailsPage />
            </Suspense>
          }
        />
        <Route
          path="inboundEmails"
          element={
            <Suspense fallback={<PageLoader />}>
              <InboundEmailsPage />
            </Suspense>
          }
        />
        <Route
          path="emailTemplates"
          element={
            <Suspense fallback={<PageLoader />}>
              <EmailTemplatesPage />
            </Suspense>
          }
        />
        <Route
          path="sms"
          element={
            <Suspense fallback={<PageLoader />}>
              <SmsPage />
            </Suspense>
          }
        />
        {/* Portal routes */}
        <Route
          path="portals"
          element={
            <Suspense fallback={<PageLoader />}>
              <PortalsPage />
            </Suspense>
          }
        />
        <Route
          path="portalUsers"
          element={
            <Suspense fallback={<PageLoader />}>
              <PortalUsersPage />
            </Suspense>
          }
        />
        <Route
          path="portalRoles"
          element={
            <Suspense fallback={<PageLoader />}>
              <PortalRolesPage />
            </Suspense>
          }
        />
        {/* Data routes */}
        <Route
          path="import"
          element={
            <Suspense fallback={<PageLoader />}>
              <ImportPage />
            </Suspense>
          }
        />
        <Route
          path="attachments"
          element={
            <Suspense fallback={<PageLoader />}>
              <AttachmentsPage />
            </Suspense>
          }
        />
        <Route
          path="jobs"
          element={
            <Suspense fallback={<PageLoader />}>
              <JobsPage />
            </Suspense>
          }
        />
        <Route
          path="webhooks"
          element={
            <Suspense fallback={<PageLoader />}>
              <WebhooksPage />
            </Suspense>
          }
        />
        {/* Lead Capture routes */}
        <Route
          path="leadCapture"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeadCapturePage />
            </Suspense>
          }
        />
        <Route
          path="leadCapture/create"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeadCaptureCreatePage />
            </Suspense>
          }
        />
        <Route
          path="leadCapture/:id"
          element={
            <Suspense fallback={<PageLoader />}>
              <LeadCaptureDetailPage />
            </Suspense>
          }
        />
      </Route>
    </Routes>
  );
}

export default App;
