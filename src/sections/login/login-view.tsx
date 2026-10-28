import { useState } from "react";

import Box from "@mui/material/Box";
import Link from "@mui/material/Link";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import TextField from "@mui/material/TextField";
import Typography from "@mui/material/Typography";
import IconButton from "@mui/material/IconButton";
import LoadingButton from "@mui/lab/LoadingButton";
import InputAdornment from "@mui/material/InputAdornment";
import Alert from "@mui/material/Alert";

import {
  sendPasswordResetEmail,
  signInWithEmailAndPassword,
} from "firebase/auth";
import { useRouter } from "../../routes/hooks/use-router";
import Logo from "../../components/logo/logo";
import Iconify from "../../components/iconify/iconify";
import { auth } from "../../firebase_config";
import ClubIcon from "../../components/club-icon/club-icon";
import RouterLink from "../../routes/components/router-link";

// ----------------------------------------------------------------------

export default function LoginView() {
  const router = useRouter();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const [forgotPassword, setForgotPassword] = useState(false);

  // ...

  const handleToggleForgotPassword = () => {
    setForgotPassword(!forgotPassword);
    setError("");
  };

  const handleForgottenPassword = async () => {
    if (email == "") {
      setError("Entrez une adresse mail pour changer votre mot de passe");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await sendPasswordResetEmail(auth, email);
      setLoading(false);
      setError(
        "Un email vous a été envoyé. N'oublie pas de vérifier tes spams !",
      );
    } catch (error: unknown) {
      console.log("Password recovery failed:", error);
      setError("Erreur de connection");
      setLoading(false);
    }
  };

  const handleClick = async () => {
    // check login
    // do what need to be done
    if (email == "" || password == "") {
      setError("Entrez un mot de passe ou une adresse mail");
      return;
    }
    try {
      setError("");
      setLoading(true);
      await signInWithEmailAndPassword(auth, email, password);
      setLoading(false);
      router.push("/");
    } catch {
      setError("Erreur de connection");
      setLoading(false);
    }
  };

  const renderLoginForm = (
    <>
      <Stack spacing={3}>
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />

        <TextField
          name="password"
          label="Mot de passe"
          autoComplete="current-password"
          value={password}
          type={showPassword ? "text" : "password"}
          onChange={(e) => setPassword(e.target.value)}
          InputProps={{
            endAdornment: (
              <InputAdornment position="end">
                <IconButton
                  aria-label={
                    showPassword
                      ? "Masquer le mot de passe"
                      : "Afficher le mot de passe"
                  }
                  onClick={() => setShowPassword(!showPassword)}
                  edge="end"
                >
                  <Iconify
                    icon={showPassword ? "eva:eye-fill" : "eva:eye-off-fill"}
                  />
                </IconButton>
              </InputAdornment>
            ),
          }}
        />
      </Stack>

      <Stack
        direction="row"
        alignItems="center"
        justifyContent="flex-end"
        sx={{ my: 3 }}
      >
        <Link
          variant="subtitle2"
          underline="hover"
          href="#password-recovery"
          onClick={(event) => {
            event.preventDefault();
            handleToggleForgotPassword();
          }}
        >
          Mot de passe oublié?
        </Link>
      </Stack>

      <LoadingButton
        fullWidth
        size="large"
        type="submit"
        variant="contained"
        color="primary"
        loading={loading}
      >
        Connexion
      </LoadingButton>
    </>
  );

  const renderForgotPassword = (
    <>
      <Stack spacing={3}>
        <TextField
          name="email"
          label="Email"
          type="email"
          autoComplete="email"
          value={email}
          onChange={(e) => setEmail(e.target.value)}
        />
        <Stack
          direction="row"
          alignItems="center"
          justifyContent="flex-end"
          sx={{ my: 3 }}
        >
          <Link
            variant="subtitle2"
            underline="hover"
            href="#password-recovery"
            onClick={(event) => {
              event.preventDefault();
              handleToggleForgotPassword();
            }}
          >
            Connecte-toi
          </Link>
        </Stack>

        <LoadingButton
          fullWidth
          size="large"
          type="submit"
          variant="contained"
          color="primary"
          loading={loading}
        >
          Réinitialiser le mot de passe
        </LoadingButton>
      </Stack>
    </>
  );

  const renderForm = forgotPassword ? renderForgotPassword : renderLoginForm;

  return (
    <Box
      sx={{
        minHeight: "100dvh",
        display: "flex",
        flexDirection: "column",
        bgcolor: "background.default",
        p: { xs: 2, sm: 3 },
      }}
    >
      <Box
        sx={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          gap: 2,
          mb: 3,
        }}
      >
        <Logo />
        <Link
          component={RouterLink}
          href="/"
          underline="hover"
          sx={{
            display: "inline-flex",
            alignItems: "center",
            gap: 1,
            fontSize: 13,
            color: "text.secondary",
            minHeight: 44,
          }}
        >
          <ClubIcon
            name="arrow"
            sx={{ fontSize: 18, transform: "rotate(180deg)" }}
          />
          Retour aux résultats
        </Link>
      </Box>
      <Card
        sx={{
          width: 1,
          maxWidth: 420,
          mx: "auto",
          my: "auto",
          p: { xs: 3, sm: 4 },
        }}
      >
        <Typography component="h1" variant="h4" sx={{ mb: 3 }}>
          {forgotPassword ? "Mot de passe oublié" : "Connexion"}
        </Typography>
        {forgotPassword && (
          <Typography sx={{ fontSize: 13, color: "text.secondary", mb: 3 }}>
            Un lien de réinitialisation sera envoyé à ton adresse email.
          </Typography>
        )}
        {error && (
          <Alert
            sx={{ mb: 3 }}
            severity={error.startsWith("Un email") ? "success" : "error"}
          >
            {error}
          </Alert>
        )}
        <Box
          component="form"
          noValidate
          onSubmit={(event) => {
            event.preventDefault();
            void (forgotPassword ? handleForgottenPassword() : handleClick());
          }}
        >
          {renderForm}
        </Box>
      </Card>
      <Box sx={{ height: 80 }} />
    </Box>
  );
}
