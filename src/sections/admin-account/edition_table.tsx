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
import type { useEditionHistory } from "../../data/use-edition-history";
import Stack from "@mui/material/Stack";
import Button from "@mui/material/Button";
import Alert from "@mui/material/Alert";
import {setActiveEdition} from "../../utils/admin-tools";
import {LoadingButton} from "@mui/lab";
import {useMemo, useState} from "react";

interface EditionTableProps {
    history: ReturnType<typeof useEditionHistory>;
    refetchData: () => void;
    error: (error: string) => void;
    handleOpenModalEdition: (id: number) => void;
}

export default function QuickFilteringGrid({
                                               history, refetchData, error, handleOpenModalEdition,
                                           }: EditionTableProps) {
    const [loading, setLoading] = useState<boolean>(false);
    const rows = useMemo(() => history.rows.map((snapshot) => getEditionData(snapshot) ?? {}), [history.rows]);

    const columns: GridColDef[] = [{field: "edition", headerName: "ID", width: 90}, {
        field: "rules", headerName: "Règles", width: 150, editable: false,
    }, {
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
    }, {
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
    }, {
        field: "nbFut", headerName: "Fûts par cercles", type: "number", width: 150, editable: false,
    }, {
        field: "nbComitard", headerName: "Comitards par cercles", type: "number", width: 150, editable: false,
    }, {
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
    }, {
        field: "enchereMin", headerName: "Enchère minimum", type: "number", width: 150, editable: false,
    }, {
        field: "enchereMax", headerName: "Enchère maximum", type: "number", width: 150, editable: false,
    }, {
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
    }, {
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
    }, {
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
    }, {
        field: "active",
        headerName: "Active",
        width: 110,
        editable: false,
        renderCell: (params: GridRenderCellParams<any, string>) => (<span>{params.value ? "✓" : "x"}</span>),
    }, {
        field: "actions",
        type: "actions",
        headerName: "Éditer",
        width: 100,
        cellClassName: "actions",
        getActions: (params: GridRowParams) => {
            const rowData = params.row;
            return [<GridActionsCellItem
                icon={<Iconify icon="ic:outline-edit"/>}
                label="Edit"
                className="textPrimary"
                onClick={() => handleOpenModalEdition(rowData)}
                color="inherit"
            />,];
        },
    }, {
        field: "setActive",
        headerName: "Set Active",
        width: 150,
        editable: false,
        renderCell: (params: GridRenderCellParams<any, string>) => (<LoadingButton
                disabled={params.row.active}
                loading={loading}
                onClick={async () => {
                    setLoading(true);
                    error("");
                    try {
                        await setActiveEdition(params.row.edition);
                        refetchData();
                    } catch (cause: unknown) {
                        error(cause instanceof Error ? cause.message : "Impossible d'activer cette édition.");
                    } finally {
                        setLoading(false);
                    }
                }}
                variant="contained"
            >
                Set Active
            </LoadingButton>),
    },];

    return (<>
        {history.error && <Alert severity="error" action={<Button onClick={history.refresh}>Réessayer</Button>}>{history.error}</Alert>}
        <Box sx={{height: 400, width: 1}}>
            <DataGrid
                rows={rows}
                loading={history.loading}
                hideFooter
                disableColumnFilter
                disableColumnSelector
                disableDensitySelector
                columns={columns}
                slots={{toolbar: GridToolbar}}
                slotProps={{
                    toolbar: {
                        showQuickFilter: true,
                        quickFilterProps: { placeholder: "Filtrer cette page" },
                    },
                }}
                getRowId={(row: any) => row.edition}
            />

        </Box>
        <Stack direction="row" alignItems="center" justifyContent="flex-end" spacing={2} sx={{ mt: 1 }}>
            <Button disabled={history.loading || history.page === 0} onClick={history.previous}>Précédent</Button>
            <span>Page {history.page + 1}</span>
            <Button disabled={history.loading || !history.hasNext} onClick={history.next}>Suivant</Button>
        </Stack>
    </>);
}
