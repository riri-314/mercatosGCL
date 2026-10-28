import { ResponsiveRecords } from "../../components/account/mobile-record-list";
import RecordCard from "../../components/account/record-card";
import { Button, Typography } from "@mui/material";
import { getEditionData } from "../../data/edition-data";
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
import { deleteField, doc, DocumentData, updateDoc } from "firebase/firestore";
import { LoadingButton } from "@mui/lab";
import { useMemo, useState } from "react";
import { db } from "../../firebase_config";
import WarningModal from "../../components/modal/warning_modal";
import ProfileAvatar from "../../components/profile-avatar/profile-avatar";
import { useAuth } from "../../auth/AuthProvider";

interface ComitardTableProps {
  data: DocumentData;
  admin: boolean;
  refetchData: () => void;
  handleOpenModalComitard: (row: DocumentData) => void;
}

export default function ComitardTable({
  data,
  admin,
  refetchData,
  handleOpenModalComitard,
}: ComitardTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const [openModal, setOpenModal] = useState<boolean>(false);
  const [modalData, setModalData] = useState<any | null>([]);
  const [error, setError] = useState<string | null>(null);
  const [done, setDone] = useState<boolean>(false);
  const { user } = useAuth();

  const cercleDataArray = useMemo(() => {
    const rows: DocumentData[] = [];
    const cercles = getEditionData(data)?.cercles ?? {};
    for (const [cercleId, cercle] of Object.entries<DocumentData>(cercles)) {
      if (!admin && cercleId !== user?.uid) continue;
      for (const [id, comitard] of Object.entries<DocumentData>(
        cercle.comitards ?? {},
      )) {
        rows.push({ ...comitard, id, cercle: cercle.name, cercleId });
      }
    }
    return rows;
  }, [data, admin, user?.uid]);

  async function handleClick(comitardUid: string, cercleUid: string) {
    setLoading(true);
    setDone(false);
    setError(null);
    try {
      const docRef = doc(db, "editions", data.id);

      // Targeted delete of just this comitard. Writing back the whole `cercles`
      // map from the (possibly stale) page snapshot would clobber concurrent
      // bids / nbFut changes made since the page loaded.
      await updateDoc(docRef, {
        [`cercles.${cercleUid}.comitards.${comitardUid}`]: deleteField(),
      });
      setLoading(false);
      refetchData();
      setDone(true);
    } catch (errorMessage) {
      setError(`Error while deleting comitard. See console for more info.`);
      setLoading(false);
      console.error("Error deleting comitard:", errorMessage);
    }
  }

  const columns: GridColDef[] = [
    { field: "id", headerName: "ID", width: 90 },
    {
      field: "picture",
      headerName: "Photo",
      width: 64,
      renderCell: (params) => {
        return (
          <>
            <ProfileAvatar
              picture={params.row.picture}
              thumbnail={params.row.pictureThumbnail}
            />
          </>
        );
      },
    },
    {
      field: "name",
      headerName: "Nom",
      minWidth: 150,
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
  ];

  if (admin) {
    columns.push({
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
              params.row.cercleId,
              "Êtes-vous sûr de vouloir supprimer ce comitard? Cela va supprimer le comitard et toutes les données associées. Cette action est irreversible et dangeureuse.",
            ]);
          }}
          variant="contained"
        >
          Supprimer
        </LoadingButton>
      ),
    });
  }

  return (
    <>
      <ResponsiveRecords
        rows={cercleDataArray}
        label="les comitards"
        getKey={(row) => `${row.cercleId}/${row.id}`}
        getSearchText={(row) =>
          `${row.firstname} ${row.name} ${row.nickname} ${row.cercle} ${row.post}`
        }
        sortOptions={[
          {
            value: "name",
            label: "Nom A–Z",
            compare: (a, b) =>
              `${a.name} ${a.firstname}`.localeCompare(
                `${b.name} ${b.firstname}`,
                "fr",
              ),
          },
          {
            value: "circle",
            label: "Cercle A–Z",
            compare: (a, b) =>
              String(a.cercle).localeCompare(String(b.cercle), "fr"),
          },
        ]}
        renderItem={(row) => (
          <RecordCard
            title={`${row.firstname} ${row.name}`}
            subtitle={[
              row.nickname && `« ${row.nickname} »`,
              admin && row.cercle,
            ]
              .filter(Boolean)
              .join(" · ")}
            avatar={
              <ProfileAvatar
                alt={`${row.firstname} ${row.name}`}
                picture={row.picture}
                thumbnail={row.pictureThumbnail}
                sx={{ width: 44, height: 44, flexShrink: 0 }}
              />
            }
            details={
              <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                {row.post}
              </Typography>
            }
            actions={
              <Button
                variant="outlined"
                onClick={() => handleOpenModalComitard(row)}
              >
                Modifier
              </Button>
            }
            moreActions={
              admin
                ? [
                    {
                      label: "Supprimer le comitard",
                      destructive: true,
                      disabled: row.active,
                      onClick: () => {
                        setModalData([
                          row.id,
                          row.cercleId,
                          `Supprimer ${row.firstname} ${row.name} et toutes ses données ? Cette action est irréversible.`,
                        ]);
                        setDone(false);
                        setError(null);
                        setOpenModal(true);
                      },
                    },
                  ]
                : []
            }
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
                columnVisibilityModel: {
                  id: false,
                  post: false,
                  teneurTaule: false,
                  etatCivil: false,
                  age: false,
                  nbEtoiles: false,
                  pointFort: false,
                  pointFaible: false,
                  estLeSeul: false,
                },
              },
            }}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
              },
            }}
            getRowId={(row: any) => `${row.cercleId}/${row.id}`}
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
