import { Card } from 'antd';
import { createStyles } from 'antd-style';

const useStyles = createStyles(({ token }) => ({
  container: {
    border: `0.5px solid ${token.colorBorder}`,
    borderRadius: token.borderRadius,
    padding: token.padding
  }
}));

interface UserTeamsControllerProps {
  userId: string;
}

export function UserTeamsController({ userId }: UserTeamsControllerProps) {
  const { styles } = useStyles();

  return (
    <Card className={styles.container}>
      <h1>Teams</h1>
      {/* TODO: Add teams list component */}
    </Card>
  );
}
