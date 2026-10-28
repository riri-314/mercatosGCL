import Box, { type BoxProps } from "@mui/material/Box";
import { HEADER, NAV } from "./config-layout";

export default function Main({ children, sx, ...other }: BoxProps) {
  return (
    <Box
      component="main"
      id="main-content"
      tabIndex={-1}
      sx={{
        flexGrow: 1,
        minWidth: 0,
        minHeight: "calc(100dvh - var(--cercle-session-banner-height, 0px))",
        display: "flex",
        flexDirection: "column",
        pt: {
          xs: `${HEADER.H_MOBILE + 24}px`,
          lg: `${HEADER.H_DESKTOP + 32}px`,
        },
        pb: { xs: "calc(92px + env(safe-area-inset-bottom, 0px))", sm: 4 },
        px: { xs: 2, sm: 3, lg: 4.5 },
        width: { lg: `calc(100% - ${NAV.WIDTH}px)` },
        "& > .MuiContainer-root": { px: 0 },
        ...sx,
      }}
      {...other}
    >
      {children}
    </Box>
  );
}
