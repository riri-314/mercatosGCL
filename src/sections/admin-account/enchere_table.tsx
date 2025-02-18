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
import { doc, DocumentData, updateDoc } from "@firebase/firestore";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";
import { db } from "../../firebase_config";
import WarningModal from "../../components/modal/warning_modal";
import { Avatar } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";

interface enchereTableProps {
  data: DocumentData;
  admin: boolean;
  refetchData: () => void;
  error: (error: string) => void;
  handleOpenModalEnchere: (id: number) => void;
}

export default function EncheresTable({
  data,
  admin,
  refetchData,
  error,
  handleOpenModalEnchere,
}: enchereTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);
  const { user } = useAuth();

  const enchereDataArray: any[] = [];

  // date, sender, receiver, amount

  let cerclesNames: { [key: string]: string } = {};
  if (data.data().cercles) {
    Object.entries(data.data().cercles).forEach((cercle: any) => {
      cerclesNames[cercle[0]] = cercle[1].name;
    });
  }
  if (admin) {
    Object.entries(data.data().cercles).forEach((cercle: any) => {
      Object.entries(cercle[1].comitards).forEach((comitard: any) => {
        //
        //comitard[0] is the comitard id
        if (comitard[1].encheres != undefined) {
          Object.entries(comitard[1].encheres).forEach((enchere: any) => {
            const test = {
              id: enchere[0],
              date: enchere[1].date,
              sender: enchere[1].sender,
              senderName: cerclesNames[enchere[1].sender],
              receiver: comitard[0],
              receiverName:
                comitard[1].firstname +
                " " +
                comitard[1].nickname +
                " " +
                comitard[1].name,
              receiverPicture: comitard[1].picture,
              receiverCercle: cercle[1].name,
              amount: enchere[1].vote,
            };
            //console.log("test: ", test);
            enchereDataArray.push(test);
          });
        }
        //
      });
    });
  } else {
    Object.entries(data.data().cercles).forEach((cercle: any) => {
      Object.entries(cercle[1].comitards).forEach((comitard: any) => {
        //
        //comitard[0] is the comitard id

        if (comitard[1].encheres != undefined) {
          Object.entries(comitard[1].encheres).forEach((enchere: any) => {
            if (enchere[1].sender == user?.uid) {
              const test = {
                id: enchere[0],
                date: enchere[1].date,
                sender: enchere[1].sender,
                senderName: cerclesNames[enchere[1].sender],
                receiver: comitard[0],
                receiverName:
                  comitard[1].firstname +
                  " " +
                  comitard[1].nickname +
                  " " +
                  comitard[1].name,
                receiverPicture: comitard[1].picture,
                receiverCercle: cercle[1].name,
                amount: enchere[1].vote,
              };
              //console.log("test: ", test);
              enchereDataArray.push(test);
            }
          });
        }
        //
      });
    });
  }

  //console.log("enchereDataArray: ", enchereDataArray);

  async function handleClick(comitardUid: string, cercleUid: string) {
    setLoading(true);
    try {
      const docRef = doc(db, "editions", data.id);

      const cercles = data.data()?.cercles;
      if (cercles && cercles[cercleUid]) {
        delete cercles[cercleUid].comitards[comitardUid];
        await updateDoc(docRef, { cercles });
      }
      setLoading(false);
      refetchData();

      setOpenModal(false);
    } catch (errorMessage) {
      error("Error while deleting comitard");
      setLoading(false);
      setOpenModal(false);

      console.error("Error deleting comitard:", error);
    }
  }

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "picture",
      headerName: "Photo",
      width: 150,
      renderCell: (params) => {
        return (
          <>
            <Avatar src={params.row.receiverPicture} />
          </>
        );
      },
    },
    {
      field: "senderName",
      headerName: "Nom de l'enchèrisseur",
      minWidth: 200,
      editable: false,
    },
    {
      field: "receiverName",
      headerName: "Nom du comitard",
      minWidth: 200,
      editable: false,
    },
    {
      field: "receiverCercle",
      headerName: "Cercle du comitard",
      minWidth: 150,
      editable: false,
    },
    {
      field: "amount",
      headerName: "Montant",
      type: "number",
      minWidth: 50,
      editable: false,
    },
  ];

  if (false) {
    columns.push(
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
              onClick={() => handleOpenModalEnchere(rowData)}
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
                params.row.cercleId,
                "Êtes-vous sûr de vouloir supprimer ce comitard? Cela va supprimer le comitard et toutes les données associées. Cette action est irreversible et dangeureuse.",
              ]);
            }}
            variant="contained"
          >
            Supprimer
          </LoadingButton>
        ),
      }
    );
  }

  return (
    <>
      <Box sx={{ height: 400, width: 1 }}>
        <DataGrid
          rows={enchereDataArray}
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
