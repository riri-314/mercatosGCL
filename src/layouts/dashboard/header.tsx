import {
  AppBar,
  Box,
  Button,
  Chip,
  IconButton,
  Toolbar,
  Typography,
} from "@mui/material";
import { NAV, HEADER } from "./config-layout";
import AccountPopover from "./common/account-popover";
import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import { getEditionData } from "../../data/edition-data";
import RouterLink from "../../routes/components/router-link";
import ClubIcon from "../../components/club-icon/club-icon";
import Logo from "../../components/logo/logo";

export default function Header({ onOpenNav }: any) {
  const { user } = useAuth();
  const { data } = useData();
  const edition = getEditionData(data)?.edition;
  return (
    <AppBar
      sx={{
        boxShadow: "none",
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
        {edition != null && (
          <Chip
            label={`Édition ${edition}`}
            size="small"
            variant="outlined"
            sx={{
              display: { xs: "none", md: "flex" },
              fontSize: 12,
              borderColor: "divider",
              mr: 1,
            }}
          />
        )}
        {user ? (
          <AccountPopover />
        ) : (
          <Button
            component={RouterLink}
            href="/login"
            variant="contained"
            size="small"
            sx={{ minHeight: 44 }}
          >
            Connexion
          </Button>
        )}
      </Toolbar>
    </AppBar>
  );
}
