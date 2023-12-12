import PropTypes from 'prop-types';

import Stack from '@mui/material/Stack';
import TableRow from '@mui/material/TableRow';
import TableCell from '@mui/material/TableCell';
import Typography from '@mui/material/Typography';

// ----------------------------------------------------------------------

export default function ResultsTableRow({ name, enchere, fin }) {
  return (
    <>
      <TableRow hover tabIndex={-1}>
        <TableCell component="th" scope="row">
          <Stack direction="row" alignItems="center" spacing={2}>
            <Typography variant="subtitle2" noWrap>
              {name}
            </Typography>
          </Stack>
        </TableCell>

        <TableCell>{enchere}</TableCell>

        <TableCell>{fin}</TableCell>
      </TableRow>
    </>
  );
}

ResultsTableRow.propTypes = {
  name: PropTypes.any,
  enchere: PropTypes.string,
  fin: PropTypes.string,
};
