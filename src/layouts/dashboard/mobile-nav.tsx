import { BottomNavigation, BottomNavigationAction, Box } from "@mui/material";
import { useAuth } from "../../auth/auth-context";
import { usePathname } from "../../routes/hooks/use-pathname";
import RouterLink from "../../routes/components/router-link";
import ClubIcon from "../../components/club-icon/club-icon";

export default function MobileNav() {
  const { user, isAdmin } = useAuth();
  const pathname = usePathname();
  const items = [
    { label: "Résultats", path: "/", icon: "activity" as const },
    { label: "Comitards", path: "/comitards", icon: "people" as const },
    { label: "Règlement", path: "/rules", icon: "book" as const },
    {
      label: user ? (isAdmin() ? "Admin" : "Mon cercle") : "Connexion",
      path: user ? "/account" : "/login",
      icon: "login" as const,
    },
  ];
  return (
    <Box
      component="nav"
      aria-label="Navigation mobile"
      sx={{
        display: { xs: "block", sm: "none" },
        position: "fixed",
        bottom: 0,
        left: 0,
        right: 0,
        zIndex: 1100,
        bgcolor: "background.paper",
        borderTop: "1px solid",
        borderColor: "divider",
        pb: "env(safe-area-inset-bottom, 0px)",
      }}
    >
      <BottomNavigation
        showLabels
        value={pathname}
        sx={{
          height: 68,
          bgcolor: "transparent",
          "& .MuiBottomNavigationAction-root": {
            minWidth: 0,
            gap: 0.6,
            color: "text.secondary",
            px: 0.5,
          },
          "& .MuiBottomNavigationAction-label, & .MuiBottomNavigationAction-label.Mui-selected":
            { fontSize: 10.5, fontWeight: 600 },
          "& .Mui-selected": { color: "primary.main" },
        }}
      >
        {items.map((item) => (
          <BottomNavigationAction
            key={item.path}
            component={RouterLink}
            href={item.path}
            value={item.path}
            label={item.label}
            aria-current={pathname === item.path ? "page" : undefined}
            icon={<ClubIcon name={item.icon} sx={{ fontSize: 21 }} />}
          />
        ))}
      </BottomNavigation>
    </Box>
  );
}
