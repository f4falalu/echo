import React from 'react';

export const UserListPopupContainer = React.memo(
  ({
    selectedRowKeys,
    onSelectChange
  }: {
    selectedRowKeys: string[];
    onSelectChange: (selectedRowKeys: string[]) => void;
  }) => {
    return <div>UserListPopupContainer</div>;
  }
);

UserListPopupContainer.displayName = 'UserListPopupContainer';
