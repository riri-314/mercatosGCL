import { useEffect } from "react";
import {
  Box,
  Button,
  Drawer,
  IconButton,
  LinearProgress,
  ListItemButton,
  Stack,
  Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";
import { NAV } from "./config-layout";
import { useAuth } from "../../auth/AuthProvider";
import { useData } from "../../data/DataProvider";
import { getEditionData } from "../../data/edition-data";
import { usePathname } from "../../routes/hooks/use-pathname";
import RouterLink from "../../routes/components/router-link";
import Logo from "../../components/logo/logo";
import ClubIcon from "../../components/club-icon/club-icon";

export default function Nav({ openNav, onCloseNav }: any) {
  const pathname = usePathname();
  const { user, isAdmin } = useAuth();
  const { data } = useData();
  const upLg = useMediaQuery(useTheme().breakpoints.up("lg"));
  const edition = getEditionData(data);
  const balance = user ? (edition?.cercles?.[user.uid]?.nbFut ?? 0) : 0;
  const maximum = edition?.nbFut ?? 0;
  useEffect(() => {
    onCloseNav();
  }, [pathname]); // eslint-disable-line react-hooks/exhaustive-deps
  const items = [
    { title: "Résultats", path: "/", icon: "activity" as const },
    { title: "Comitards", path: "/comitards", icon: "people" as const },
    { title: "Règlement", path: "/rules", icon: "book" as const },
  ];
  const content = (
    <Box
      sx={{
        height: 1,
        display: "flex",
        flexDirection: "column",
        p: 2,
        overflowY: "auto",
      }}
    >
      <Box
        sx={{
          px: 1,
          pt: 1,
          pb: 4,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <Logo size={64} />
        {!upLg && (
          <IconButton
            aria-label="Fermer le menu"
            onClick={onCloseNav}
            sx={{ minWidth: 44, minHeight: 44 }}
          >
            <ClubIcon name="close" />
          </IconButton>
        )}
      </Box>
      <Stack component="nav" aria-label="Navigation principale" spacing={0.5}>
        {items.map((item) => (
          <ListItemButton
            key={item.path}
            component={RouterLink}
            href={item.path}
            aria-current={pathname === item.path ? "page" : undefined}
            sx={{
              minHeight: 48,
              px: 2,
              gap: 1.5,
              borderRadius: 1.5,
              color: pathname === item.path ? "primary.main" : "text.secondary",
              bgcolor: (theme) =>
                pathname === item.path
                  ? alpha(theme.palette.primary.main, 0.08)
                  : "transparent",
              "&:hover": {
                bgcolor: (theme) => alpha(theme.palette.primary.main, 0.1),
              },
            }}
          >
            <ClubIcon name={item.icon} sx={{ fontSize: 22 }} />
            <Typography
              sx={{
                fontSize: 14,
                fontWeight: pathname === item.path ? 600 : 400,
              }}
            >
              {item.title}
            </Typography>
          </ListItemButton>
        ))}
      </Stack>
      <Box sx={{ mt: "auto", pt: 4 }}>
        {user && !isAdmin() && (
          <Box
            sx={{
              p: 2,
              bgcolor: (theme) => alpha(theme.palette.primary.main, 0.04),
              borderRadius: 2,
              mb: 2,
            }}
          >
            <Typography sx={{ fontSize: 12, color: "text.secondary", mb: 1 }}>
              Fûts restants
            </Typography>
            <Typography
              sx={{ fontSize: 26, fontWeight: 700, color: "primary.main" }}
            >
              {balance}
              <Box
                component="span"
                sx={{
                  fontSize: 12,
                  fontWeight: 400,
                  color: "text.secondary",
                  ml: 1,
                }}
              >
                / {maximum}
              </Box>
            </Typography>
            <LinearProgress
              variant="determinate"
              value={
                maximum > 0
                  ? Math.min(100, Math.max(0, (balance / maximum) * 100))
                  : 0
              }
              sx={{ mt: 1.5, height: 5, borderRadius: 1 }}
            />
          </Box>
        )}
        <Button
          component={RouterLink}
          href={user ? "/account" : "/login"}
          fullWidth
          startIcon={
            <ClubIcon name={user ? "people" : "login"} sx={{ fontSize: 20 }} />
          }
          sx={{
            justifyContent: "flex-start",
            color: "text.secondary",
            fontSize: 13,
            minHeight: 48,
            px: 2,
          }}
        >
          {user ? "Mon compte" : "Connexion"}
        </Button>
      </Box>
    </Box>
  );
  const paper = {
    width: NAV.WIDTH,
    bgcolor: "background.paper",
    borderRight: "1px solid",
    borderColor: "divider",
  };
  return (
    <Box sx={{ flexShrink: { lg: 0 }, width: { lg: NAV.WIDTH } }}>
      {upLg ? (
        <Box
          component="aside"
          sx={{
            ...paper,
            position: "fixed",
            inset: "0 auto 0 0",
            height: "100dvh",
          }}
        >
          {content}
        </Box>
      ) : (
        <Drawer open={openNav} onClose={onCloseNav} PaperProps={{ sx: paper }}>
          {content}
        </Drawer>
      )}
    </Box>
  );
}
