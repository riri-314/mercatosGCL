import { getEditionData } from "../../data/edition-data";
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
import { DocumentData } from "firebase/firestore";
import { LoadingButton } from "@mui/lab";
import { useMemo, useState } from "react";
import WarningModal from "../../components/modal/warning_modal";
import { Avatar } from "@mui/material";
import { useAuth } from "../../auth/AuthProvider";
import { deleteEnchereWithStates } from "../../utils/admin-tools";

interface enchereTableProps {
  data: DocumentData;
  admin: boolean;
  refetchData: () => void;
  handleOpenModalEnchere: (id: number) => void;
}

export default function EncheresTable({
  data,
  admin,
  refetchData,
  handleOpenModalEnchere,
}: enchereTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const { user } = useAuth();

  const enchereDataArray = useMemo(() => {
    const rows: DocumentData[] = [];
    const cercles = getEditionData(data)?.cercles ?? {};
    for (const cercle of Object.values<DocumentData>(cercles)) {
      for (const [comitardId, comitard] of Object.entries<DocumentData>(cercle.comitards ?? {})) {
        for (const [id, enchere] of Object.entries<DocumentData>(comitard.encheres ?? {})) {
          if (!admin && enchere.sender !== user?.uid) continue;
          rows.push({
            id, date: enchere.date, sender: enchere.sender,
            senderName: cercles[enchere.sender]?.name,
            receiver: comitardId,
            receiverName: `${comitard.firstname} ${comitard.nickname} ${comitard.name}`,
            receiverPicture: comitard.picture,
            receiverCercle: cercle.name, amount: enchere.vote,
          });
        }
      }
    }
    return rows;
  }, [data, admin, user?.uid]);

  async function handleClick(enchereUid: string) {
    setLoading(true);
    setError(null);
    setDone(false);
    try {
      const res = await deleteEnchereWithStates(data, enchereUid, true);
      switch (res.status) {
        case "ok":
          // show success toast
          refetchData();
          setLoading(false);
          setDone(true);
          break;
        case "stale_client":
          // show "page is outdated" toast / dialog
          setLoading(false);
          setError("Page is outdated. Please refresh.");
          break;
        case "concurrent_write":
          // show "someone else changed it, please retry" toast
          setLoading(false);
          setError("Someone else changed it. Please retry.");
          break;
        case "error":
          // show generic error + maybe res.message
          setLoading(false);
          setError(`Error while deleting enchere, see console for more info.`);
          break;
      }
    } catch (errorMessage) {
      setLoading(false);
      setError(`Error while deleting enchere. See console for more info.`);
      console.error("Error deleting enchere:", error);
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
      field: "date",
      headerName: "Date",
      type: "dateTime",
      minWidth: 180,
      editable: false,
      valueGetter: (params) => {
        const value = params.value;
        if (!value) return null;

        // Firestore Timestamp object
        if (typeof value.toDate === "function") {
          return value.toDate();
        }

        // Serialized Firestore timestamp object
        if (value.seconds) {
          return new Date(value.seconds * 1000);
        }

        // Fallback for ISO strings or other formats
        return new Date(value);
      },
      valueFormatter: (params) => {
        const date = params.value;
        if (!date) return "";
        return date.toLocaleString(undefined, {
          year: "numeric",
          month: "short",
          day: "2-digit",
          hour: "2-digit",
          minute: "2-digit",
          second: "2-digit",
          hour12: false, // set true if you want 12-hour AM/PM format
        });
      },
    },

    {
      field: "amount",
      headerName: "Montant",
      type: "number",
      minWidth: 50,
      editable: false,
    },
  ];

  if (admin) {
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
            disabled={false}
            color="error"
            onClick={() => {
              setOpenModal(true);
              setModalData(params.row.id);
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
        done={done}
        error={error}
        loading={loading}
        title="Attention!"
        message={
          "Êtes-vous sûr de vouloir supprimer cette enchère? Le cercle enchérisseur sera remboursé. Cette action est irreversible et dangeureuse."
        }
        open={openModal}
        close={() => setOpenModal(false)}
        onProceed={() => handleClick(modalData)}
      />
    </>
  );
}
