import { memo, forwardRef } from 'react';
import Box, { type BoxProps } from '@mui/material/Box';

const Scrollbar = forwardRef<HTMLDivElement, BoxProps>(({ children, sx, ...other }, ref) => (
  <Box ref={ref} sx={{ overflow: 'auto', ...sx }} {...other}>
    {children}
  </Box>
));

export default memo(Scrollbar);
