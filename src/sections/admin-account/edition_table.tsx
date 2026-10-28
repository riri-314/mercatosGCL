import type { DocumentData } from "firebase/firestore";
import { ResponsiveRecords } from "../../components/account/mobile-record-list";
import RecordCard from "../../components/account/record-card";
import { Button, Chip, Typography } from "@mui/material";
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
import type { useEditionHistory } from "../../data/use-edition-history";
import Stack from "@mui/material/Stack";
import Alert from "@mui/material/Alert";
import { setActiveEdition } from "../../utils/admin-tools";
import { LoadingButton } from "@mui/lab";
import { useMemo, useState } from "react";

interface EditionTableProps {
  history: ReturnType<typeof useEditionHistory>;
  refetchData: () => void;
  error: (error: string) => void;
  handleOpenModalEdition: (row: DocumentData) => void;
}

export default function QuickFilteringGrid({
  history,
  refetchData,
  error,
  handleOpenModalEdition,
}: EditionTableProps) {
  const [loading, setLoading] = useState<boolean>(false);
  const rows = useMemo(
    () => history.rows.map((snapshot) => getEditionData(snapshot) ?? {}),
    [history.rows],
  );

  const columns: GridColDef[] = [
    { field: "edition", headerName: "ID", width: 90 },
    {
      field: "rules",
      headerName: "Règles",
      width: 150,
      editable: false,
    },
    {
      field: "start",
      headerName: "Début de l'édition",
      type: "number",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return new Date(params.value.seconds * 1000).toLocaleString();
      },
    },
    {
      field: "stop",
      headerName: "Fin de l'édition",
      type: "number",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return new Date(params.value.seconds * 1000).toLocaleString();
      },
    },
    {
      field: "nbFut",
      headerName: "Fûts par cercles",
      type: "number",
      width: 150,
      editable: false,
    },
    {
      field: "nbComitard",
      headerName: "Comitards par cercles",
      type: "number",
      width: 150,
      editable: false,
    },
    {
      field: "duration",
      headerName: "Durée d'une enchère",
      type: "number",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return String(params.value) + "h";
      },
    },
    {
      field: "enchereMin",
      headerName: "Enchère minimum",
      type: "number",
      width: 150,
      editable: false,
    },
    {
      field: "enchereMax",
      headerName: "Enchère maximum",
      type: "number",
      width: 150,
      editable: false,
    },
    {
      field: "remboursementVendeur",
      headerName: "Remboursement vente comitard",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return String(params.value * 100) + "%";
      },
    },
    {
      field: "remboursementPerdant",
      headerName: "Remboursement perdant d'une enchère",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return String(params.value * 100) + "%";
      },
    },
    {
      field: "remboursementGagnant",
      headerName: "Remboursement gagant d'une enchère",
      width: 150,
      editable: false,
      valueGetter: (params) => {
        if (!params.value) {
          return params.value;
        }
        // Convert the decimal value to a percentage
        return String(params.value * 100) + "%";
      },
    },
    {
      field: "active",
      headerName: "Active",
      width: 110,
      editable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <span>{params.value ? "✓" : "x"}</span>
      ),
    },
    {
      field: "actions",
      type: "actions",
      headerName: "Éditer",
      width: 100,
      cellClassName: "actions",
      getActions: (params: GridRowParams) => {
        const rowData = params.row;
        return [
          <GridActionsCellItem
            icon={<Iconify icon="ic:outline-edit" />}
            label="Edit"
            className="textPrimary"
            onClick={() => handleOpenModalEdition(rowData)}
            color="inherit"
          />,
        ];
      },
    },
    {
      field: "setActive",
      headerName: "Set Active",
      width: 150,
      editable: false,
      renderCell: (params: GridRenderCellParams<any, string>) => (
        <LoadingButton
          disabled={params.row.active}
          loading={loading}
          onClick={async () => {
            setLoading(true);
            error("");
            try {
              await setActiveEdition(params.row.edition);
              refetchData();
            } catch (cause: unknown) {
              error(
                cause instanceof Error
                  ? cause.message
                  : "Impossible d'activer cette édition.",
              );
            } finally {
              setLoading(false);
            }
          }}
          variant="contained"
        >
          Set Active
        </LoadingButton>
      ),
    },
  ];

  return (
    <>
      {history.error && (
        <Alert
          severity="error"
          action={<Button onClick={history.refresh}>Réessayer</Button>}
        >
          {history.error}
        </Alert>
      )}
      <ResponsiveRecords
        rows={rows}
        label="les éditions de cette page"
        getKey={(row) => row.edition}
        getSearchText={(row) => `${row.edition} ${row.rules ?? ""}`}
        loading={history.loading}
        paginate={false}
        sortOptions={[
          {
            value: "recent",
            label: "Les plus récentes",
            compare: (a, b) => b.edition - a.edition,
          },
          {
            value: "old",
            label: "Les plus anciennes",
            compare: (a, b) => a.edition - b.edition,
          },
        ]}
        renderItem={(row) => (
          <RecordCard
            title={`Édition ${row.edition}`}
            details={
              <>
                <Chip
                  size="small"
                  variant="outlined"
                  label={row.active ? "Active" : "Inactive"}
                  color={row.active ? "success" : "default"}
                  sx={{ alignSelf: "flex-start" }}
                />
                <Typography sx={{ fontSize: 12, color: "text.secondary" }}>
                  {row.start?.seconds
                    ? new Date(row.start.seconds * 1000).toLocaleDateString(
                        "fr-BE",
                      )
                    : "—"}{" "}
                  →{" "}
                  {row.stop?.seconds
                    ? new Date(row.stop.seconds * 1000).toLocaleDateString(
                        "fr-BE",
                      )
                    : "—"}
                </Typography>
              </>
            }
            actions={
              <>
                <Button
                  variant="outlined"
                  onClick={() => handleOpenModalEdition(row)}
                >
                  Modifier
                </Button>
                <LoadingButton
                  variant="contained"
                  disabled={row.active}
                  loading={loading}
                  onClick={async () => {
                    setLoading(true);
                    error("");
                    try {
                      await setActiveEdition(row.edition);
                      refetchData();
                    } catch (cause) {
                      error(
                        cause instanceof Error
                          ? cause.message
                          : "Impossible d’activer cette édition.",
                      );
                    } finally {
                      setLoading(false);
                    }
                  }}
                >
                  Activer
                </LoadingButton>
              </>
            }
          />
        )}
      >
        <Box sx={{ height: 400, width: 1 }}>
          <DataGrid
            rows={rows}
            loading={history.loading}
            hideFooter
            disableColumnFilter
            disableDensitySelector
            columns={columns}
            initialState={{
              columns: {
                columnVisibilityModel: {
                  rules: false,
                  nbFut: false,
                  nbComitard: false,
                  duration: false,
                  enchereMin: false,
                  enchereMax: false,
                  remboursementVendeur: false,
                  remboursementPerdant: false,
                  remboursementGagnant: false,
                },
              },
            }}
            localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
            slots={{ toolbar: GridToolbar }}
            slotProps={{
              toolbar: {
                showQuickFilter: true,
                quickFilterProps: { placeholder: "Filtrer cette page" },
              },
            }}
            getRowId={(row: any) => row.edition}
          />
        </Box>
      </ResponsiveRecords>
      <Stack
        direction="row"
        alignItems="center"
        justifyContent="space-between"
        spacing={2}
        sx={{ mt: 1 }}
      >
        <Button
          disabled={history.loading || history.page === 0}
          onClick={history.previous}
        >
          Précédent
        </Button>
        <span>Page {history.page + 1}</span>
        <Button
          disabled={history.loading || !history.hasNext}
          onClick={history.next}
        >
          Suivant
        </Button>
      </Stack>
    </>
  );
}
