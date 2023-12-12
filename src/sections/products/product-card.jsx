import { useState } from 'react';

import PropTypes from 'prop-types';
import { useTheme } from '@mui/material/styles';
import useMediaQuery from '@mui/material/useMediaQuery';

import Button from '@mui/material/Button';
import Box from '@mui/material/Box';
import Link from '@mui/material/Link';
import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Modal from '@mui/material/Modal';
import Typography from '@mui/material/Typography';
import TextField from '@mui/material/TextField';
import Alert from '@mui/material/Alert';
import Divider from '@mui/material/Divider';
import Iconify from 'src/components/iconify';
import Label from 'src/components/label';

// ----------------------------------------------------------------------

export default function ShopProductCard({ product }) {
  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm')); // Adjust breakpoint as needed

  const style = {
    position: 'absolute',
    top: '50%',
    left: '50%',
    transform: 'translate(-50%, -50%)',
    //width: isSmallScreen ? '90%' : '30%', // Adjust width based on screen size
    //maxHeight: isSmallScreen ? '90%' : '85%', // Adjust maxHeight based on screen size
    width: isSmallScreen ? '90%' : '40%', // Adjust width based on screen size
    maxHeight: isSmallScreen ? '90%' : '80vh', // Adjust maxHeight based on screen size

    boxShadow: 'none', // Remove the box shadow
    border: 'none', // Remove the border
    outline: 'none', // Remove outline (focus indicator)
  };

  const renderStatus = (
    <Label
      variant="filled"
      color={'error'}
      sx={{
        zIndex: 9,
        top: 16,
        right: 16,
        position: 'absolute',
        textTransform: 'uppercase',
      }}
    >
      {product.status}
      <Iconify icon="jam:chronometer" />
    </Label>
  );

  const renderImg = (
    <Box
      component="img"
      alt={product.name}
      src={product.cover}
      sx={{
        top: 0,
        width: 1,
        height: 1,
        objectFit: 'cover',
        position: 'absolute',
      }}
    />
  );

  return (
    <>
      <Card>
        <Box onClick={handleOpen} sx={{ pt: '100%', position: 'relative' }}>
          {product.status && renderStatus}

          {renderImg}
        </Box>

        <Stack spacing={2} sx={{ p: 3 }}>
          <Link color="inherit" underline="hover" onClick={handleOpen} variant="subtitle2" noWrap>
            {product.name} Pihet
          </Link>

          <TextField
            size="small"
            label="Entez un vote"
            inputProps={{ type: 'number' }}
          />
          <Button
            onClick={() => {
              console.log('voteee');
            }}
            variant="contained"
            color="inherit"
            startIcon={<Iconify icon="octicon:check-16" />}
          >
            Voter
          </Button>
          {/* 
          <Alert severity="success">Vote enregistré</Alert>
          <Alert severity="error">Erreur</Alert> 
          */}
        </Stack>
      </Card>
      <Modal
        open={open}
        onClose={handleClose}
        aria-labelledby="modal-modal-title"
        aria-describedby="modal-modal-description"
      >
        <Card sx={style}>
          <Box sx={{ pt: '50%', position: 'relative' }}>
            {product.status && renderStatus}
            {renderImg}
          </Box>
          <Typography variant="h1" sx={{ pl: 3, pt: 2 }}>
            {product.name} Pihet
            <Divider variant="middle" />
          </Typography>
          <Box sx={{ maxHeight: 'calc(80vh - 120px)', overflowY: 'auto' }}>
            <div style={{ maxHeight: '300px', overflowY: 'auto' }}>
              <Stack spacing={0} sx={{ p: 3, pt: 1, maxHeight: '80vh' }}>
                <Typography variant="body1">
                  <strong>Surnom:</strong> La briseuse de vitres
                  <br />
                  <strong>Poste</strong> : Photographe
                  <br />
                  <strong>Maison d'appartenance </strong>: Adèle
                  <br />
                  <strong>Taille du bonnet</strong> : Elle porte plutôt des casquettes
                  <br />
                  <strong>Teneur en taule</strong> : C'est une femme les gars...
                  <br />
                  <strong>État civil</strong> : Coureuse de remparts
                  <br />
                  <strong>Age</strong> : 19
                  <br />
                  <strong>Nombre d'étoiles</strong> : 2
                  <br />
                  <strong>Point fort</strong> : Aime le travail de groupe, plutôt sociable. Aime le
                  vélo, le ping-pong et les aveugles.
                  <br />
                  <strong>Point faible </strong>: Elle a du mal à maîtriser sa force lorsqu'elle est
                  alcoolisée. Point faible : Trop forte
                  <br />
                  <strong>Est le seul</strong> : A avoir chopé Bicra, un homme bien mais malvoyant.
                  Ce qui peut offrir l'avantage non négligeable de ne pas voir qui il chope.
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
};
