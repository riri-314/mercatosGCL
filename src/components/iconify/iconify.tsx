import { forwardRef, ReactNode, useState } from 'react';
import { Icon, type IconifyIcon } from '@iconify/react';
import type { SxProps, Theme } from '@mui/material/styles';

import Box from '@mui/material/Box';

interface IconifyProps {
  icon: string | IconifyIcon;
  width?: number;
  sx?: SxProps<Theme>;
  children?: ReactNode;
  fallback?: ReactNode;
}

const Iconify = forwardRef<HTMLDivElement, IconifyProps>(
  ({ icon, width = 20, sx, fallback, ...other }, ref) => {
    const [hasError, setHasError] = useState(false);

    return (
      <Box
        ref={ref}
        component={hasError ? 'div' : Icon}
        className="component-iconify"
        icon={icon}
        sx={{width, height: width, ...sx}}
        onError={() => setHasError(true)}
        {...other}
      >
        {hasError && fallback}
      </Box>
    );
  }
);

export default Iconify;
