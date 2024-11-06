import { useEffect, useState, useCallback, useMemo } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Accordion, AccordionDetails, AccordionSummary, Box, Theme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useAuth } from '../../auth/AuthProvider';
import { useData } from '../../data/DataProvider';
import Loading from '../loading/loading';
import Iconify from '../../components/iconify/iconify';
import ComitardList from './comitard-list-V3';

// ----------------------------------------------------------------------

export default function ComitardsView() {
  const { user } = useAuth();
  const { data, refetchData, fetchedTime } = useData();
  const [isInTimeFrame, setIsInTimeFrame] = useState(false);
  const [refreshTime, setRefreshTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const theme: Theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));
  const [currentTime, setCurrentTime] = useState(Date.now());

  const dataContent = useMemo(() => data?.data(), [data]);

  const cerclesDataWithNames = useMemo(() => {
    if (!dataContent?.cercles) return {};
    const cerclesWithNames: any = {};
    Object.keys(dataContent.cercles).forEach((cercleId) => {
      cerclesWithNames[cercleId] = { name: dataContent.cercles[cercleId].name };
    });
    return cerclesWithNames;
  }, [dataContent]);

  const isInTimeFrameFN = useCallback(() => {
    const date = new Date();
    const start = dataContent?.start;
    const stop = dataContent?.stop;
    if (start && stop) {
      const newIsInTimeFrame =
        date.getTime() > start.toMillis() && date.getTime() < stop.toMillis();
      setIsInTimeFrame(newIsInTimeFrame);
    } else {
      setIsInTimeFrame(false);
    }
  }, [dataContent]);

  const nbFutsLeft = useMemo(() => {
    return user ? dataContent?.cercles[user.uid]?.nbFut ?? 0 : 0;
  }, [user, dataContent]);

  const enchereMinMax = useMemo(() => {
    const enchereMin = dataContent?.enchereMin ?? 0;
    const enchereMax = dataContent?.enchereMax ?? 0;
    return [enchereMin, enchereMax];
  }, [dataContent]);

  useEffect(() => {
    isInTimeFrameFN();
  }, [dataContent, isInTimeFrameFN]);

  useEffect(() => {
    const interval = setInterval(() => {
      isInTimeFrameFN();
      setRefreshTime(formatTime(Date.now() - fetchedTime));
      setCurrentTime(Date.now());
    }, 1000); // Update every second
    return () => clearInterval(interval);
  }, [fetchedTime, isInTimeFrameFN]);

  function formatTime(time: number): string {
    const totalSeconds = Math.floor(time / 1000);
    const hours = Math.floor(totalSeconds / 3600);
    const minutes = Math.floor((totalSeconds % 3600) / 60);
    const seconds = totalSeconds % 60;

    if (hours > 0) {
      return `${hours}h ${minutes}m`;
    } else if (minutes > 0) {
      return `${minutes}m ${seconds}s`;
    } else {
      return `${seconds}s`;
    }
  }

  function refresh() {
    setRefreshing(true);
    refetchData();
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 4000);
    return () => clearTimeout(timeoutId);
  }

  const handleRefreshClick = () => {
    refresh();
  };

  if (!data) {
    return <Loading />;
  }

  return (
    <Container>
      <Container>
        {refreshTime && !refreshing ? (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontStyle: 'oblique',
              mt: -1,
              mb: 1,
            }}
            onClick={handleRefreshClick}
          >
            <Typography variant="body1" sx={{ marginLeft: '5px' }}>
              Rafraîchi il y a {refreshTime}.
            </Typography>
            <Iconify icon="material-symbols-light:refresh" />
          </Box>
        ) : (
          <Box
            sx={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontStyle: 'oblique',
            }}
          >
            <Typography variant="body1" sx={{ marginLeft: '5px' }}>
              Mise à jour...
            </Typography>
          </Box>
        )}
      </Container>
      {Object.keys(dataContent.cercles)
        .sort((a, b) => dataContent.cercles[a].name.localeCompare(dataContent.cercles[b].name))
        .map((cercleId) => (
          <div key={cercleId} style={{ marginBottom: '20px' }}>
            {isSmallScreen ? (
              <Accordion>
                <AccordionSummary
                  expandIcon={
                    <Iconify
                      width={40}
                      icon="solar:double-alt-arrow-down-bold-duotone"
                      sx={{ color: theme.palette.primary.main }}
                      fallback={<span>↓</span>}
                    />
                  }
                >
                  <Typography sx={{ m: 3 }} variant="h3">
                    {dataContent.cercles[cercleId].name}
                  </Typography>
                </AccordionSummary>
                <AccordionDetails>
                  <ComitardList
                    cercleId={cercleId}
                    dataContent={dataContent}
                    userId={user?.uid}
                    nbFutsLeft={nbFutsLeft}
                    enchereMinMax={enchereMinMax}
                    isInTimeFrame={isInTimeFrame}
                    refetchData={refetchData}
                    cerclesData={cerclesDataWithNames}
                    currentTime={currentTime}
                  />
                </AccordionDetails>
              </Accordion>
            ) : (
              <>
                <Typography sx={{ m: 3 }} variant="h3">
                  {dataContent.cercles[cercleId].name}
                </Typography>
                <ComitardList
                  cercleId={cercleId}
                  dataContent={dataContent}
                  userId={user?.uid}
                  nbFutsLeft={nbFutsLeft}
                  enchereMinMax={enchereMinMax}
                  isInTimeFrame={isInTimeFrame}
                  refetchData={refetchData}
                  cerclesData={cerclesDataWithNames}
                  currentTime={currentTime}
                />
              </>
            )}
          </div>
        ))}
    </Container>
  );
}
