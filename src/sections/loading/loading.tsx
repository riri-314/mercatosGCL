import Box from '@mui/material/Box';
import CircularProgress from '@mui/material/CircularProgress';
import Typography from '@mui/material/Typography';
import Logo from '../../components/logo/logo';

// ----------------------------------------------------------------------

export default function Loading({ fullScreen = false }: { fullScreen?: boolean }) {
  return (
    <Box
      role="status"
      aria-live="polite"
      aria-label="Chargement du mercato"
      sx={{
        display: 'flex',
        minHeight: fullScreen ? '100dvh' : 240,
        p: 3,
        alignItems: 'center',
        justifyContent: 'center',
        flexDirection: 'column',
        gap: 2.5,
        bgcolor: fullScreen ? 'background.default' : 'transparent',
      }}
    >
      {fullScreen && (
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.5 }}>
          <Logo size={44} disabledLink />
          <Typography sx={{ fontSize: 16, fontWeight: 600 }}>
            Mercatos GCL
          </Typography>
        </Box>
      )}
      <Box sx={{ display: 'flex', alignItems: 'center', gap: 1.25 }}>
        <CircularProgress size={16} thickness={4} aria-hidden="true" />
        <Typography sx={{ fontSize: 13, color: 'text.secondary' }}>
          Chargement…
        </Typography>
      </Box>
    </Box>
  );
}
