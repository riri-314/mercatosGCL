import { useEffect, useState, useCallback } from 'react';
import Container from '@mui/material/Container';
import Typography from '@mui/material/Typography';
import { Accordion, AccordionDetails, AccordionSummary, Box, Theme } from '@mui/material';
import useMediaQuery from '@mui/material/useMediaQuery';
import { useTheme } from '@mui/material/styles';

import { useAuth } from '../../auth/AuthProvider';
import { useData } from '../../data/DataProvider';
import Loading from '../loading/loading';
import Iconify from '../../components/iconify/iconify';
import ComitardList from './comitard-list';

// ----------------------------------------------------------------------

// this is a test to optimize the comitards view perfs

export default function ComitardsView() {
  const { user } = useAuth();
  const { data, refetchData, fetchedTime } = useData();
  const [isInTimeFrame, setIsInTimeFrame] = useState(false);
  const [refreshTime, setRefreshTime] = useState('');
  const [refreshing, setRefreshing] = useState(false);
  const theme: Theme = useTheme();
  const isSmallScreen = useMediaQuery(theme.breakpoints.down('sm'));

  const dataContent = data?.data();

  // Memoized functions to prevent unnecessary re-renders
  const isInTimeFrameFN = useCallback(() => {
    const date = new Date();
    const start = dataContent?.start;
    const stop = dataContent?.stop;
    if (start && stop) {
      const newIsInTimeFrame =
        date.getTime() > start.toMillis() && date.getTime() < stop.toMillis();
      setIsInTimeFrame((prev) => (prev !== newIsInTimeFrame ? newIsInTimeFrame : prev));
    } else {
      setIsInTimeFrame(false);
    }
  }, [dataContent]);

  const nbFutsLeft = useCallback(() => {
    return user ? dataContent?.cercles[user.uid]?.nbFut ?? 0 : 0;
  }, [user, dataContent]);

  const enchereMinMax = useCallback(() => {
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

  const [refreshTimeout, setRefreshTimeout] = useState<NodeJS.Timeout | null>(null);

  function refresh() {
    setRefreshing(true);
    refetchData();
    const timeoutId = setTimeout(() => {
      setRefreshing(false);
    }, 4000);
    setRefreshTimeout(timeoutId);
  }

  useEffect(() => {
    return () => {
      if (refreshTimeout) {
        clearTimeout(refreshTimeout);
      }
    };
  }, [refreshTimeout]);

  const handleRefreshClick = () => {
    refresh();
  };

  const getCerclesDataWithNames = useCallback((cerclesData: any) => {
    const cerclesWithNames: any = {};
    Object.keys(cerclesData).forEach((cercleId) => {
      cerclesWithNames[cercleId] = { name: cerclesData[cercleId].name };
    });
    return cerclesWithNames;
  }, []);

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
                    nbFutsLeft={nbFutsLeft()}
                    enchereMinMax={enchereMinMax()}
                    isInTimeFrame={isInTimeFrame}
                    refetchData={refetchData}
                    getCerclesDataWithNames={getCerclesDataWithNames}
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
                  nbFutsLeft={nbFutsLeft()}
                  enchereMinMax={enchereMinMax()}
                  isInTimeFrame={isInTimeFrame}
                  refetchData={refetchData}
                  getCerclesDataWithNames={getCerclesDataWithNames}
                />
              </>
            )}
          </div>
        ))}
    </Container>
  );
}
