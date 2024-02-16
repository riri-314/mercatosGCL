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
import { Avatar } from "@mui/material";

interface ComitardTableProps {
  data: DocumentData;
  refetchData: () => void;
  error: (error: string) => void;
  handleOpenModalComitard: (id: number) => void;
}

export default function ComitardTable({
  data,
  refetchData,
  error,
  handleOpenModalComitard,
}: ComitardTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);

  const cercleDataArray: any[] = [];

  //console.log("data test: ", data.data().cercles);

  Object.entries(data.data().cercles).forEach((cercle: any) => {
    //console.log("cercle: ", cercle);
    Object.entries(cercle[1].comitards).forEach((comitard: any) => {
        comitard[1].cercle = cercle[1].name;
        comitard[1].id = comitard[0];
      //console.log("comitard: ", comitard);
      cercleDataArray.push(comitard[1]);
    });
  });

  console.log(cercleDataArray);

  function handleClick(uid: string, functionName: string) {
    //delete th elogin of the user, not it's data
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
        field: "picture",
        headerName: "Phtot",
        width: 200,
        renderCell: (params) => {
          return (
            <>
              <Avatar src={params.row.picture} />
              {params.value.name}
            </>
          );
        }
      },
    {
      field: "name",
      headerName: "Nom",
      minWidth: 200,
      editable: false,
    },
    {
      field: "firstname",
      headerName: "Prénom",
      minWidth: 150,
      editable: false,
    },
    {
      field: "nickname",
      headerName: "Surnom",
      minWidth: 150,
      editable: false,
    },
    {
      field: "post",
      headerName: "Post",
      minWidth: 150,
      editable: false,
    },
    {
      field: "cercle",
      headerName: "maison d'appartenance",
      minWidth: 150,
      editable: false,
    },
    {
      field: "teneurTaule",
      headerName: "Teneur en taule",
      type: "number",
      minWidth: 150,
      editable: false,
    },
    {
      field: "etatCivil",
      headerName: "État civil",
      minWidth: 150,
      editable: false,
    },
    {
      field: "age",
      headerName: "Age",
      type: "number",
      minWidth: 150,
      editable: false,
    },
    {
      field: "nbEtoiles",
      headerName: "Nombre d'étoiles",
      type: "number",
      minWidth: 150,
      editable: false,
    },
    {
      field: "pointFort",
      headerName: "Point Fort",
      minWidth: 150,
      editable: false,
    },
    {
      field: "pointFaible",
      headerName: "Point Faible",
      minWidth: 150,
      editable: false,
    },
    {
      field: "estLeSeul",
      headerName: "Est le seul",
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
            onClick={() => handleOpenModalComitard(rowData)}
            color="inherit"
          />,
        ];
      },
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
              "deleteComitard",
              "Êtes-vous sûr de vouloir supprimer ce comitard? Cela va supprimer le comitard et toutes les données associées. Cette action est irreversible et dangeureuse.",
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
