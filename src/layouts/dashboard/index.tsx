import { useState } from "react";
import PropTypes from "prop-types";
import type { ReactNode } from "react";

import Box from "@mui/material/Box";

import Header from "./header";
import Nav from "./nav";
import Main from "./main";
import MobileNav from "./mobile-nav";

// ----------------------------------------------------------------------

export default function DashboardLayout({ children }: { children: ReactNode }) {
  const [openNav, setOpenNav] = useState(false);

  return (
    <>
      <Box
        component="a"
        href="#main-content"
        sx={{
          position: "fixed",
          top: -60,
          left: 16,
          zIndex: 1500,
          p: 1.5,
          bgcolor: "primary.lighter",
          color: "text.primary",
          borderRadius: 1,
          "&:focus": { top: "calc(var(--cercle-session-banner-height, 0px) + 12px)" },
        }}
      >
        Aller au contenu
      </Box>
      <Header onOpenNav={() => setOpenNav(true)} />

      <Box
        sx={{
          minHeight: 1,
          display: "flex",
          flexDirection: { xs: "column", lg: "row" },
        }}
      >
        <Nav openNav={openNav} onCloseNav={() => setOpenNav(false)} />

        <Main>{children}</Main>
      </Box>
      <MobileNav />
    </>
  );
}

DashboardLayout.propTypes = {
  children: PropTypes.node,
};
