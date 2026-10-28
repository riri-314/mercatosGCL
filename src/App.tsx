import { Suspense } from "react";
import { AuthProvider } from "./auth/AuthProvider";
import { useAuth } from "./auth/auth-context";
import Router from "./routes/sections";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from "./theme";
import { DataProvider } from "./data/DataProvider";
import Loading from "./sections/loading/loading";
import Box from "@mui/material/Box";
import CercleSessionBanner from "./auth/cercle-session-banner";
import "./App.css";

// ----------------------------------------------------------------------

function AppContent() {
  const { user, loading } = useAuth();

  if (loading) {
    return <Loading fullScreen />;
  }

  return (
    <>
      <CercleSessionBanner />
      <Box sx={{ pt: "var(--cercle-session-banner-height, 0px)" }}>
        <DataProvider key={user?.uid ?? "visitor"}>
          <Suspense fallback={<Loading fullScreen />}>
            <Router />
          </Suspense>
        </DataProvider>
      </Box>
    </>
  );
}

export default function App() {
  useScrollToTop();

  return (
    <AuthProvider>
      <ThemeProvider>
        <AppContent />
      </ThemeProvider>
    </AuthProvider>
  );
}
