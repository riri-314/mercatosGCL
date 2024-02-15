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
import { setActiveEdition } from "../../utils/admin-tools";
import { LoadingButton } from "@mui/lab";
import { useState } from "react";

interface EditionTableProps {
  data: DocumentData[];
  refetchData: () => void;
  error: (error: string) => void;
  handleOpenModalEdition: (id: number) => void;
}

export default function QuickFilteringGrid({
  data,
  refetchData,
  error,
  handleOpenModalEdition,
}: EditionTableProps) {
  const [loading, setLoading] = useState<boolean>(false);

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
            const ret = await setActiveEdition(params.row.edition);
            if (!ret) {
                error("Error while setting active edition");
            }
            refetchData();
            setLoading(false);
          }}
          variant="contained"
        >
          Set Active
        </LoadingButton>
      ),
    },
  ];

  return (
    <Box sx={{ height: 400, width: 1 }}>
      <DataGrid
        rows={data.map((doc) => doc.data())}
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
        getRowId={(row: any) => row.edition}
      />

    </Box>
  );
}
