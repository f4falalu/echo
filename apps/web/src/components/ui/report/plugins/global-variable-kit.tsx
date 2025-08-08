import { createPlatePlugin } from 'platejs/react';
import { CUSTOM_KEYS } from '../config/keys';

export type GlobalVariablePluginOptions = {
  mode: 'default' | 'export';
};

export type GlobalVariablePluginApi = {
  // the methods are defined in the extendApi function
};

export const GlobalVariablePlugin = createPlatePlugin<
  typeof CUSTOM_KEYS.globalVariable,
  GlobalVariablePluginOptions
>({
  key: CUSTOM_KEYS.globalVariable,
  options: {
    mode: 'default'
  }
});

export const GlobalVariableKit = [GlobalVariablePlugin];
