import { createStyles } from 'antd-style';

export const useStyles = createStyles(({ token, css }) => ({
  tooltipTitleContainer: css`
    border-bottom: 0.5px solid ${token.colorBorder};
    .title {
      color: ${token.colorText};
      font-size: 13px;
      font-weight: 500;
    }
  `,

  tooltipItemLabel: css`
    font-size: 12px;
    color: ${token.colorTextSecondary};
    max-width: fit-content;
    &.title {
      color: ${token.colorText};
      font-weight: 500;
    }
  `,
  tooltipItemValue: css`
    color: ${token.colorText};
    font-size: 12px;
    font-weight: 500;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
    text-align: right;
  `,
  tooltipItemSeparator: css`
    background: ${token.colorBorder};
    height: 0.5px;
    width: 100%;
  `
}));
