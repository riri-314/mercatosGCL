import PropTypes from 'prop-types';
import { forwardRef, ReactNode, useState } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';

interface IconifyProps {
  icon: any;
  width?: number;
  sx?: Record<string, any>;
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

Iconify.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sx: PropTypes.object,
  width: PropTypes.number,
    children: PropTypes.node,
};

export default Iconify;
