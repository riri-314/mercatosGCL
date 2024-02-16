import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';

// ----------------------------------------------------------------------
interface TableEmptyRowsProps {
    height: number;
    emptyRows: number;
}


export default function TableEmptyRows({emptyRows, height}: TableEmptyRowsProps) {
    if (!emptyRows) {
        return null;
    }

    return (<TableRow
            sx={{
                ...(height && {
                    height: height * emptyRows,
                }),
            }}
        >
            <TableCell colSpan={9}/>
        </TableRow>);
}

