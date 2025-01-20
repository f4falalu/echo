import { Card } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  container: {
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    padding: token.padding
  }
}));

interface UserDatasetGroupsControllerProps {
  userId: string;
}

export function UserDatasetGroupsController({ userId }: UserDatasetGroupsControllerProps) {
  const { styles } = useStyles();

  return (
    <Card className={styles.container}>
      <h1>Dataset Groups</h1>
      {/* TODO: Add dataset groups list component */}
    </Card>
  );
}
