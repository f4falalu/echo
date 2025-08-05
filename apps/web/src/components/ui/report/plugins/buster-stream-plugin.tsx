import { O } from 'node_modules/@faker-js/faker/dist/airline-CLphikKp';
import { createTSlatePlugin, type PluginConfig, type TElement } from 'platejs';
import { createPlatePlugin, type PlateElementProps } from 'platejs/react';

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
  api: {
    swag: () => {
      alert('swag');
    }
  },

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

export const CharacterCounterPlugin = createPlatePlugin<
  'characterCounter',
  {
    maxLength: number;
    showWarning: boolean;
    warningThreshold: number;
  },
  {
    swag: () => {};
  },
  {},
  {
    maxLength: number;
    showWarning: boolean;
    warningThreshold: number;
  }
>({
  key: 'characterCounter',
  options: {
    maxLength: 280,
    showWarning: true,
    warningThreshold: 0.9
  },
  handlers: {
    onChange: ({ editor }) => {
      console.log('onChange', editor);
    },
    onKeyDown: ({ editor, event }) => {
      console.log('onKeyDown', editor, event);
    }
  },
  node: {
    component: ({ element, children, ...rest }: CharacterElementCounterProps) => {
      const options = rest.getOptions();
      const { maxLength, showWarning, warningThreshold } = options;

      console.log('swag', options);
      console.log('swag2', rest);

      return <div className="rounded-md bg-purple-100 p-2 text-black">{children}</div>;
    },
    isElement: true
  }
});

type CharacterElementCounterProps = PlateElementProps<
  TElement,
  PluginConfig<
    'characterCounter',
    {
      maxLength: number;
      showWarning: boolean;
      warningThreshold: number;
    }
  >
>;
