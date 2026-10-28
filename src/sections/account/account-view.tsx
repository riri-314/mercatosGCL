import { lazy, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Chip,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import type { DocumentData } from "firebase/firestore";
import { getEditionData } from "../../data/edition-data";
import { useAuth } from "../../auth/auth-context";
import { useBoundaryTime } from "../../hooks/use-boundary-time";
import AccountTabs from "../../components/account/account-tabs";
import FormDialog from "../../components/account/form-dialog";
import NewComitard from "../admin-account/new_comitard";
import ComitardTable from "../admin-account/comitard_table";
import EncheresTable from "../admin-account/enchere_table";

const EditComitard = lazy(() => import("../admin-account/edit_comitard"));
interface AccountProps {
  data: DocumentData;
  refetchData: () => void;
}

export default function Account({ data, refetchData }: AccountProps) {
  const { user } = useAuth();
  const edition = getEditionData(data) ?? {};
  const circle = user ? edition.cercles?.[user.uid] : undefined;
  const count = Object.keys(circle?.comitards ?? {}).length;
  const maximum = edition.nbComitard ?? 0;
  const now = useBoundaryTime(
    edition.start?.toMillis() ?? null,
    edition.stop?.toMillis() ?? null,
  );
  const ended = now >= (edition.stop?.toMillis() ?? 0);
  const canCreate = !ended && count < maximum;
  const [editing, setEditing] = useState<DocumentData | null>(null);
  const [passwordResult, setPasswordResult] = useState("");

  return (
    <Box className="account-page">
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          gap: 2,
          mb: 2,
        }}
      >
        <Box sx={{ minWidth: 0 }}>
          <Typography component="h1" variant="h4">
            Mon cercle
          </Typography>
          <Typography
            sx={{
              color: "text.secondary",
              fontSize: 13,
              mt: 0.5,
              overflowWrap: "anywhere",
            }}
          >
            {circle?.name ?? user?.displayName}
          </Typography>
        </Box>
        <Chip
          label={`${circle?.nbFut ?? 0} fûts`}
          color="primary"
          variant="outlined"
          sx={{ flexShrink: 0 }}
        />
      </Box>
      <AccountTabs
        sections={[
          {
            id: "comitards",
            label: "Comitards",
            content: (
              <>
                <Alert severity={canCreate ? "info" : "warning"} sx={{ mb: 2 }}>
                  {ended
                    ? "Les inscriptions sont terminées."
                    : canCreate
                      ? `${count} / ${maximum} comitards inscrits. Vous pouvez encore en ajouter ${maximum - count}.`
                      : `Limite de ${maximum} comitards atteinte.`}
                </Alert>
                {canCreate && (
                  <NewComitard
                    data={data}
                    admin={false}
                    refetchData={refetchData}
                  />
                )}
                <ComitardTable
                  data={data}
                  admin={false}
                  refetchData={refetchData}
                  handleOpenModalComitard={(row) => setEditing(row)}
                />
              </>
            ),
          },
          {
            id: "encheres",
            label: "Enchères",
            content: (
              <EncheresTable
                data={data}
                admin={false}
                refetchData={refetchData}
                handleOpenModalEnchere={() => undefined}
              />
            ),
          },
          {
            id: "settings",
            label: "Compte",
            content: (
              <Card>
                <CardContent>
                  <Stack spacing={2}>
                    <Typography variant="h6">Mot de passe</Typography>
                    <LoadingButton
                      variant="outlined"
                      fullWidth
                      onClick={async () => {
                        try {
                          await sendPasswordResetEmail(
                            getAuth(),
                            user?.email ?? "",
                          );
                          setPasswordResult(
                            "E-mail de réinitialisation envoyé.",
                          );
                        } catch {
                          setPasswordResult(
                            "Impossible d’envoyer l’e-mail de réinitialisation.",
                          );
                        }
                      }}
                    >
                      Réinitialiser le mot de passe
                    </LoadingButton>
                    {passwordResult && (
                      <Alert severity="info">{passwordResult}</Alert>
                    )}
                  </Stack>
                </CardContent>
              </Card>
            ),
          },
        ]}
      />
      <FormDialog
        open={Boolean(editing)}
        title="Modifier le comitard"
        onClose={() => setEditing(null)}
      >
        {editing && (
          <EditComitard
            ComitardData={editing}
            activeData={data}
            admin={false}
            refetchData={refetchData}
            close={() => setEditing(null)}
          />
        )}
      </FormDialog>
    </Box>
  );
}
