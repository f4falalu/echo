'use client';

import { useMemoizedFn } from '@/hooks';
import React from 'react';
import { WhiteListBlock } from '../WhiteListBlock';
import { NewDatasetModal } from '@/components/features/modal/NewDatasetModal';
import { useForm } from '@tanstack/react-form';
import { Button } from '@/components/ui/buttons';

// export const FormWrapper = React.forwardRef<
//   FormWrapperHandle,
//   {
//     children: React.ReactNode;
//     name: string;
//     onSubmit: () => void;
//     flow: 'create' | 'update';
//     form: ReturnType<typeof useAppForm>;
//   }
// >(({ children, name, onSubmit, flow, form }, ref) => {
//   const onSubmitPreflight = useMemoizedFn((e: React.FormEvent<HTMLFormElement>) => {
//     e.preventDefault();
//     e.stopPropagation();
//     form.handleSubmit();
//   });

//   return (
//     <form className="flex flex-col space-y-4" onSubmit={onSubmitPreflight}>
//       {children}

//       <WhiteListBlock />

//       <form.Subscribe
//         selector={(state) => [state.canSubmit, state.isSubmitting]}
//         children={([canSubmit, isSubmitting]) => (
//           <div className="flex w-full justify-end space-x-2">
//             <Button variant="ghost" type="reset" onClick={() => form.reset()}>
//               Reset
//             </Button>
//             <Button variant="black" type="submit" disabled={!canSubmit} loading={isSubmitting}>
//               Submit
//             </Button>
//           </div>
//         )}
//       />
//     </form>
//   );
// });
// FormWrapper.displayName = 'FormWrapper';

export const FormWrapper = () => {
  return (
    <form className="flex flex-col space-y-4">
      {children}

      <WhiteListBlock />
    </form>
  );
};
