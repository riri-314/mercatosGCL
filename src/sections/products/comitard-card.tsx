import { useEffect, useState } from "react";

import { useTheme } from "@mui/material/styles";
import useMediaQuery from "@mui/material/useMediaQuery";

import Box from "@mui/material/Box";
import Card from "@mui/material/Card";
import Stack from "@mui/material/Stack";
import Modal from "@mui/material/Modal";
import Typography from "@mui/material/Typography";
import Divider from "@mui/material/Divider";
import Iconify from "../../components/iconify/iconify";
import Label from "../../components/label/label";
import LazyLoad from "react-lazy-load";
import QuantityInput from "../../components/inputs/numberInput";

import { httpsCallable } from "@firebase/functions";
import { functions } from "../../firebase_config";
import { Alert, AlertColor } from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { useAuth } from "../../auth/AuthProvider";
import LinearProgress from "@mui/material/LinearProgress";

// ----------------------------------------------------------------------

interface ComitardCardProps {
  product: any;
  user: string | undefined;
  cercleId: string;
  comitardId: string;
  nbFutsLeft: number;
  enchereMin: number;
  enchereMax: number;
  isInTimeFrame: boolean;
  refetchData: () => void;
}

export default function ComitardCard({
  product,
  cercleId,
  comitardId,
  nbFutsLeft,
  enchereMin,
  enchereMax,
  isInTimeFrame,
  refetchData,
}: ComitardCardProps) {
  const [open, setOpen] = useState(false);
  const [timeLeft, setTimeLeft] = useState(0);
  const [displayVote, setDisplayVote] = useState(false);
  const [vote, setVote] = useState(0);
  const [voteError, setVoteError] = useState("");
  const [voteErrorSeverity, setVoteErrorSeverity] = useState<
    AlertColor | undefined
  >("error");
  const [loading, setLoading] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);
  const { user } = useAuth();

  const theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down("sm")); // Adjust breakpoint as needed
  //console.log("isInTimeFrame: ", isInTimeFrame);

  useEffect(() => {
    //console.log("isInTimeFrame: ", isInTimeFrame);
    //console.log("Update the time left");

    if (isInTimeFrame) {
      if (user) {
        displayVoteFn();
        displayTimeLeft();
        const interval = setInterval(() => {
          displayVoteFn();
          displayTimeLeft();
        }, 1000); // Update every second

        return () => clearInterval(interval);
      } else {
        //console.log("No suer")
        setDisplayVote(false);
        setVoteError("");
        displayTimeLeft();
        const interval = setInterval(() => {
          displayTimeLeft();
        }, 1000); // Update every second

        return () => clearInterval(interval);
      }
    }
  }, [isInTimeFrame, product, user]);

    // function to decide if we display the vote button or not
  // only for logged in users
  // also update the time left of the enchère
  function displayVoteFn(): void {
    if (!user || user.uid === cercleId) {
      setDisplayVote(false);
      return;
    }

    if (nbFutsLeft <= 0 || nbFutsLeft < enchereMin) {
      //console.log("Number of futs left: ", nbFutsLeft);
      setDisplayVote(false);
      return;
    }

    if (product.enchereStart && product.enchereStop) {
      const now = new Date().getTime();
      const enchereStart = product.enchereStart.toMillis();
      const enchereStop = product.enchereStop.toMillis();
      if (now >= enchereStart && now <= enchereStop) {
        //setTimeLeft(enchereStop - now);
        setDisplayVote(true);
        return;
      } else {
        //setTimeLeft(0);
        setDisplayVote(false);
        return;
      }
    } else {
      setDisplayVote(true);
      return;
    }
  }
  // function to display the time left of the enchère
  // only for not logged in users
  function displayTimeLeft(): void {
    const enchereStart = product?.enchereStart?.toMillis();
    const enchereStop = product?.enchereStop?.toMillis();
    const now = new Date().getTime();
    if (now >= enchereStart && now <= enchereStop) {
      setTimeLeft(enchereStop - now);
      return;
    } else {
      setTimeLeft(0);
      return;
    }
  }

  function formatTimeLeft(time: number): string {
    const hours = Math.floor(time / (1000 * 60 * 60));
    const minutes = Math.floor((time % (1000 * 60 * 60)) / (1000 * 60));
    const seconds = Math.floor((time % (1000 * 60)) / 1000);

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function handleVote(): void {
    setLoading(true);
    setVoteError("");
    setVoteErrorSeverity("error");
    console.log("vote: ", vote);
    if (
      vote &&
      vote > 0 &&
      vote >= enchereMin &&
      enchereMax >= vote &&
      vote <= nbFutsLeft
    ) {
      const Vote = httpsCallable(functions, "vote");
      Vote({ vote: vote, comitardId: comitardId })
        .then((result) => {
          // Read result of the Cloud Function.
          /** @type {any} */
          const data: any = result.data;
          //const sanitizedMessage = data.text;
          console.log("data:", data);
          //refetchData();
          setTimeout(() => {
            refetchData();
          }, 2000);
          setVoteErrorSeverity("success");
          setVoteError("Vote enregistré");
          setTimeout(() => {
            setVoteError("");
          }, 4000);
          setLoading(false);
        })
        .catch((error) => {
          // Getting the Error details.
          //const code = error.code;
          const message = error.message;
          const details = error.details;
          console.log("error:", message, details);
          setVoteError("Erreur veuillez contacter un geek");
          setLoading(false);
        });
    } else {
      setVoteError("Veuillez entrer une enchère valide");
      setLoading(false);
    }
  }

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
        boxShadow: (theme: any) => theme.shadows[4],
      }}
    >
      {formatTimeLeft(timeLeft)}
      <Iconify icon="jam:chronometer" />
    </Label>
  );

  const renderPrice = (
    <Label
      variant="filled"
      color={"info"}
      sx={{
        zIndex: 9,
        top: 16,
        left: 16,
        position: "absolute",
        textTransform: "uppercase",
        boxShadow: (theme: any) => theme.shadows[4],
      }}
    >
      <Iconify icon="ic:round-show-chart" />
       15 fûts
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
          {timeLeft > 0 && renderStatus}
          {/*{encheres.top.vote > 0 && renderPrice}*/}
          {renderPrice}
          {renderImg}
        </Box>
        {timeLeft > 0 && <LinearProgress color={"error"}/>}
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" noWrap>
            {product.firstname} "{product.nickname}" {product.name}
          </Typography>

          {displayVote && isInTimeFrame && (
            <>
              <QuantityInput
                title="Enchère"
                min={enchereMin}
                max={Math.min(nbFutsLeft, enchereMax)}
                error={false}
                helpText={""}
                change={(_event: any, val: any) => {
                  console.log(val);
                  setVote(val);
                }}
              />
              <LoadingButton
                onClick={() => handleVote()}
                loading={loading}
                variant="contained"
                color="inherit"
                startIcon={<Iconify icon="solar:user-hand-up-bold-duotone" />}
              >
                Enchérir
              </LoadingButton>
            </>
          )}
          {voteError && (
            <Alert sx={{ mt: 3 }} severity={voteErrorSeverity}>
              {voteError}
            </Alert>
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
            {timeLeft > 0 && renderStatus}

            {renderImg}
          </Box>
          {timeLeft > 0 && <LinearProgress color={"error"}/>}
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
