'use client';

import { Card } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  container: {
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    padding: token.padding
  }
}));

interface UserAttributesControllerProps {
  userId: string;
}

export function UserAttributesController({ userId }: UserAttributesControllerProps) {
  const { styles } = useStyles();

  return (
    <Card className={styles.container}>
      <h1>Attributes</h1>
      {/* TODO: Add attributes list component */}
    </Card>
  );
}
