import { useEffect } from "react";

import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import Drawer from "@mui/material/Drawer";
import { alpha } from "@mui/material/styles";
import ListItemButton from "@mui/material/ListItemButton";

import { NAV } from "./config-layout";
//import navConfig from './config-navigation';

import { useResponsive } from "../../hooks/use-responsive";
import { useAuth } from "../../auth/AuthProvider";
import SvgColor from "../../components/svg-color/svg-color";
import Logo from "../../components/logo/logo";
import { usePathname } from "../../routes/hooks/use-pathname";
import RouterLink from "../../routes/components/router-link";
import Scrollbar from "../../components/scrollbar/scrollbar";
import { Typography } from "@mui/material";

import LinearProgress, {
  linearProgressClasses,
} from "@mui/material/LinearProgress";
import { styled } from "@mui/material/styles";
import { DocumentData } from "@firebase/firestore";
import { useData } from "../../data/DataProvider";

// ----------------------------------------------------------------------
interface AuthContextValue {
  user: any;
}

interface DataContextValue {
  data: DocumentData | null;
  refetchData: () => void;
  fetchedTime: number;
}

export default function Nav({ openNav, onCloseNav }: any) {
  const pathname = usePathname();
  
  const { data } = useData() as DataContextValue;

  const upLg = useResponsive("lg", "tt", "up"); //fix

  useEffect(() => {
    if (openNav) {
      onCloseNav();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pathname]);

  function nbFutsLeft(): number {
    if (user) {
      const nbFuts = data?.data().cercles[user?.uid]?.nbFut;
      if (nbFuts) {
        return nbFuts;
      } else {
        return 0;
      }
    } else {
      return 0;
    }
  }

  function nbFutsMax(): number {
    const nbFuts = data?.data().nbFut;
    if (nbFuts) {
      return nbFuts;
    } else {
      return 0;
    }
  }

  function futsPercent(): number {
    return (nbFutsLeft() / nbFutsMax()) * 100;
  }

  const icon = (name: string) => (
    <SvgColor
      src={`/assets/icons/navbar/${name}.svg`}
      sx={{ width: 1, height: 1 }}
    />
  );

  const { user } = useAuth() as AuthContextValue;

  let navConfig = [
    {
      title: "résultats",
      path: "/",
      icon: icon("ic_analytics"),
    },
    {
      title: "comitards",
      path: "/comitards",
      icon: icon("ic_user"),
    },
    {
      title: "Règlement",
      path: "/rules",
      icon: icon("ic_disabled"),
    },
    {
      title: user ? "Compte" : "Connection",
      path: user ? "/account" : "/login",
      icon: icon("ic_lock"),
    },
  ];

  const renderMenu = (
    <Stack component="nav" spacing={0.5} sx={{ px: 2 }}>
      {navConfig.map((item) => (
        <NavItem key={item.title} item={item} />
      ))}
    </Stack>
  );

  const BorderLinearProgress = styled(LinearProgress)(({ theme }) => ({
    height: 10,
    borderRadius: 5,
    [`&.${linearProgressClasses.colorPrimary}`]: {
      backgroundColor:
        theme.palette.grey[theme.palette.mode === "light" ? 400 : 800],
    },
    [`& .${linearProgressClasses.bar}`]: {
      borderRadius: 5,
      backgroundColor: theme.palette.mode === "light" ? "#1a90ff" : "#308fe8",
    },
  }));

  const renderFutsLeft = (
    <Box sx={{ px: 2.5, pb: 3, mt: 10 }}>
      <Stack
        alignItems="center"
        spacing={3}
        sx={{ pt: 5, borderRadius: 2, position: "relative" }}
      >
        <Box sx={{ textAlign: "center" }}>
          <Typography> {String(nbFutsLeft())} Fûts sur {String(nbFutsMax())} restants</Typography>

          <BorderLinearProgress variant="determinate" value={futsPercent()} />
        </Box>
      </Stack>
    </Box>
  );

  const renderContent = (
    <Scrollbar
      sx={{
        height: 1,
        "& .simplebar-content": {
          height: 1,
          display: "flex",
          flexDirection: "column",
        },
      }}
    >
      <Logo sx={{ mt: 3, ml: 4, mb: 2 }} />

      {renderMenu}
    </Scrollbar>
  );

  return (
    <Box
      sx={{
        flexShrink: { lg: 0 },
        width: { lg: NAV.WIDTH },
      }}
    >
      {upLg ? (
        <>
          <Box
            sx={{
              height: 1,
              position: "fixed",
              width: NAV.WIDTH,

              borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
            }}
          >
            {renderContent}
          </Box>
          <Box
            sx={{
              position: "fixed",
              width: NAV.WIDTH,
              bottom: 0,
              borderRight: (theme) => `dashed 1px ${theme.palette.divider}`,
            }}
          >
            {user && renderFutsLeft}
          </Box>
        </>
      ) : (
        <>
          <Drawer
            open={openNav}
            onClose={onCloseNav}
            PaperProps={{
              sx: {
                width: NAV.WIDTH,
              },
            }}
          >
            {renderContent}
            {user && renderFutsLeft}
          </Drawer>
        </>
      )}
    </Box>
  );
}

// ----------------------------------------------------------------------

function NavItem({ item }: any) {
  const pathname = usePathname();

  const active = item.path === pathname;

  return (
    <ListItemButton
      component={RouterLink}
      href={item.path}
      sx={{
        minHeight: 44,
        borderRadius: 0.75,
        typography: "body2",
        color: "text.secondary",
        textTransform: "capitalize",
        fontWeight: "fontWeightMedium",
        ...(active && {
          color: "primary.main",
          fontWeight: "fontWeightSemiBold",
          bgcolor: (theme) => alpha(theme.palette.primary.main, 0.08),
          "&:hover": {
            bgcolor: (theme) => alpha(theme.palette.primary.main, 0.16),
          },
        }),
      }}
    >
      <Box component="span" sx={{ width: 24, height: 24, mr: 2 }}>
        {item.icon}
      </Box>

      <Box component="span">{item.title} </Box>
    </ListItemButton>
  );
}
