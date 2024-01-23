import Box from "@mui/material/Box";
import Stack from "@mui/material/Stack";
import AppBar from "@mui/material/AppBar";
import Toolbar from "@mui/material/Toolbar";
import { alpha, useTheme } from "@mui/material/styles";
import IconButton from "@mui/material/IconButton";

import { NAV, HEADER } from "./config-layout";
import AccountPopover from "./common/account-popover";
import { useResponsive } from "../../hooks/use-responsive";
import { useAuth } from "../../auth/AuthProvider";
import Iconify from "../../components/iconify/iconify";

// ----------------------------------------------------------------------
interface AuthContextValue {
  user: any;
}

export default function Header({ onOpenNav }:any) {
  const theme = useTheme();
  const { user } = useAuth() as AuthContextValue;
  

  const lgUp = useResponsive('lg','tt','up'); //fix
  //const lgUp = useResponsive("up", "lg");

  const renderContent = (
    <>
      {!lgUp && (
        <IconButton onClick={onOpenNav} sx={{ mr: 1 }}>
          <Iconify icon="eva:menu-2-fill" />
        </IconButton>
      )}

      <Box sx={{ flexGrow: 1 }} />

      {user && (
        <>
          <Stack direction="row" alignItems="center" spacing={1}>
            <AccountPopover />
          </Stack>
        </>
      )}
    </>
  );

  return (
    <AppBar
      sx={{
        boxShadow: "none",
        height: HEADER.H_MOBILE,
        zIndex: theme.zIndex.appBar + 1,

        backdropFilter: `blur(${blur}px)`,
        WebkitBackdropFilter: `blur(${blur}px)`,
        backgroundColor: alpha('#F9FAFB', 0.8),

        transition: theme.transitions.create(["height"], {
          duration: theme.transitions.duration.shorter,
        }),
        ...(lgUp && {
          width: `calc(100% - ${NAV.WIDTH + 1}px)`,
          height: HEADER.H_DESKTOP,
        }),
      }}
    >
      <Toolbar
        sx={{
          height: 1,
          px: { lg: 5 },
        }}
      >
        {renderContent}
      </Toolbar>
    </AppBar>
  );
}

