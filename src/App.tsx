import { Suspense } from "react";
import { AuthProvider, useAuth } from "./auth/AuthProvider";
import Router from "./routes/sections";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from "./theme";
import { DataProvider } from "./data/DataProvider";
import Loading from "./sections/loading/loading";
import "./App.css";

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  const AppContent = () => {
    const { loading } = useAuth();

    if (loading) {
      return <Loading fullScreen />;
    }

    return (
      <DataProvider>
        <Suspense fallback={<Loading fullScreen />}>
          <Router />
        </Suspense>
      </DataProvider>
    );
  };

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
