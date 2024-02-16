import Box from "@mui/material/Box";
import TableRow from "@mui/material/TableRow";
import TableHead from "@mui/material/TableHead";
import TableCell from "@mui/material/TableCell";
import TableSortLabel from "@mui/material/TableSortLabel";

import {visuallyHidden} from "./utils";

// ----------------------------------------------------------------------

interface ResultsTableHeadProps {
    order: any;
    orderBy: string;
    headLabel: any[];
    onRequestSort: (property: string) => void;
}

export default function ResultsTableHead({
                                             order, orderBy, headLabel, onRequestSort,
                                         }: ResultsTableHeadProps) {
    const onSort = (property: any) => (event: any) => {
        console.log(event)
        onRequestSort(property);
    };

    return (<TableHead>
            <TableRow>
                {headLabel.map((headCell: any) => (<TableCell
                        key={headCell.id}
                        align={headCell.align || "left"}
                        sortDirection={orderBy === headCell.id ? order : false}
                        sx={{width: headCell.width, minWidth: headCell.minWidth}}
                    >
                        <TableSortLabel
                            hideSortIcon
                            active={orderBy === headCell.id}
                            direction={orderBy === headCell.id ? order : "asc"}
                            onClick={onSort(headCell.id)}
                        >
                            {headCell.label}
                            {orderBy === headCell.id ? (<Box sx={{...visuallyHidden}}>
                                    {order === "desc" ? "sorted descending" : "sorted ascending"}
                                </Box>) : null}
                        </TableSortLabel>
                    </TableCell>))}
            </TableRow>
        </TableHead>);
}

