import Stack from "@mui/material/Stack";
import Typography from "@mui/material/Typography";
import Card from "@mui/material/Card";
import { Box, CardContent, Grid, TextField } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { LoadingButton } from "@mui/lab";
import {
  editEdition,
  newComitard,
  newEdition,
  removeComitard,
} from "../../utils/admin-tools";
import { useState } from "react";
import { DocumentData } from "@firebase/firestore";

export default function AdminAccount({data}: DocumentData) {
  const user = useAuth();
  const [newEditionLoading, setNewEditionLoading] = useState(false);
  const [editEditionLoading, setEditEditionLoading] = useState(false);
  const [newComiatrdLoading, setNewComitardLoading] = useState(false);
  const [removeComiatrdLoading, setRemoveComitardLoading] = useState(false);

  return (
    <>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        mb={5}
      >
        <Typography variant="h4" sx={{ mb: 1 }}>
          Hi, Welcome back {user && user?.email} 👋
        </Typography>
      </Stack>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Create new event {"->"} add cercle ? {"->"} start and stop dates{" "}
          {"->"} edit description ? (precise that start and stop dates are shown
          by default) <br />
          Table listing events and which one is active <br />
        </CardContent>
      </Card>
      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Créer nouveau cercle
          </Typography>
          <Box component="form" noValidate autoComplete="off">
            <Grid container spacing={2}>
              <Grid item xs={12} sm={4}>
                <TextField label="Nom du cercle" color="success" fullWidth />
              </Grid>
              <Grid item xs={12} sm={4}>
                <TextField
                  label="Description"
                  multiline
                  maxRows={4}
                  fullWidth
                />
              </Grid>
              <Grid item xs={12} sm={4}>
                <LoadingButton size="large" variant="contained" fullWidth>
                  Créer cercle
                </LoadingButton>
              </Grid>
            </Grid>
          </Box>
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          <Typography variant="h5" sx={{ mb: 1 }}>
            Éditer, supprimer cercle
          </Typography>
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Add/Edit/Remove comitard <br />
        </CardContent>
      </Card>

      <Card sx={{ width: "100%", mb: 4 }}>
        <CardContent>
          Debug card <br />
          Init db <br />
          <LoadingButton
            loading={newEditionLoading}
            onClick={async () => {
              setNewEditionLoading(true);
              await newEdition(
                "ddd",
                new Date("2022-03-25"),
                new Date("2022-03-30"),
                100
              );
              setNewEditionLoading(false);
            }}
          >
            New edition
          </LoadingButton>
          <LoadingButton
            loading={editEditionLoading}
            onClick={async () => {
              setEditEditionLoading(true);
              await editEdition("Tq3co1gQYRzW6cgNsXK0", {
                name: "test",
                start: new Date("2022-03-25"),
                end: new Date("2022-03-30"),
                maxComitards: 100,
              });
              setEditEditionLoading(false);
            }}
          >
            Edit edition
          </LoadingButton>
          <LoadingButton
            loading={newComiatrdLoading}
            onClick={async () => {
              setNewComitardLoading(true);
              await newComitard("Tq3co1gQYRzW6cgNsXK0", {
                name: "test",
                email: "fff",
              });
              setNewComitardLoading(false);
            }}
          >
            New comitard
          </LoadingButton>
          <LoadingButton
            loading={removeComiatrdLoading}
            onClick={async () => {
              setRemoveComitardLoading(true);
              await removeComitard(
                "Tq3co1gQYRzW6cgNsXK0",
                "85Xzv2z95pKp1vomfwq3"
              );
              setRemoveComitardLoading(false);
            }}
          >
            Remove comitard
          </LoadingButton>
        </CardContent>
      </Card>
    </>
  );
}
