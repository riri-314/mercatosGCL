import { useLayoutEffect, useRef, useState } from "react";
import { signOut } from "firebase/auth";
import { useNavigate } from "react-router-dom";
import { Box, Button, GlobalStyles, Typography } from "@mui/material";
import { auth } from "../firebase_config";
import { useAuth } from "./auth-context";
import ClubIcon from "../components/club-icon/club-icon";

export default function CercleSessionBanner() {
  const { cercleSession } = useAuth();
  const navigate = useNavigate();
  const banner = useRef<HTMLDivElement>(null);
  const [loggingOut, setLoggingOut] = useState(false);
  const [error, setError] = useState("");

  useLayoutEffect(() => {
    const element = banner.current;
    if (!element) return;
    const updateHeight = () => document.documentElement.style.setProperty(
      "--cercle-session-banner-height", `${element.getBoundingClientRect().height}px`,
    );
    updateHeight();
    const observer = new ResizeObserver(updateHeight);
    observer.observe(element);
    return () => {
      observer.disconnect();
      document.documentElement.style.removeProperty("--cercle-session-banner-height");
    };
  }, [cercleSession]);

  if (!cercleSession) return null;

  async function logout() {
    setLoggingOut(true);
    setError("");
    try {
      await signOut(auth);
      navigate("/login", { replace: true });
    } catch {
      setError("La déconnexion a échoué. Réessayez.");
    } finally {
      setLoggingOut(false);
    }
  }

  return (
    <>
      <GlobalStyles styles={{ ".MuiDialog-root.MuiDialog-root": { top: "var(--cercle-session-banner-height, 0px)" } }} />
      <Box
        ref={banner}
        component="aside"
        role="alert"
        aria-label="Session cercle active"
        sx={{
          position: "fixed",
          top: 0,
          left: 0,
          right: 0,
          zIndex: (theme) => theme.zIndex.modal + 1,
          bgcolor: "error.dark",
          color: "common.white",
          display: "flex",
          flexDirection: { xs: "column", sm: "row" },
          alignItems: { xs: "stretch", sm: "center" },
          justifyContent: "space-between",
          gap: 1.5,
          px: { xs: 2, sm: 3 },
          py: 2,
          minHeight: { xs: 128, sm: 96 },
          boxShadow: "0 2px 8px #0002",
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography sx={{ fontSize: { xs: 17, sm: 19 }, fontWeight: 700, overflowWrap: "anywhere" }}>
            Vous êtes connecté en tant que {cercleSession.name}.
          </Typography>
          <Typography sx={{ fontSize: 13, mt: 0.5 }}>
            Toutes vos actions sont effectuées avec ce compte cercle.
          </Typography>
          {error && <Typography sx={{ fontSize: 13, mt: 1, fontWeight: 600 }}>{error}</Typography>}
        </Box>
        <Button
          variant="outlined"
          color="inherit"
          disabled={loggingOut}
          aria-busy={loggingOut}
          onClick={() => void logout()}
          startIcon={<ClubIcon name="login" />}
          sx={{
            minHeight: 44,
            flexShrink: 0,
            borderColor: "#fff9",
            whiteSpace: "nowrap",
            "&:hover": { borderColor: "common.white", bgcolor: "#fff2" },
            "&.Mui-disabled": { color: "#fffb", borderColor: "#fff6" },
          }}
        >
          {loggingOut ? "Déconnexion…" : "Se déconnecter"}
        </Button>
      </Box>
    </>
  );
}
