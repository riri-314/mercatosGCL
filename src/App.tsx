/* eslint-disable perfectionist/sort-imports */
//import "global.css";

import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Router from "./routes/sections";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from "./theme";
import { DataProvider } from "./data/DataProvider";
import Loading from "./sections/loading/loading";

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  const AppContent = () => {
    const { loading } = useAuth();

    if (loading) {
      return <Loading />;
    }

    return (
      <DataProvider>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </DataProvider>
    );
  };

  return (
    <AuthProvider>
      <AppContent />
    </AuthProvider>
  );
}
