import { createStyles } from 'antd-style';
import React from 'react';

export const PermissionListContainer: React.FC<{
  children: React.ReactNode;
  popupNode?: React.ReactNode;
}> = React.memo(({ children, popupNode }) => {
  const { styles, cx } = useStyles();

  return (
    <div className={cx('overflow-hidden', styles.container)}>
      {children}

      {popupNode && (
        <div className="fixed bottom-0 left-0 right-0 w-full">
          <div className="relative ml-[220px] mr-[55px]">{popupNode}</div>
        </div>
      )}
    </div>
  );
});

PermissionListContainer.displayName = 'PermissionListContainer';

const useStyles = createStyles(({ css, token }) => ({
  container: css`
    border: 0.5px solid ${token.colorBorder};
    border-radius: ${token.borderRadius}px;
  `
}));
