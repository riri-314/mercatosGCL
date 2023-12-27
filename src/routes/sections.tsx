import { lazy, Suspense } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from '../layouts/dashboard';
import { useAuth } from '../auth/AuthProvider';

export const AccountPage = lazy(() => import('../pages/account'));
export const AdminAccountPage = lazy(() => import('../pages/admin-account'));
export const RulesPage = lazy(() => import('../pages/rules'));
export const ResultPage = lazy(() => import('../pages/results'));
export const LoginPage = lazy(() => import('../pages/login'));
export const ProductsPage = lazy(() => import('../pages/products'));
export const Page404 = lazy(() => import('../pages/page-not-found'));

// ----------------------------------------------------------------------

export default function Router() {
  const user = useAuth();

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
        { element: <ResultPage />, index: true },
        { path: 'comitards', element: <ProductsPage /> },
        (user? (user?.uid == "06G0ZndofgTwTNl6nVniAhtaFX03"? { path: 'account', element: <AdminAccountPage /> } : { path: 'account', element: <AccountPage /> }):{ path: 'account', element: <LoginPage /> }),
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
      path: '*',
      element: <Navigate to="/404" replace />,
    },
  ]);

  return routes;
}
