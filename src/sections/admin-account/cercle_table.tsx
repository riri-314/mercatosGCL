import { ResponsiveRecords } from "../../components/account/mobile-record-list";
import RecordCard from "../../components/account/record-card";
import { Alert, Button, Chip, Typography } from "@mui/material";
import { getEditionData } from "../../data/edition-data";
import { useEffect } from "react";
import Box from "@mui/material/Box";
import {
  DataGrid,
  frFR,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar,
} from "@mui/x-data-grid";
import Iconify from "../../components/iconify/iconify";
import { DocumentData } from "firebase/firestore";
import { LoadingButton } from "@mui/lab";
import { useMemo, useState } from "react";
import { httpsCallable } from "firebase/functions";
import { functions } from "../../firebase_functions";
import WarningModal from "../../components/modal/warning_modal";
import { useNavigate } from "react-router-dom";
import { becomeCercle } from "../../auth/become-cercle";

interface CercleTableProps {
  data: DocumentData;
  refetchData: () => void;
  handleOpenModalCercle: (row: DocumentData) => void;
  handleOpenModalMDP: (row: DocumentData) => void;
}

// faire charger boutton "désactiver"
// fetch activation status de chaque cercle depuis le backend
// mettre à jour le status du boutton activation
// ne plus faire charger le boutton

type StatusDict = { [key: string]: boolean };

