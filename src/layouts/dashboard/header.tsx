import {
  AppBar,
  Box,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { NAV, HEADER } from "./config-layout";
import AccountPopover from "./common/account-popover";
import { useAuth } from "../../auth/auth-context";
import ClubIcon from "../../components/club-icon/club-icon";
import Logo from "../../components/logo/logo";

export default function Header({ onOpenNav }: { onOpenNav: () => void }) {
  const { user } = useAuth();
  return (
    <AppBar
      sx={{
        boxShadow: "none",
        top: "var(--cercle-session-banner-height, 0px)",
        height: { xs: HEADER.H_MOBILE, lg: HEADER.H_DESKTOP },
        width: { lg: `calc(100% - ${NAV.WIDTH}px)` },
        bgcolor: "rgba(249,250,251,.94)",
        color: "text.primary",
        backdropFilter: "blur(16px)",
        borderBottom: "1px solid",
        borderColor: "divider",
      }}
    >
      <Toolbar sx={{ height: 1, px: { xs: 2, sm: 3, lg: 4.5 }, gap: 1.5 }}>
        <IconButton
          onClick={onOpenNav}
          aria-label="Ouvrir le menu"
          sx={{
            display: { xs: "none", sm: "inline-flex", lg: "none" },
            minWidth: 44,
            minHeight: 44,
          }}
        >
          <ClubIcon name="menu" />
        </IconButton>
        <Box sx={{ display: { xs: "flex", lg: "none" } }}>
          <Logo size={40} />
        </Box>
        <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
          <Box component="span" sx={{ display: { xs: "inline", sm: "none" } }}>
            Mercatos
          </Box>
          <Box component="span" sx={{ display: { xs: "none", sm: "inline" } }}>
            Mercatos GCL
          </Box>
        </Typography>
        <Box sx={{ flexGrow: 1 }} />
        {user && <AccountPopover />}
      </Toolbar>
    </AppBar>
  );
}
