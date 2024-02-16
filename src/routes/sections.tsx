import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from '../layouts/dashboard';
import { useAuth } from '../auth/AuthProvider';
import WipPage from "../pages/work-in-progress.tsx";
import {Portal} from "@mui/material";

export const AccountPage = lazy(() => import('../pages/account'));
export const AdminAccountPage = lazy(() => import('../pages/admin-account'));
export const RulesPage = lazy(() => import('../pages/rules'));
export const ResultPage = lazy(() => import('../pages/results'));
export const LoginPage = lazy(() => import('../pages/login'));
export const ComitardsPage = lazy(() => import('../pages/comitards-page.tsx'));
export const Page404 = lazy(() => import('../pages/page-not-found'));

// ----------------------------------------------------------------------

export default function Router() {

  const { user, isAdmin } = useAuth();

  const routes = useRoutes([
    {
      element: (
        <DashboardLayout>
          <Suspense>
            <Outlet />
          </Suspense>
        </DashboardLayout>
      ),
      children: [
        { element: <WipPage />, index: true },
        /*{ element: <ResultPage />, index: true },*/
        { path: 'comitards', element: <ComitardsPage /> },
        (user? (isAdmin() ? { path: 'account', element: <AdminAccountPage /> } : { path: 'account', element: <AccountPage /> }):{ path: 'account', element: <LoginPage /> }),
        { path: 'rules', element: <RulesPage /> },
      ],
    },
    {
      path: 'login',
      element: <LoginPage />,
    },
    {
      path: '404',
      element: <Page404 />,
    },
      {
      path: 'wip',
      element: <WipPage />,
    },
    {
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
