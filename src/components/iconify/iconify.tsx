import PropTypes from 'prop-types';
import { forwardRef, ReactNode } from 'react';
import { Icon } from '@iconify/react';

import Box from '@mui/material/Box';

interface IconifyProps {
  icon: any;
  width?: number;
  sx?: Record<string, any>;
  children?: ReactNode;
}

const Iconify = forwardRef<HTMLDivElement, IconifyProps>(
  ({ icon, width = 20, sx, ...other }, ref) => (
    <Box
      ref={ref}
      component={Icon}
      className="component-iconify"
      icon={icon}
      sx={{ width, height: width, ...sx }}
      {...other}
    />
  )
);

Iconify.propTypes = {
  icon: PropTypes.oneOfType([PropTypes.element, PropTypes.string]),
  sx: PropTypes.object,
  width: PropTypes.number,
};

export default Iconify;
