/* eslint-disable perfectionist/sort-imports */
//import "src/App.css";


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
