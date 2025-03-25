'use client';

import React from 'react';
import { WhiteListBlock } from '../WhiteListBlock';
import { FormApi } from '@tanstack/react-form';
import { Button } from '@/components/ui/buttons';

export interface FormWrapperProps {
  children: React.ReactNode;
  form: FormApi<any, any, any, any, any, any, any, any, any, any>;
}

export function FormWrapper({ form, children }: FormWrapperProps) {
  return (
    <form
      className="flex flex-col space-y-4"
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
          Submit
        </Button>
      </div>
    </form>
  );
}
