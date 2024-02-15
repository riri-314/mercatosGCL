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
  const cercleDataArray = Object.keys(data.data().cercles).map(
    (id: string) => ({ id, ...data.data().cercles[id] })
  );
  //console.log(cercleDataArray);

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
        loading={loading}
        color="secondary"
        onClick={async () => {
          setLoading(true);
          const addMessage = httpsCallable(functions, "deactivateUser");
          addMessage({ uid: params.row.id })
            .then((result) => {
              console.log("result: ", result);
              refetchData();
              setLoading(false);
            })
            .catch((errorMessage) => {
              console.log("error:", errorMessage);
              error("Error while deleting cercle");
              setLoading(false);
            });
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
          loading={loading}
          color="error"
          onClick={async () => {
            setLoading(true);
            const addMessage = httpsCallable(functions, "deleteUser");
            addMessage({ uid: params.row.id })
              .then((result) => {
                console.log("result: ", result);
                refetchData();
                setLoading(false);
              })
              .catch((errorMessage) => {
                console.log("error:", errorMessage);
                error("Error while deleting cercle");
                setLoading(false);
              });
          }}
          variant="contained"
        >
          Supprimer
        </LoadingButton>
      ),
    },
  ];

  return (
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
  );
}
