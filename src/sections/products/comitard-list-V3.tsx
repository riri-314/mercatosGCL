import React, { useMemo } from 'react';
import { Grid, Box } from '@mui/material';

import ComitardCard from './comitard-card-V3';

interface ComitardListProps {
  cercleId: string;
  dataContent: any;
  userId: string | undefined;
  nbFutsLeft: number;
  enchereMinMax: number[];
  isInTimeFrame: boolean;
  refetchData: () => void;
  cerclesData: any;
  currentTime: number;
}

const ComitardList: React.FC<ComitardListProps> = ({
  cercleId,
  dataContent,
  userId,
  nbFutsLeft,
  enchereMinMax,
  isInTimeFrame,
  refetchData,
  cerclesData,
  currentTime,
}) => {
  const comitards = useMemo(() => dataContent?.cercles[cercleId]?.comitards, [dataContent, cercleId]);

  if (!comitards || Object.keys(comitards).length === 0) {
    return (
      <Box sx={{ mb: 4, mt: -4, ml: 3 }}>
        Aucun comitard n'a pu participer, snif 😥
      </Box>
    );
  }

  return (
    <Grid container spacing={3}>
      {Object.keys(comitards)
        .sort((a, b) => comitards[a].name.localeCompare(comitards[b].name))
        .map((comitardID) => (
          <Grid key={comitardID} item xs={12} sm={6} md={3}>
            <ComitardCard
              product={comitards[comitardID]}
              user={userId}
              cercleId={cercleId}
              comitardId={comitardID}
              editionId={dataContent.id}
              nbFutsLeft={nbFutsLeft}
              enchereMax={enchereMinMax[1]}
              enchereMin={enchereMinMax[0]}
              isInTimeFrame={isInTimeFrame}
              refetchData={refetchData}
              cerclesData={cerclesData}
              currentTime={currentTime}
            />
          </Grid>
        ))}
    </Grid>
  );
};

export default ComitardList;
