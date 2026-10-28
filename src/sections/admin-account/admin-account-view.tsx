import { lazy, useState } from "react";
import {
  Alert,
  Box,
  Card,
  CardContent,
  Stack,
  Typography,
} from "@mui/material";
import { LoadingButton } from "@mui/lab";
import { getAuth, sendPasswordResetEmail } from "firebase/auth";
import { httpsCallable } from "firebase/functions";
import type { DocumentData } from "firebase/firestore";
import type { useEditionHistory } from "../../data/use-edition-history";
import { getEditionData } from "../../data/edition-data";
import { useAuth } from "../../auth/AuthProvider";
import { functions } from "../../firebase_functions";
import {
  lockAllPastEditions,
  resetEditionPasswords,
} from "../../utils/admin-tools";
import AccountTabs from "../../components/account/account-tabs";
import FormDialog from "../../components/account/form-dialog";
import DeferredPanel from "../../components/deferred-panel/deferred-panel";
import NewCercle from "./new_cercle";
import NewComitard from "./new_comitard";
import EditionTable from "./edition_table";
import CercleTable from "./cercle_table";
import ComitardTable from "./comitard_table";
import EncheresTable from "./enchere_table";
import EditionOperationStatus from "./edition-operation-status";

const NewEdition = lazy(() => import("./new_edition"));
const EditCercle = lazy(() => import("./edit_cercle"));
const EditComitard = lazy(() => import("./edit_comitard"));
const EditEnchere = lazy(() => import("./edit_enchere"));
const EditMDP = lazy(() => import("./edit_mdp"));

type EditKind = "edition" | "cercle" | "password" | "comitard" | "enchere";
const titles: Record<EditKind, string> = {
  edition: "Modifier l’édition",
  cercle: "Modifier le cercle",
  password: "Mot de passe du cercle",
  comitard: "Modifier le comitard",
  enchere: "Modifier l’enchère",
};
interface AdminAccountProps {
  history: ReturnType<typeof useEditionHistory>;
  refetchData: () => void;
  activeData: DocumentData;
}

