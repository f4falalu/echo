'use client';

import React, { useMemo, useState } from 'react';
import { PermissionAppSegments } from './PermissionAppSegments';
import { AnimatePresence, motion } from 'framer-motion';
import { PermissionApps } from './config';
import { PermissionDatasetGroups } from './_PermissionDatasetGroups';
import { PermissionOverview } from './_PermissionOverview';
import { PermissionPermissionGroup } from './_PermissionPermissionGroup';
import { PermissionUsers } from './_PermissionUsers';

const selectedAppComponent: Record<PermissionApps, React.FC<{ datasetId: string }>> = {
  [PermissionApps.OVERVIEW]: PermissionOverview,
  [PermissionApps.PERMISSION_GROUPS]: PermissionPermissionGroup,
  [PermissionApps.DATASET_GROUPS]: PermissionDatasetGroups,
  [PermissionApps.USERS]: PermissionUsers
};

const memoizedAnimation = {
  initial: { opacity: 0 },
  animate: { opacity: 1 },
  exit: { opacity: 0 },
  transition: { duration: 0.125 }
};
export const PermissionsAppContainer: React.FC<{ datasetId: string }> = React.memo(
  ({ datasetId }) => {
    const [selectedApp, setSelectedApp] = useState<PermissionApps>(PermissionApps.OVERVIEW);

    const Component = selectedAppComponent[selectedApp];

    return (
      <>
        <PermissionAppSegments
          selectedApp={selectedApp}
          setSelectedApp={setSelectedApp}
          datasetId={datasetId}
        />

        <AnimatePresence mode="wait" initial={false}>
          <motion.div {...memoizedAnimation} key={selectedApp} className="w-full">
            <Component datasetId={datasetId} />
          </motion.div>
        </AnimatePresence>
      </>
    );
  }
);

PermissionsAppContainer.displayName = 'PermissionsAppContainer';
