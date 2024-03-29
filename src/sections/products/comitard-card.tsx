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
import EncheresList from "./comitard-encheres.tsx";

// ----------------------------------------------------------------------

interface CerclesData {
  [key: string]: { name: string };
}

interface ComitardCardProps {
  product: any;
  user: string | undefined;
  cercleId: string;
  editionId: string;
  comitardId: string;
  nbFutsLeft: number;
  enchereMin: number;
  enchereMax: number;
  isInTimeFrame: boolean;
  refetchData: () => void;
  cerclesData: CerclesData;
}

export default function ComitardCard({
  product,
  cercleId,
  comitardId,
  editionId,
  nbFutsLeft,
  enchereMin,
  enchereMax,
  isInTimeFrame,
  refetchData,
  cerclesData,
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
  const { user, isAdmin } = useAuth();

  const theme = useTheme();
  const isMediumScreen = useMediaQuery(theme.breakpoints.down("md")); // Adjust breakpoint as needed
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

    if (isAdmin()) {
      setDisplayVote(true);
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

  // if comitard allready has a enchere, return the biggest enchere, return null otherwise
  function maxEnchere(): number | null {
    if (product.encheres) {
      const encheres = Object.values(product.encheres)
        .filter((enchere) => enchere !== null)
        .map((enchere) => (enchere as { vote: number }).vote);
      if (encheres.length > 0) {
        return Math.max(...encheres);
      }
    }
    return null;
  }

  // return the minimum enchere possible
  function minEnchere(): number {
    const max = maxEnchere();
    if (max) {
      return Math.min(Math.max(max + 1, enchereMin), enchereMax);
    }
    return enchereMin;
  }

  function isDisabled(): boolean {
    const max = maxEnchere();
    if (max) {
      return max + 1 > enchereMax;
    } else {
      return false;
    }
  }

  // console.log("product: ", product.name, "maxEnchere: ", minEnchere())

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
      Vote({ vote: vote, comitardId: comitardId, editionId: editionId })
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
          setTimeout(() => {
            refetchData();
          }, 2000);
          console.log("error:", message, details);
          setVoteError(`Erreur serveur: ${message}`);
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
    width: isMediumScreen ? "90%" : "50%", // Adjust width based on screen size
    height: "90vh",

    boxShadow: "none", // Remove the box shadow
    border: "none", // Remove the border
    outline: "none", // Remove outline (focus indicator)
  };

  const renderStatus = (
    <Label
      variant="filled"
      color={"error"}
      onClick={() => console.log("timeLeft: ", timeLeft)}
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

  const firstEnchere: any = product.encheres
    ? Object.values(product.encheres)
        .filter((enchere) => enchere !== null)
        .sort((a: any, b: any) => b.date.seconds - a.date.seconds)[0]
    : null;

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
      {!(timeLeft > 0) && product.encheres !== null && <span>win</span>}
      {firstEnchere
        ? `${(firstEnchere as { vote: number }).vote} fûts`
        : "No data"}
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

  const renderWinner = (
    <Label
      variant="filled"
      color={"success"}
      sx={{
        zIndex: 9,
        top: 16,
        left: 16,
        position: "absolute",
        textTransform: "uppercase",
        boxShadow: (theme: any) => theme.shadows[4],
      }}
    >
      <Iconify icon="solar:cup-bold" />
      {firstEnchere
        ? `${
            (cerclesData[firstEnchere.sender as string] as { name: string })
              .name
          }`
        : "No data"}
    </Label>
  );

  return (
    <>
      <Card>
        <Box onClick={handleOpen} sx={{ pt: "100%", position: "relative" }}>
          {timeLeft > 0 && renderStatus}
          {timeLeft > 0 && renderPrice}
          {timeLeft <= 0 && product.encheres && renderWinner}
          {renderImg}
        </Box>
        {timeLeft > 0 && <LinearProgress color={"error"} />}
        <Stack spacing={2} sx={{ p: 3 }}>
          <Typography variant="h6" noWrap>
            {product.firstname} "{product.nickname}" {product.name}
          </Typography>

          {displayVote && isInTimeFrame && (
            <>
              <QuantityInput
                title="Enchère"
                min={minEnchere()}
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
                disabled={isDisabled()}
                variant="contained"
                size="large"
                color="inherit"
                startIcon={<Iconify icon="solar:user-hand-up-bold-duotone" />}
              >
                {isDisabled() ? "Enchére max atteinte" : "Enchérir"}
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
          <Box sx={{ pt: "40vh", position: "relative" }}>
            {timeLeft > 0 && renderStatus}
            {timeLeft > 0 && renderPrice}
            {timeLeft <= 0 && product.encheres && renderWinner}
            {renderImg}
          </Box>
          {timeLeft > 0 && <LinearProgress color={"error"} />}
          <Box
            sx={{
              p: (theme) => `${theme.spacing(3)}`,
              maxHeight: "50vh",
              overflowY: "auto",
            }}
          >
            <Typography variant="h3">
              {product.firstname} "{product.nickname}" {product.name}
            </Typography>
            <Divider
              variant="fullWidth"
              sx={{ my: (theme) => `${theme.spacing(1)}` }}
            />
            <Box>
              <Stack>
                <Typography>
                  <strong>Poste</strong> : {product.post}
                  <br />
                  <strong>Maison d'appartenance </strong>:{" "}
                  {cerclesData[cercleId].name}
                  <br />
                  <strong>Teneur en taule</strong> : {product.teneurTaule}
                  <br />
                  <strong>État civil</strong> : {product.etatCivil}
                  <br />
                  <strong>Age</strong> : {product.age}
                  <br />
                  <strong>Nombre d'étoiles</strong> :{" "}
                  {Array.from({ length: product.nbEtoiles }, (_, i) => (
                    <span key={i}>★</span>
                  ))}
                  <br />
                  <strong>Point fort</strong> : {product.pointFort}
                  <br />
                  <strong>Point faible </strong>: {product.pointFaible}
                  <br />
                  <strong>Est le seul</strong> : {product.estLeSeul}
                </Typography>
                {displayVote && isInTimeFrame && (
                  <Stack
                    spacing={1}
                    sx={{ my: (theme) => `${theme.spacing(1)}` }}
                  >
                    <QuantityInput
                      title="Enchère"
                      min={minEnchere()}
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
                      disabled={isDisabled()}
                      variant="contained"
                      size="large"
                      fullWidth
                      color="inherit"
                      startIcon={
                        <Iconify icon="solar:user-hand-up-bold-duotone" />
                      }
                    >
                      {isDisabled() ? "Enchére max atteinte" : "Enchérir"}
                    </LoadingButton>
                    {voteError && (
                      <Alert sx={{ mt: 3 }} severity={voteErrorSeverity}>
                        {voteError}
                      </Alert>
                    )}
                  </Stack>
                )}

                <EncheresList
                  encheres={product.encheres}
                  cerclesData={cerclesData}
                  won={timeLeft <= 0 && product.encheres}
                />

                <LoadingButton
                  onClick={handleClose}
                  variant="contained"
                  size="large"
                  fullWidth
                  color="error"
                >
                  Fermer
                </LoadingButton>
              </Stack>
            </Box>
          </Box>
        </Card>
      </Modal>
    </>
  );
}
