/* eslint-disable perfectionist/sort-imports */
//import "global.css";

import { AuthProvider } from "./auth/AuthProvider";
import Router from "./routes/sections";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from "./theme";
import { DataProvider } from "./data/DataProvider";

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <DataProvider>
      <AuthProvider>
        <ThemeProvider>
          <Router />
        </ThemeProvider>
      </AuthProvider>
    </DataProvider>
  );
}
