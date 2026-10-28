import { forwardRef, type ReactNode } from 'react';

import Box, { type BoxProps } from '@mui/material/Box';
import { useTheme } from '@mui/material/styles';
import { StyledLabel, type LabelState } from './styles';


// ----------------------------------------------------------------------

interface LabelProps extends Omit<BoxProps<'span'>, 'color'> {
  color?: LabelState['color'];
  variant?: LabelState['variant'];
  startIcon?: ReactNode;
  endIcon?: ReactNode;
}

const Label = forwardRef<HTMLSpanElement, LabelProps>(
  ({ children, color = 'default', variant = 'soft', startIcon, endIcon, sx, ...other }, ref) => {
    const theme = useTheme();

    const iconStyles = {
      width: 16,
      height: 16,
      '& svg, img': { width: 1, height: 1, objectFit: 'cover' },
    };

    return (
      <StyledLabel
        ref={ref}
        component="span"
        ownerState={{ color, variant }}
        sx={{
          ...(startIcon && { pl: 0.75 }),
          ...(endIcon && { pr: 0.75 }),
          ...sx,
        }}
        theme={theme}
        {...other}
      >
        {startIcon && <Box sx={{ mr: 0.75, ...iconStyles }}> {startIcon} </Box>}

        {children}

        {endIcon && <Box sx={{ ml: 0.75, ...iconStyles }}> {endIcon} </Box>}
      </StyledLabel>
    );
  }
);



export default Label;
