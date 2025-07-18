import React, { type PropsWithChildren } from 'react';
import type { IColorTheme } from '../ThemeList';

type AddThemeProps = {
  createCustomTheme: (theme: IColorTheme) => Promise<void>;
  deleteCustomTheme: (themeId: string) => Promise<void>;
  modifyCustomTheme: (themeId: string, theme: IColorTheme) => Promise<void>;
};

const AddThemeProvider = React.createContext<AddThemeProps>({
  createCustomTheme: async () => {},
  deleteCustomTheme: async () => {},
  modifyCustomTheme: async () => {}
});

export const AddThemeProviderWrapper: React.FC<PropsWithChildren<AddThemeProps>> = ({
  children,
  createCustomTheme,
  deleteCustomTheme,
  modifyCustomTheme
}) => {
  return (
    <AddThemeProvider.Provider value={{ createCustomTheme, deleteCustomTheme, modifyCustomTheme }}>
      {children}
    </AddThemeProvider.Provider>
  );
};

export const useAddTheme = () => {
  return React.useContext(AddThemeProvider);
};
