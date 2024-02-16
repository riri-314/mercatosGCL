import PropTypes from 'prop-types';

import Box from '@mui/material/Box';


import {HEADER, NAV} from './config-layout';
import {useResponsive} from '../../hooks/use-responsive';
import LogoFull from '../../assets/gcl_full.svg';

// ----------------------------------------------------------------------

const SPACING = 8;

export default function Main({children, sx, ...other}: any) {
    const lgUp = useResponsive('lg', 'tt', 'up');

    return (<Box
            component="main"
            sx={{
                position: 'relative',

                "&::before": {
                    content: "''",
                    position: 'absolute',
                    top: 0,
                    left: 0,
                    width: '100%',
                    height: '100%',
                    mask: `url(${LogoFull})`,
                    maskRepeat: 'no-repeat',
                    maskPosition: 'center',
                    maskSize: 'contain',
                    backgroundColor: (theme) => theme.palette.primary.main,
                    opacity: (theme) => theme.palette.action.hoverOpacity,
                    zIndex: -1,
                },


                flexGrow: 1,
                minHeight: 1,
                display: 'flex',
                flexDirection: 'column',
                py: `${HEADER.H_MOBILE + SPACING}px`, ...(lgUp && {
                    px: 2, py: `${HEADER.H_DESKTOP + SPACING}px`, width: `calc(100% - ${NAV.WIDTH}px)`,
                }), ...sx,
            }}
            {...other}
        >
            {children}
        </Box>);
}

Main.propTypes = {
    children: PropTypes.node, sx: PropTypes.object,
};
