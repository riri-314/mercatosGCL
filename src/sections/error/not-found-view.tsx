import Box from "@mui/material/Box";
import Button from "@mui/material/Button";
import Container from "@mui/material/Container";
import Typography from "@mui/material/Typography";

import RouterLink from "../../routes/components/router-link";
import Logo from "../../components/logo/logo";
import BeerRain from "./7";

// ----------------------------------------------------------------------

export default function NotFoundView() {
  const renderHeader = (
    <Box
      component="header"
      sx={{
        top: 0,
        left: 0,
        width: 1,
        lineHeight: 0,
        position: "fixed",
        p: (theme) => ({
          xs: theme.spacing(3, 3, 0),
          sm: theme.spacing(5, 5, 0),
        }),
      }}
    >
      <Logo />
    </Box>
  );

  return (
    <>
      {renderHeader}
      <BeerRain />
      <Container>
        <Box
          sx={{
            py: 12,
            maxWidth: 480,
            mx: "auto",
            display: "flex",
            minHeight: "100vh",
            textAlign: "center",
            alignItems: "center",
            flexDirection: "column",
            justifyContent: "center",
          }}
        >
          <Typography variant="h3" sx={{ mb: 3 }}>
            Sorry, page non trouvée!
          </Typography>

          <Typography sx={{ color: "text.secondary" }}>
            Sorry on a pas trouver la page en question. Peut-être avez-vous mal
            tapé l'URL? Assurez-vous de bien vérifier votre orthographe.
          </Typography>

          <Box
            component="img"
            src="/assets/illustrations/illustration_404.svg"
            sx={{
              mx: "auto",
              height: 260,
              my: { xs: 5, sm: 10 },
            }}
          />

          <Button
            href="/"
            size="large"
            variant="contained"
            component={RouterLink}
          >
            Vers page d'accueil
          </Button>
        </Box>
      </Container>
    </>
  );
}