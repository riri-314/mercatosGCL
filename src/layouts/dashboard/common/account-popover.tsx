import { useState } from "react";

import Box from "@mui/material/Box";
import Avatar from "@mui/material/Avatar";
import Divider from "@mui/material/Divider";
import Popover from "@mui/material/Popover";
import { alpha } from "@mui/material/styles";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import { signOut } from "@firebase/auth";
import LoadingButton from "@mui/lab/LoadingButton";
import { auth } from "../../../firebase_config";
import { useAuth } from "../../../auth/AuthProvider";

// ----------------------------------------------------------------------
interface AuthContextValue {
  user: any;
}

export default function AccountPopover() {
  const [open, setOpen] = useState(null);
  const [loading, setLoading] = useState(false);

  const { user } = useAuth() as AuthContextValue;  

  const handleOpen = (event: any) => {
    setOpen(event.currentTarget);
  };

  const handleClose = () => {
    setOpen(null);
  };

  const logout = async () => {
    setLoading(true);
    try {
      await signOut(auth);
      console.log("logout succes, user: ", auth.currentUser);
    } catch {
      console.log("logout error");
    }
    setLoading(false);
    setOpen(null);
  };


  return (
    <>
      <IconButton
        onClick={handleOpen}
        sx={{
          width: 40,
          height: 40,
          background: (theme) => 
          open ? `linear-gradient(135deg, ${theme.palette.primary.light} 0%, ${theme.palette.primary.main} 100%)` :  alpha(theme.palette.grey[500], 0.08)
        }}
      >
        <Avatar
          src={"/assets/images/avatars/avatar_25.jpg"}
          alt={user?.email? user.email: "test"}
          sx={{
            width: 36,
            height: 36,
            border: (theme) => `solid 2px ${theme.palette.background.default}`,
          }}
        >
          {user?.email? user.email: "test".charAt(0).toUpperCase()}
        </Avatar>
      </IconButton>

      <Popover
        open={!!open}
        anchorEl={open}
        onClose={handleClose}
        anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
        transformOrigin={{ vertical: "top", horizontal: "right" }}
        PaperProps={{
          sx: {
            p: 0,
            mt: 1,
            ml: 0.75,
            width: 200,
          },
        }}
      >
        <Box sx={{ my: 1.5, px: 2 }}>
          <Typography variant="subtitle2" noWrap>
            {user?.displayName? user.displayName: "Koala anonyme"}
          </Typography>
          <Typography variant="body2" sx={{ color: "text.secondary" }} noWrap>
            {user?.email? user.email: ""}
          </Typography>
        </Box>

        <Divider sx={{ borderStyle: "dashed", m: 0 }} />

        <LoadingButton
          loading={loading}
          onClick={logout}
          sx={{
            typography: "body2",
            color: "error.main",
            py: 1.5,
            width: "100%",
          }}
        >
          Logout
        </LoadingButton>
      </Popover>
    </>
  );
}