export default function CercleTable({
  data,
  refetchData,
  handleOpenModalCercle,
  handleOpenModalMDP,
}: CercleTableProps) {
  const navigate = useNavigate();
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [statusDict, setStatusDict] = useState<StatusDict>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const [switchingId, setSwitchingId] = useState<string | null>(null);
  const [switchError, setSwitchError] = useState("");

  async function handleBecome(uid: string) {
    if (switchingId) return;
    setSwitchingId(uid);
    setSwitchError("");
    try {
      await becomeCercle(uid, data.id);
      navigate("/account", { replace: true });
    } catch (error: unknown) {
      setSwitchError(error instanceof Error ? error.message : "La connexion au cercle a échoué. Réessayez.");
    } finally {
      setSwitchingId(null);
    }
  }

  const becomeButton = (row: DocumentData) => (
    <LoadingButton
      variant="outlined"
      color="inherit"
      loading={switchingId === row.id}
      disabled={loadingStatus || isDisabled(row.id) || switchingId !== null}
      aria-label={`Se connecter en tant que ${row.name}`}
      onClick={() => void handleBecome(row.id)}
    >
      Se connecter
    </LoadingButton>
  );

  const fetchData = async () => {
    try {
      setLoadingStatus(true);
      // fetch getdisabledstatus
      const addMessage = httpsCallable(functions, "getdisabledstatus");
      await addMessage({ editionId: data.id }).then((result) => {
        const data: any = result.data;
        if (data && data.status) {
          console.log("Data fetched disbaled status:", data);
          setStatusDict(data.status);
        } else {
          console.error("Error fetching disabled status data:", data);
        }
      });
    } catch (error) {
      console.error("Error fetching data:", error);
    } finally {
      setLoadingStatus(false);
    }
  };

  useEffect(() => {
    fetchData();
  }, []);

  function isDisabled(id: string) {
    // return true if the cercle is disabled and loading status is false
    if (
      !loadingStatus &&
      Object.keys(statusDict).length &&
      statusDict[id] === true
    ) {
      return true;
    } else if (
      !loadingStatus &&
      Object.keys(statusDict).length &&
      statusDict[id] === false
    ) {
      return false;
    } else {
      return false;
    }
  }

  const cercleDataArray = useMemo<DocumentData[]>(
    () =>
      Object.entries(getEditionData(data)?.cercles ?? {}).map(
        ([id, cercle]) => ({ id, ...(cercle as DocumentData) }),
      ),
    [data],
  );

  function handleClick(uid: string, functionName: string) {
    //delete th elogin of the user, not it's data
    setLoading(true);
    setDone(false);
    setError(null);
    const addMessage = httpsCallable(functions, functionName);
    addMessage({ uid: uid, editionId: data.id })
      .then((result) => {
        console.log("result: ", result);
        refetchData();
        // refetch disabled status
        fetchData();
        setLoading(false);
        setDone(true);
      })
      .catch((errorMessage) => {
        console.log("error:", errorMessage);
        setLoading(false);
        setError(errorMessage?.message ?? "Erreur. Réessayez plus tard.");
      });
  }

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "description",
      headerName: "Déscription",
      minWidth: 200,
      editable: false,
    },
    {
      field: "name",
      headerName: "Nom",
      minWidth: 150,
      editable: false,
    },
    {
      field: "nbFut",
      headerName: "Nombre de futs restants",
      type: "number",
      minWidth: 150,
      editable: false,
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Éditer",
      minWidth: 100,
      cellClassName: "actions",
      getActions: (params: GridRowParams) => {
        const rowData = params.row;
        return [
          <GridActionsCellItem
            icon={<Iconify icon="ic:outline-edit" />}
            label="Edit"
            className="textPrimary"
            onClick={() => handleOpenModalCercle(rowData)}
            color="inherit"
          />,
        ];
      },
    },
    {
      field: "become",
      headerName: "Connexion",
      minWidth: 175,
      sortable: false,
      filterable: false,
      renderCell: (params) => becomeButton(params.row),
    },
    {
      field: "deactivate",
      headerName: "Desactiver",
      minWidth: 150,
      editable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <LoadingButton
          disabled={loadingStatus}
          color="secondary"
          onClick={() => {
            setDone(false);
            setError(null);
            setOpenModal(true);
            setModalData([
              params.row.id,
              isDisabled(params.row.id) ? "enableuser" : "disableuser",
              isDisabled(params.row.id)
                ? "Êtes-vous sûr de vouloir résactiver ce cercle? Le cercle devra changer son mot de passe pour pouvoir continuer à utiliser son compte"
                : "Êtes-vous sûr de vouloir désactiver ce cercle? Cela va uniquement désactiver le cercle, pas les données associées. Le cercle ne pourra plus se connecter. Cette action est réversible",
            ]);
          }}
          variant="contained"
        >
          {loadingStatus
            ? "Chargement"
            : isDisabled(params.row.id)
              ? "Activer"
              : "Désactiver"}
        </LoadingButton>
      ),
    },
    {
      field: "delete",
      headerName: "Supprimer",
      minWidth: 150,
      editable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <LoadingButton
          disabled={params.row.active}
          color="error"
          onClick={() => {
            setDone(false);
            setError(null);
            setOpenModal(true);
            setModalData([
              params.row.id,
              "deleteuser",
              "Êtes-vous sûr de vouloir supprimer ce cercle? Cela va supprimer le cercle et toutes les données associées pour cette édition (mais pas ses enchères). Cette action est irreversible et dangeureuse. Fait pas le con, on a déja perdu la MAF",
            ]);
          }}
          variant="contained"
        >
          Supprimer
        </LoadingButton>
      ),
    },
    {
      field: "mdp",
      type: "actions",
      headerName: "Changer mdp",
      minWidth: 150,
      cellClassName: "actions",
      getActions: (params: GridRowParams) => {
        const rowData = params.row;
        return [
          <GridActionsCellItem
            icon={<Iconify icon="ic:baseline-password" />}
            label="Edit"
            className="textPrimary"
            onClick={() => handleOpenModalMDP(rowData)}
            color="inherit"
          />,
        ];
      },
    },
  ];

  return (
    <>
      {switchError && <Alert severity="error" sx={{ mb: 2 }}>{switchError}</Alert>}
      <ResponsiveRecords
        rows={cercleDataArray}
        label="les cercles"
        getKey={(row) => row.id}
        getSearchText={(row) => `${row.name} ${row.description}`}
        sortOptions={[
          {
            value: "name",
            label: "Nom A–Z",
            compare: (a, b) =>
              String(a.name).localeCompare(String(b.name), "fr"),
          },
          {
            value: "balance",
            label: "Fûts restants",
            compare: (a, b) => (b.nbFut ?? 0) - (a.nbFut ?? 0),
          },
        ]}
        renderItem={(row) => (
          <RecordCard
            title={row.name}
            subtitle={row.description}
            details={
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 1,
                }}
              >
                <Typography sx={{ fontSize: 14, fontWeight: 600 }}>
                  {row.nbFut ?? 0} fûts
                </Typography>
                <Chip
                  size="small"
                  label={
                    loadingStatus
                      ? "Statut…"
                      : isDisabled(row.id)
                        ? "Désactivé"
                        : "Actif"
                  }
                  color={isDisabled(row.id) ? "default" : "success"}
                  variant="outlined"
                />
              </Box>
            }
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenModalCercle(row)}
                >
                  Modifier
                </Button>
                {becomeButton(row)}
              </>
            }
            moreActions={[
              {
                label: "Changer le mot de passe",
                onClick: () => handleOpenModalMDP(row),
              },
              {
                label: isDisabled(row.id)
                  ? "Activer le compte"
                  : "Désactiver le compte",
                disabled: loadingStatus,
                onClick: () => {
                  setModalData([
                    row.id,
                    isDisabled(row.id) ? "enableuser" : "disableuser",
                    isDisabled(row.id)
                      ? `Réactiver le compte ${row.name} ?`
                      : `Désactiver le compte ${row.name} ? Le cercle ne pourra plus se connecter. Ses données seront conservées.`,
                  ]);
                  setDone(false);
                  setError(null);
                  setOpenModal(true);
                },
              },
              {
                label: "Supprimer le cercle",
                destructive: true,
                disabled: row.active,
                onClick: () => {
                  setModalData([
                    row.id,
                    "deleteuser",
                    `Supprimer ${row.name} et ses données pour cette édition ? Cette action est irréversible.`,
                  ]);
                  setDone(false);
                  setError(null);
                  setOpenModal(true);
                },
              },
            ]}
          />
        )}
      >
        <Box sx={{ height: 400, width: 1 }}>
          <DataGrid
            rows={cercleDataArray}
            disableColumnFilter
            disableDensitySelector
            columns={columns}
            initialState={{
              columns: {
                columnVisibilityModel: { id: false, description: false },
              },
            }}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            getRowId={(row: any) => row.id}
          />
        </Box>
      </ResponsiveRecords>
      <WarningModal
        error={error}
        done={done}
        loading={loading}
        title="Attention!"
        message={modalData[2]}
        open={openModal}
        close={() => setOpenModal(false)}
        onProceed={() => handleClick(modalData[0], modalData[1])}
      />
    </>
  );
}
