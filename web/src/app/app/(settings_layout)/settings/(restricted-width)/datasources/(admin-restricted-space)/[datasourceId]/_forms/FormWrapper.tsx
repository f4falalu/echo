'use client';

import React from 'react';
import { WhiteListBlock } from './WhiteListBlock';
import { FormApi } from '@tanstack/react-form';
import { Button } from '@/components/ui/buttons';

export interface FormWrapperProps {
  children: React.ReactNode;
  flow: 'create' | 'update';
  form: FormApi<any, any, any, any, any, any, any, any, any, any>;
}

export function FormWrapper({ form, children, flow }: FormWrapperProps) {
  console.log(form);

  return (
    <form
      className="[&_.label-wrapper]:border-b-border flex flex-col space-y-4 [&_.label-wrapper]:border-b [&_.label-wrapper]:pb-4"
      onSubmit={(e) => {
        e.preventDefault();
        form.handleSubmit();
      }}>
      {children}

      <WhiteListBlock />

      <div className="flex w-full justify-end space-x-2">
        <Button variant="ghost" type="reset" onClick={() => form.reset()}>
          Reset
        </Button>
        <Button
          variant="black"
          type="submit"
          disabled={!form.state.canSubmit}
          loading={form.state.isSubmitting}>
          {flow === 'create' ? 'Create' : 'Update'}
        </Button>
      </div>
    </form>
  );
}
