import { forwardRef } from 'react';

import Box, { type BoxProps } from '@mui/material/Box';

// ----------------------------------------------------------------------

const SvgColor = forwardRef<HTMLSpanElement, BoxProps<'span'> & { src: string }>(({ src, sx, ...other }, ref) => (
  <Box
    component="span"
    className="svg-color"
    ref={ref}
    sx={{
      width: 24,
      height: 24,
      display: 'inline-block',
      bgcolor: 'currentColor',
      mask: `url(${src}) no-repeat center / contain`,
      WebkitMask: `url(${src}) no-repeat center / contain`,
      ...sx,
    }}
    {...other}
  />
));

export default SvgColor;
