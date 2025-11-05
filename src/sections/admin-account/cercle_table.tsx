import { useEffect } from "react";
import Box from "@mui/material/Box";
import {
  DataGrid,
  GridActionsCellItem,
  GridColDef,
  GridRenderCellParams,
  GridRowParams,
  GridToolbar,
} from "@mui/x-data-grid";
import Iconify from "../../components/iconify/iconify";
import { DocumentData } from "@firebase/firestore";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { httpsCallable } from "@firebase/functions";
import { functions } from "../../firebase_config";
import WarningModal from "../../components/modal/warning_modal";

interface CercleTableProps {
  data: DocumentData;
  refetchData: () => void;
  handleOpenModalCercle: (id: number) => void;
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
}: CercleTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);
  const [loadingStatus, setLoadingStatus] = useState<boolean>(true);
  const [statusDict, setStatusDict] = useState<StatusDict>({});
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);

  const fetchData = async () => {
    try {
      setLoadingStatus(true);
      // fetch getdisabledstatus
      const addMessage = httpsCallable(functions, "getdisabledstatus");
      addMessage({ editionId: data.id }).then((result) => {
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

  const cercleDataArray = Object.keys(data.data().cercles).map(
    (id: string) => ({ id, ...data.data().cercles[id] })
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
        setError(`Error. Please try again later. See console for more info`);
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
      field: "deactivate",
      headerName: "Desactiver",
      minWidth: 150,
      editable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <LoadingButton
          disabled={loadingStatus}
          color="secondary"
          onClick={() => {
            setOpenModal(true);
            setModalData([
              params.row.id,
              isDisabled(params.row.id) ? "enableuser" : "disableuser",
               isDisabled(params.row.id) ? "Êtes-vous sûr de vouloir résactiver ce cercle? Le cercle devra changer son mot de passe pour pouvoir continuer à utiliser son compte" : "Êtes-vous sûr de vouloir désactiver ce cercle? Cela va uniquement désactiver le cercle, pas les données associées. Le cercle ne pourra plus se connecter. Cette action est réversible",
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
  ];

  return (
    <>
      <Box sx={{ height: 400, width: 1 }}>
        <DataGrid
          rows={cercleDataArray}
          disableColumnFilter
          disableColumnSelector
          disableDensitySelector
          columns={columns}
          slots={{ toolbar: GridToolbar }}
          slotProps={{
            toolbar: {
              showQuickFilter: true,
            },
          }}
          getRowId={(row: any) => row.id}
        />
      </Box>
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
