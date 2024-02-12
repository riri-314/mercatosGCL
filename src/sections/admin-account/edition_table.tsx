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

interface EditionTableProps {
  data: DocumentData[];
}

export default function QuickFilteringGrid({ data }: EditionTableProps) {
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
      headerName: "Actions",
      width: 100,
      cellClassName: "actions",
      getActions: (params: GridRowParams) => {
        const rowData = params.row;
        return [
          <GridActionsCellItem
            icon={<Iconify icon="ic:outline-edit" />}
            label="Edit"
            className="textPrimary"
            onClick={() => console.log("edit", rowData)}
            color="inherit"
          />,
        ];
      },
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
