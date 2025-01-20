import { Card } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  container: {
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    padding: token.padding
  }
}));

interface UserDatasetsControllerProps {
  userId: string;
}

export function UserDatasetsController({ userId }: UserDatasetsControllerProps) {
  const { styles } = useStyles();

  return (
    <Card className={styles.container}>
      <h1>Datasets</h1>
      {/* TODO: Add datasets list component */}
    </Card>
  );
}
