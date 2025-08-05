import {
  createTSlatePlugin,
  type PluginConfig,
  type TElement,
  Node as PlateNode,
  TNode
} from 'platejs';
import { createPlatePlugin, type PlateElementProps, useEditorRef } from 'platejs/react';
import { useMemo } from 'react';

export type BannerConfig = PluginConfig<
  'banner',
  //api
  {},
  //options
  {},
  //selectors
  {},
  //transforms
  {}
>;

export const BannerPlugin = createTSlatePlugin<BannerConfig>({
  key: 'banner', // unique plugin key
  api: {},
  render: {
    // this will render *before* the actual <Editable> content
    beforeEditable: () => (
      <div
        style={{
          background: 'lightyellow',
          padding: '8px',
          textAlign: 'center',
          borderBottom: '1px solid #ddd'
        }}>
        🚀 Welcome to PlateJS v42!
      </div>
    )
    // beforeContainer: () => (
    //   <div className="bg-red-500">
    //     <h1>beforeContainer</h1>
    //   </div>
    // ),
    // belowNodes: (propsParent) => {
    //   return (propsChild) => {
    //     return (
    //       <div className="bg-blue-500">
    //         <h1>belowNodes</h1>
    //         {propsChild.children}
    //       </div>
    //     );
    //   };
    // },
    // belowRootNodes: (props) => {
    //   return (
    //     <div className="bg-green-500">
    //       <h1>belowRootNodes</h1>
    //       {props.children}
    //     </div>
    //   );
    // },
    // aboveEditable: (props) => {
    //   return (
    //     <div className="bg-purple-200">
    //       <h1>aboveEditable</h1>
    //       {props.children}
    //     </div>
    //   );
    // },
    // aboveNodes: (props) => {
    //   return (propsChild) => {
    //     return (
    //       <div className="bg-yellow-500">
    //         <h1>aboveNodes</h1>
    //         {propsChild.children}
    //       </div>
    //     );
    //   };
    // },
    // afterEditable: () => {
    //   return (
    //     <div className="bg-red-500">
    //       <h1>afterEditable</h1>
    //     </div>
    //   );
    // }
  }
});
