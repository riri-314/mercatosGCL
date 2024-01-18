import { lazy, Suspense, useEffect, useState } from 'react';
import { Outlet, Navigate, useRoutes } from 'react-router-dom';

import DashboardLayout from '../layouts/dashboard';
import { useAuth } from '../auth/AuthProvider';
import { collection, doc, getDoc } from '@firebase/firestore';
import { db } from '../firebase_config';

export const AccountPage = lazy(() => import('../pages/account'));
export const AdminAccountPage = lazy(() => import('../pages/admin-account'));
export const RulesPage = lazy(() => import('../pages/rules'));
export const ResultPage = lazy(() => import('../pages/results'));
export const LoginPage = lazy(() => import('../pages/login'));
export const ProductsPage = lazy(() => import('../pages/products'));
export const Page404 = lazy(() => import('../pages/page-not-found'));

// ----------------------------------------------------------------------

export default function Router() {
  const [adminMap, setAdminMap] = useState<string[]>([]);

  const user = useAuth();

  // only fetch admin users from db if user is logged in. Anonymous users dont need to know who is admin
  useEffect(() => {
    if (user) {
      const fetchAdminMap = async () => {
        console.log("FETCH ADMIN FROM DB")
        const adminDocRef = doc(collection(db, 'admin'), 'admin');
        const adminDocSnap = await getDoc(adminDocRef);
        if (adminDocSnap.exists()) {
          const admins = adminDocSnap.data()?.admins;
          if (admins) {
            const adminMap: string[] = Object.values(admins);
            setAdminMap(adminMap);
          }
        }
      };

      fetchAdminMap();
    }
  }, [user]);


  function isAdmin(uid: string): boolean {
    console.log("IS ADMIN?")
    return adminMap.includes(uid);
  }

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
        (user? (isAdmin(user.uid) ? { path: 'account', element: <AdminAccountPage /> } : { path: 'account', element: <AccountPage /> }):{ path: 'account', element: <LoginPage /> }),
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
