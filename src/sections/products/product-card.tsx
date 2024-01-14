import { useState } from "react";

import PropTypes from "prop-types";
import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Button from "@mui/material/Button";
import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import TextField from "@mui/material/TextField";
import Divider from "@mui/material/Divider";
import Iconify from "../../components/iconify/iconify";
import Label from "../../components/label/label";
import LazyLoad from "react-lazy-load";

// ----------------------------------------------------------------------

export default function ShopProductCard({ product, loged }: any) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);


  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); // Adjust breakpoint as needed

  const style = {
    position: "absolute",
    top: "50%",
    left: "50%",
    transform: "translate(-50%, -50%)",
    //width: isSmallScreen ? '90%' : '30%', // Adjust width based on screen size
    //maxHeight: isSmallScreen ? '90%' : '85%', // Adjust maxHeight based on screen size
    width: isSmallScreen ? "90%" : "40%", // Adjust width based on screen size
    maxHeight: isSmallScreen ? "90%" : "80vh", // Adjust maxHeight based on screen size

    boxShadow: "none", // Remove the box shadow
    border: "none", // Remove the border
    outline: "none", // Remove outline (focus indicator)
  };

  const renderStatus = (
    <Label
      variant="filled"
      color={"error"}
      sx={{
        zIndex: 9,
        top: 16,
        right: 16,
        position: "absolute",
        textTransform: "uppercase",
      }}
    >
      test
      <Iconify icon="jam:chronometer" />
    </Label>
  );

  const renderImg = (
    <LazyLoad>
      <Box
        component="img"
        alt={product.name}
        src={product.picture}
        sx={{
          top: 0,
          width: 1,
          height: 1,
          objectFit: "cover",
          position: "absolute",
        }}
        loading="lazy"
      />
    </LazyLoad>
  );

  return (
    <>
      <Card>
        <Box onClick={handleOpen} sx={{ pt: "100%", position: "relative" }}>
          {product.status && renderStatus}

          {renderImg}
        </Box>

        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h3" noWrap>
          {product.firstname} {product.name} 
          </Typography>

          {loged && (
            <>
              <TextField
                size="small"
                label="Entez une enchère"
                inputProps={{ type: "number" }}
              />
              <Button
                onClick={() => {
                  console.log("voteee");
                }}
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="octicon:check-16" />}
              >
                Enchérir
              </Button>
              {/* 
          <Alert severity="success">Vote enregistré</Alert>
          <Alert severity="error">Erreur</Alert> 
          */}
            </>
          )}
        </Stack>
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Card sx={style}>
          <Box sx={{ pt: "50%", position: "relative" }}>
            {product.status && renderStatus}
            {renderImg}
          </Box>
          <Typography variant="h1" sx={{ pl: 3, pt: 2 }}>
            {product.firstname} {product.name} 
            <Divider variant="middle" />
          </Typography>
          <Box sx={{ maxHeight: "calc(80vh - 120px)", overflowY: "auto" }}>
            <div style={{ maxHeight: "300px", overflowY: "auto" }}>
              <Stack spacing={0} sx={{ p: 3, pt: 1, maxHeight: "80vh" }}>
                <Typography variant="body1">
                  <strong>Surnom:</strong> {product.nickname}
                  <br />
                  <strong>Poste</strong> : {product.post}
                  <br />
                  <strong>Maison d'appartenance </strong>: Todo
                  <br />
                  <strong>Teneur en taule</strong> : {product.teneurTaule}
                  <br />
                  <strong>État civil</strong> : {product.etatCivil}
                  <br />
                  <strong>Age</strong> : {product.age}
                  <br />
                  <strong>Nombre d'étoiles</strong> : {product.nbEtoiles}
                  <br />
                  <strong>Point fort</strong> : {product.pointFort}
                  <br />
                  <strong>Point faible </strong>: {product.pointFaible}
                  <br />
                  <strong>Est le seul</strong> : {product.estLeSeul}
                </Typography>
              </Stack>
            </div>
          </Box>
        </Card>
      </Modal>
    </>
  );
}

ShopProductCard.propTypes = {
  product: PropTypes.object,
  loged: PropTypes.bool,
};
