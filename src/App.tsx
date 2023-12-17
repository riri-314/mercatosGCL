/* eslint-disable perfectionist/sort-imports */
//import "global.css";


import { AuthProvider } from "./auth/AuthProvider";
import Router from "./routes/sections";
import { useScrollToTop } from "./hooks/use-scroll-to-top";
import ThemeProvider from "./theme";

// ----------------------------------------------------------------------

export default function App() {
  useScrollToTop();

  return (
    <AuthProvider>
      <ThemeProvider>
        <Router />
      </ThemeProvider>
    </AuthProvider>
  );
}