export default function AdminAccount({
  history,
  refetchData,
  activeData,
}: AdminAccountProps) {
  const { user } = useAuth();
  const [edit, setEdit] = useState<{
    kind: EditKind;
    row: DocumentData;
  } | null>(null);
  const [passwordResult, setPasswordResult] = useState("");
  const [resettingPasswords, setResettingPasswords] = useState(false);
  const [errorEditionEdit, setErrorEditionEdit] = useState("");
  const [lockingPast, setLockingPast] = useState(false);
  const [lockPastResult, setLockPastResult] = useState("");
  const [accountResult, setAccountResult] = useState("");
  const close = () => setEdit(null);

  return (
    <Box className="account-page">
      <Typography component="h1" variant="h4" sx={{ mb: 2 }}>
        Administration
      </Typography>
      <EditionOperationStatus refetchData={refetchData} />
      <AccountTabs
        sections={[
          {
            id: "comitards",
            label: "Comitards",
            content: (
              <>
                <NewComitard
                  data={activeData}
                  admin
                  refetchData={refetchData}
                />
                <ComitardTable
                  data={activeData}
                  admin
                  refetchData={refetchData}
                  handleOpenModalComitard={(row) =>
                    setEdit({ kind: "comitard", row: row })
                  }
                />
              </>
            ),
          },
          {
            id: "cercles",
            label: "Cercles",
            content: (
              <>
                <NewCercle
                  refetchData={refetchData}
                  editionId={activeData.id}
                />
                <CercleTable
                  data={activeData}
                  refetchData={refetchData}
                  handleOpenModalCercle={(row) =>
                    setEdit({ kind: "cercle", row: row })
                  }
                  handleOpenModalMDP={(row) =>
                    setEdit({ kind: "password", row: row })
                  }
                />
              </>
            ),
          },
          {
            id: "encheres",
            label: "Enchères",
            content: (
              <EncheresTable
                data={activeData}
                admin
                refetchData={refetchData}
                handleOpenModalEnchere={(row) =>
                  setEdit({ kind: "enchere", row: row })
                }
              />
            ),
          },
          {
            id: "editions",
            label: "Éditions",
            content: (
              <>
                <DeferredPanel title="Créer une nouvelle édition">
                  <NewEdition
                    data={getEditionData(activeData) ?? {}}
                    refetchData={refetchData}
                  />
                </DeferredPanel>
                <EditionTable
                  history={history}
                  refetchData={refetchData}
                  error={setErrorEditionEdit}
                  handleOpenModalEdition={(row) =>
                    setEdit({ kind: "edition", row: row })
                  }
                />
                {errorEditionEdit && (
                  <Alert sx={{ mt: 2 }} severity="error">
                    {errorEditionEdit}
                  </Alert>
                )}
              </>
            ),
          },
          {
            id: "settings",
            label: "Paramètres",
            content: (
              <Stack spacing={2}>
                <Card>
                  <CardContent>
                    <Typography variant="h6" sx={{ mb: 2 }}>
                      Mon compte
                    </Typography>
                    <LoadingButton
                      fullWidth
                      variant="outlined"
                      onClick={async () => {
                        try {
                          await sendPasswordResetEmail(
                            getAuth(),
                            user?.email ?? "",
                          );
                          setAccountResult(
                            "E-mail de réinitialisation envoyé.",
                          );
                        } catch {
                          setAccountResult(
                            "Impossible d’envoyer l’e-mail de réinitialisation.",
                          );
                        }
                      }}
                    >
                      Réinitialiser mon mot de passe
                    </LoadingButton>
                    {accountResult && (
                      <Alert sx={{ mt: 2 }} severity="info">
                        {accountResult}
                      </Alert>
                    )}
                  </CardContent>
                </Card>
                <Card>
                  <CardContent>
                    <Stack spacing={2}>
                      <Typography variant="h6">Gestion de l’édition</Typography>
                      <LoadingButton
                        fullWidth
                        variant="outlined"
                        color="warning"
                        loading={lockingPast}
                        onClick={async () => {
                          setLockingPast(true);
                          setLockPastResult("");
                          try {
                            const result = await lockAllPastEditions();
                            setLockPastResult(
                              result
                                ? "Photos des anciennes éditions sécurisées."
                                : "Erreur lors de la sécurisation des anciennes éditions.",
                            );
                          } catch {
                            setLockPastResult(
                              "Erreur lors de la sécurisation des anciennes éditions.",
                            );
                          } finally {
                            setLockingPast(false);
                          }
                        }}
                      >
                        Sécuriser les photos des anciennes éditions
                      </LoadingButton>
                      {lockPastResult && (
                        <Alert
                          severity={
                            lockPastResult.startsWith("Erreur")
                              ? "error"
                              : "success"
                          }
                        >
                          {lockPastResult}
                        </Alert>
                      )}
                      <LoadingButton
                        fullWidth
                        variant="outlined"
                        color="error"
                        loading={resettingPasswords}
                        onClick={async () => {
                          setResettingPasswords(true);
                          setPasswordResult("");
                          try {
                            await resetEditionPasswords(activeData.id);
                            setPasswordResult(
                              "Mots de passe réinitialisés et e-mails de récupération envoyés.",
                            );
                          } catch (cause) {
                            setPasswordResult(
                              cause instanceof Error
                                ? cause.message
                                : "La réinitialisation n’a pas abouti.",
                            );
                          } finally {
                            setResettingPasswords(false);
                          }
                        }}
                      >
                        Réinitialiser tous les mots de passe DANGER
                      </LoadingButton>
                      {passwordResult && (
                        <Alert severity="info">{passwordResult}</Alert>
                      )}
                      <LoadingButton
                        fullWidth
                        variant="outlined"
                        onClick={async () => {
                          const result = await httpsCallable(
                            functions,
                            "rembour",
                          )({ text: "Test super function" });
                          console.log("Remboursement :", result.data);
                        }}
                      >
                        Remboursement
                      </LoadingButton>
                    </Stack>
                  </CardContent>
                </Card>
              </Stack>
            ),
          },
        ]}
      />
      <FormDialog
        open={Boolean(edit)}
        onClose={close}
        title={edit ? titles[edit.kind] : "Modifier"}
      >
        {edit?.kind === "edition" && (
          <NewEdition
            data={edit.row}
            refetchData={refetchData}
            updateMode
            close={close}
          />
        )}
        {edit?.kind === "cercle" && (
          <EditCercle
            data={edit.row}
            editionId={activeData.id}
            refetchData={refetchData}
            close={close}
          />
        )}
        {edit?.kind === "password" && (
          <EditMDP
            data={edit.row}
            editionId={activeData.id}
            refetchData={refetchData}
            close={close}
          />
        )}
        {edit?.kind === "comitard" && (
          <EditComitard
            ComitardData={edit.row}
            activeData={activeData}
            admin
            refetchData={refetchData}
            close={close}
          />
        )}
        {edit?.kind === "enchere" && (
          <EditEnchere
            data={activeData}
            enchereData={edit.row}
            refetchData={refetchData}
            close={close}
          />
        )}
      </FormDialog>
    </Box>
  );
}
