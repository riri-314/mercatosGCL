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
  error: (error: string) => void;
  handleOpenModalCercle: (id: number) => void;
}

export default function CercleTable({
  data,
  refetchData,
  error,
  handleOpenModalCercle,
}: CercleTableProps) {

  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);

  const cercleDataArray = Object.keys(data.data().cercles).map(
    (id: string) => ({ id, ...data.data().cercles[id] })
  );
  //console.log(cercleDataArray);

  function handleClick(uid: string, functionName: string) { //delete th elogin of the user, not it's data
    setLoading(true);
    const addMessage = httpsCallable(functions, functionName);
    addMessage({ uid: uid })
      .then((result) => {
        console.log("result: ", result);
        refetchData();
        setLoading(false);
        setOpenModal(false);
      })
      .catch((errorMessage) => {
        console.log("error:", errorMessage);
        error("Error while deleting cercle");
        setLoading(false);
        setOpenModal(false);
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
        disabled={params.row.active}
        color="secondary"
        onClick={() => {
          setOpenModal(true);
          setModalData([params.row.id, "deactivateCercle", "Êtes-vous sûr de vouloir désactiver ce cercle? Cela va uniquement désactiver le cercle, pas les données associées. Le cercle ne pourra plus se connecter. Cette action est irreversible"]);
        }}
        variant="contained"
      >
        Désactiver
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
            setModalData([params.row.id, "deleteCercle", "Êtes-vous sûr de vouloir supprimer ce cercle? Cela va supprimer le cercle et toutes les données associées. Cette action est irreversible et dangeureuse."]);
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
    <WarningModal  loading={loading} title="Attention!" message={modalData[2]} open={openModal} close={() => setOpenModal(false)} onProceed={() => handleClick(modalData[0], modalData[1])}/>
    </>
  );
}
