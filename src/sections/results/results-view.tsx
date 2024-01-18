import PropTypes from 'prop-types';
import { useState } from 'react';

import Card from '@mui/material/Card';
import Stack from '@mui/material/Stack';
import Table from '@mui/material/Table';
import Container from '@mui/material/Container';
import TableBody from '@mui/material/TableBody';
import Typography from '@mui/material/Typography';
import TableContainer from '@mui/material/TableContainer';
import TablePagination from '@mui/material/TablePagination';



import { results } from '../../_mock/results';
import Scrollbar from '../../components/scrollbar/scrollbar';
import { emptyRows, applyFilter, getComparator } from './utils';
import TableEmptyRows from './table-empty-rows';
import TableNoData from './table-no-data';
import ResultsTableRow from './results-table-row';
import ResultsTableHead from './results-table-head';

// ----------------------------------------------------------------------

interface ResultTableProps {
  tableName: string;
  columnName: any[];
}

export default function ResultTable({tableName, columnName}: ResultTableProps) {
  const [page, setPage] = useState(0);

  const [order, setOrder] = useState('asc');

  const [orderBy, setOrderBy] = useState('name');

  const [rowsPerPage, setRowsPerPage] = useState(10);

  const handleSort = (id: string) => {
    const isAsc = orderBy === id && order === 'asc';
    if (id !== '') {
      setOrder(isAsc ? 'desc' : 'asc');
      setOrderBy(id);
    }
  };

  const handleChangePage = (event: any, newPage: any) => {
    console.log("new page: ", event)
    setPage(newPage);
  };

  const handleChangeRowsPerPage = (event: any) => {
    setPage(0);
    setRowsPerPage(parseInt(event.target.value, 10));
  };

  const dataFiltered = applyFilter({
    inputData: results,
    comparator: getComparator(order, orderBy),
  });

  const notFound = !dataFiltered.length;

  return (
    <Container>
      <Stack direction="row" alignItems="center" justifyContent="space-between" mb={5}>
        <Typography variant="h4">{tableName}</Typography>
      </Stack>

      <Card>
        <Scrollbar>
          <TableContainer sx={{ overflow: 'unset' }}>
            <Table sx={{ minWidth: 500 }}>
              <ResultsTableHead
                order={order}
                orderBy={orderBy}
                onRequestSort={handleSort}
                headLabel={columnName}
              />
              <TableBody>
                {dataFiltered
                  .slice(page * rowsPerPage, page * rowsPerPage + rowsPerPage)
                  .map((row: any) => (
                    <ResultsTableRow
                      key={row.id}
                      name={row.name}
                      enchere={row.enchere}
                      fin={row.fin}
                    />
                  ))}

                <TableEmptyRows
                  height={77}
                  emptyRows={emptyRows(page, rowsPerPage, results.length)}
                />

                {notFound && <TableNoData />}
              </TableBody>
            </Table>
          </TableContainer>
        </Scrollbar>

        <TablePagination
          page={page}
          component="div"
          count={results.length}
          rowsPerPage={rowsPerPage}
          onPageChange={handleChangePage}
          rowsPerPageOptions={[10, 15, 25]}
          onRowsPerPageChange={handleChangeRowsPerPage}
        />
      </Card>
    </Container>
  );
}

ResultTable.prototype = {
  tableName: PropTypes.string,
  columnName: PropTypes.string,
}
