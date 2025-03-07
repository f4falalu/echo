'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { Button } from '@/components/ui/buttons';
import { Input } from '@/components/ui/inputs';
import { Separator } from '@/components/ui/seperator';
import { Switch } from '@/components/ui/switch';
import { PulseLoader } from '@/components/ui/loaders';
import { useMemoizedFn } from '@/hooks';
import { createDayjsDate } from '@/lib/date';
import { useBusterDashboardContextSelector } from '@/context/Dashboards';
import { BusterRoutes, createBusterRoute } from '@/routes';
import { useBusterCollectionIndividualContextSelector } from '@/context/Collections';
import { ShareAssetType } from '@/api/asset_interfaces';
import { Text } from '@/components/ui/typography';
import { useBusterNotifications } from '@/context/BusterNotifications';
import { useBusterMetricsIndividualContextSelector } from '@/context/Metrics';
import { Link, Eye, EyeSlash } from '@/components/ui/icons';
import { DatePicker } from '@/components/ui/date';

export const ShareMenuContentPublish: React.FC<{
  onCopyLink: () => void;
  publicExpirationDate: string;
  publicly_accessible: boolean;
  password: string | null;
  assetType: ShareAssetType;
  assetId: string;
}> = React.memo(
  ({
    assetType,
    assetId,
    password = '',
    publicly_accessible,
    onCopyLink,
    publicExpirationDate
  }) => {
    const { openInfoMessage } = useBusterNotifications();
    const onShareMetric = useBusterMetricsIndividualContextSelector((state) => state.onShareMetric);
    const onShareDashboard = useBusterDashboardContextSelector((state) => state.onShareDashboard);
    const onShareCollection = useBusterCollectionIndividualContextSelector(
      (state) => state.onShareCollection
    );
    const [isPublishing, setIsPublishing] = useState<boolean>(false);
    const [isPasswordProtected, setIsPasswordProtected] = useState<boolean>(!!password);
    const [_password, _setPassword] = React.useState<string>(password || '');

    const linkExpiry = useMemo(() => {
      return publicExpirationDate ? new Date(publicExpirationDate) : null;
    }, [publicExpirationDate]);

    const url = useMemo(() => {
      let url = '';
      if (assetType === ShareAssetType.METRIC) {
        url = createBusterRoute({ route: BusterRoutes.APP_METRIC_ID, metricId: assetId });
      } else if (assetType === ShareAssetType.DASHBOARD) {
        url = createBusterRoute({ route: BusterRoutes.APP_DASHBOARD_ID, dashboardId: assetId });
      } else if (assetType === ShareAssetType.COLLECTION) {
        url = createBusterRoute({ route: BusterRoutes.APP_COLLECTIONS });
      }
      return window.location.origin + url;
    }, [assetId, assetType]);

    const onTogglePublish = useMemoizedFn(async (v?: boolean) => {
      setIsPublishing(true);
      const linkExp = linkExpiry ? linkExpiry.toISOString() : null;
      const payload = {
        id: assetId,
        publicly_accessible: v === undefined ? true : !!v,
        public_password: _password || null,
        public_expiry_date: linkExp
      };
      if (assetType === ShareAssetType.METRIC) {
        await onShareMetric(payload);
      } else if (assetType === ShareAssetType.DASHBOARD) {
        await onShareDashboard(payload);
      } else if (assetType === ShareAssetType.COLLECTION) {
        await onShareCollection(payload);
      }

      setIsPublishing(false);
    });

    const onSetPasswordProtected = useMemoizedFn(async (v: boolean) => {
      if (!v) {
        if (assetType === ShareAssetType.METRIC) {
          await onShareMetric({ id: assetId, public_password: null });
        } else if (assetType === ShareAssetType.DASHBOARD) {
          await onShareDashboard({ id: assetId, public_password: null });
        } else if (assetType === ShareAssetType.COLLECTION) {
          await onShareCollection({ id: assetId, public_password: null });
        }
      }

      setIsPasswordProtected(v);
    });

    const onSetPassword = useMemoizedFn(async (password: string | null) => {
      if (assetType === ShareAssetType.METRIC) {
        await onShareMetric({ id: assetId, public_password: password });
      } else if (assetType === ShareAssetType.DASHBOARD) {
        await onShareDashboard({ id: assetId, public_password: password });
      } else if (assetType === ShareAssetType.COLLECTION) {
        await onShareCollection({ id: assetId, public_password: password });
      }
      _setPassword(password || '');
      if (password) openInfoMessage('Password updated');
    });

    const onSetExpirationDate = useMemoizedFn(async (date: Date | null) => {
      const linkExp = date ? date.toISOString() : null;
      if (assetType === ShareAssetType.METRIC) {
        await onShareMetric({ id: assetId, public_expiry_date: linkExp });
      } else if (assetType === ShareAssetType.DASHBOARD) {
        await onShareDashboard({ id: assetId, public_expiry_date: linkExp });
      } else if (assetType === ShareAssetType.COLLECTION) {
        await onShareCollection({ id: assetId, public_expiry_date: linkExp });
      }
    });

    useEffect(() => {
      _setPassword(password || '');
      setIsPasswordProtected(!!password);
    }, [password]);

    return (
      <div className="pt-3">
        <div className="space-y-3 px-3 pb-3">
          {publicly_accessible ? (
            <>
              <IsPublishedInfo isPublished={publicly_accessible} />

              <div className="w-full!">
                <Input size="small" value={url} />
                <Button variant="default" className="flex" prefix={<Link />} onClick={onCopyLink} />
              </div>

              <LinkExpiration linkExpiry={linkExpiry} onChangeLinkExpiry={onSetExpirationDate} />

              <SetAPassword
                password={_password}
                onSetPassword={onSetPassword}
                isPasswordProtected={isPasswordProtected}
                onSetPasswordProtected={onSetPasswordProtected}
              />
            </>
          ) : (
            <div className="flex flex-col space-y-2">
              <Text variant="secondary">Anyone with the link will be able to view.</Text>

              <Button
                loading={isPublishing}
                onClick={() => {
                  onTogglePublish(true);
                }}>
                Create public link
              </Button>
            </div>
          )}
        </div>

        {publicly_accessible && (
          <>
            <Separator />

            <div className="flex justify-end space-x-2 px-3 py-2">
              <Button
                loading={isPublishing}
                onClick={async (v) => {
                  onTogglePublish(false);
                }}>
                Unpublish
              </Button>
              <Button onClick={onCopyLink}>Copy link</Button>
            </div>
          </>
        )}
      </div>
    );
  }
);
ShareMenuContentPublish.displayName = 'ShareMenuContentPublish';

