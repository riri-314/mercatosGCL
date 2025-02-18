import { Card, CardHeader, CardContent } from "@mui/material";
import { DataGrid } from "@mui/x-data-grid";
import { frFR } from "@mui/x-data-grid";

const ResultGrid = ({ title, rows, columns }) => {
    return (
        <Card>
            <CardHeader title={title} />
            <CardContent>
                <DataGrid
                    localeText={frFR.components.MuiDataGrid.defaultProps.localeText}
                    sx={{ minHeight: "46rem" }}
                    rows={rows}
                    columns={columns}
                    initialState={{
                        pagination: {
                            paginationModel: { page: 0, pageSize: 12 },
                        },
                    }}
                    pageSizeOptions={[12, 30, 50]}
                    disableColumnMenu
                />
            </CardContent>
        </Card>
    );
};

export default ResultGrid;