const IsPublishedInfo: React.FC<{ isPublished: boolean }> = React.memo(({ isPublished }) => {
  if (!isPublished) return null;

  return (
    <div className="flex items-center space-x-2">
      <PulseLoader />
      <Text variant="link">Live on the web</Text>
    </div>
  );
});
IsPublishedInfo.displayName = 'IsPublishedInfo';

const LinkExpiration: React.FC<{
  linkExpiry: Date | null;
  onChangeLinkExpiry: (date: Date | null) => void;
}> = React.memo(({ onChangeLinkExpiry, linkExpiry }) => {
  const dateFormat = 'LL';

  const now = useMemo(() => {
    return createDayjsDate(new Date());
  }, []);

  const maxDate = useMemo(() => {
    return createDayjsDate(new Date()).add(3, 'year');
  }, []);

  return (
    <div className="flex items-center justify-between space-x-2">
      <Text>Link expiration</Text>

      <DatePicker
        date={linkExpiry || new Date()}
        onSelect={onChangeLinkExpiry}
        dateFormat={dateFormat}
        placeholder="Never"
        disabled={(date) => {
          const dateValue = createDayjsDate(date);
          return dateValue.isBefore(now) || dateValue.isAfter(maxDate);
        }}
      />
    </div>
  );
});
LinkExpiration.displayName = 'LinkExpiration';

const SetAPassword: React.FC<{
  password: string;
  onSetPassword: (password: string | null) => void;
  isPasswordProtected: boolean;
  onSetPasswordProtected: (isPasswordProtected: boolean) => void;
}> = React.memo(
  ({ password: passwordProp, onSetPassword, isPasswordProtected, onSetPasswordProtected }) => {
    const [visibilityToggle, setVisibilityToggle] = useState<boolean>(false);
    const [password, setPassword] = useState<string>(passwordProp);

    const isPasswordDifferent = password !== passwordProp;

    const onChangeChecked = useMemoizedFn((checked: boolean) => {
      onSetPasswordProtected(checked);
    });

    const onChangePassword = useMemoizedFn((e: React.ChangeEvent<HTMLInputElement>) => {
      setPassword(e.target.value);
    });

    const onClickVisibilityToggle = useMemoizedFn(() => {
      setVisibilityToggle(!visibilityToggle);
    });

    const onClickSave = useMemoizedFn(() => {
      onSetPassword(password);
    });

    const memoizedVisibilityToggle = useMemo(() => {
      return {
        visible: visibilityToggle,
        onVisibleChange: (visible: boolean) => setVisibilityToggle(visible)
      };
    }, [visibilityToggle]);

    useEffect(() => {
      if (isPasswordProtected) {
        setPassword(password);
      } else {
        setPassword('');
      }
    }, [isPasswordProtected, password]);

    return (
      <div className="flex w-full flex-col space-y-3">
        <div className="flex w-full justify-between">
          <Text>Set a password</Text>
          <Switch checked={isPasswordProtected} onCheckedChange={onChangeChecked} />
        </div>

        {isPasswordProtected && (
          <div className="flex w-full items-center space-x-2">
            <div className="flex w-full">
              <div className="w-full">
                <Input
                  value={password}
                  onChange={onChangePassword}
                  placeholder="Password"
                  type={visibilityToggle ? 'text' : 'password'}
                />

                <Button
                  className="h-full!"
                  prefix={!visibilityToggle ? <Eye /> : <EyeSlash />}
                  onClick={onClickVisibilityToggle}></Button>
              </div>
            </div>

            <Button disabled={!isPasswordDifferent} onClick={onClickSave}>
              Save
            </Button>
          </div>
        )}
      </div>
    );
  }
);

SetAPassword.displayName = 'SetAPassword';

const iconRender = () => <></>;
