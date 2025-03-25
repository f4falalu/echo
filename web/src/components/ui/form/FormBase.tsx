import { createFormHookContexts } from '@tanstack/react-form';
import { Label } from '../label/LabelBase';
import { Input } from '../inputs';
import { InputPassword } from '../inputs/InputPassword';
import { cn } from '@/lib/classMerge';
import { Button } from '../buttons';
import { ReactNode } from 'react';

export const { fieldContext, useFieldContext, formContext, useFormContext } =
  createFormHookContexts();

export function LabelWrapper({
  label,
  children,
  direction = 'row',
  className = '',
  labelClassName = '',
  htmlFor
}: {
  label: string | null;
  children: ReactNode;
  direction?: 'row' | 'column';
  className?: string;
  labelClassName?: string;
  htmlFor?: string;
}) {
  if (label === null) return <>{children}</>;

  return (
    <div
      className={cn(
        'flex gap-x-4 gap-y-2',
        direction === 'row' ? 'flex-row items-center' : 'flex-col justify-start',
        className
      )}>
      <Label
        className={cn(
          'truncate',
          direction === 'row' ? 'min-w-fit flex-grow' : 'w-full',
          labelClassName
        )}
        htmlFor={htmlFor}>
        {label}
      </Label>

      {children}
    </div>
  );
}

export function TextField({
  label,
  direction = 'row',
  className = '',
  labelClassName = '',
  inputClassName = '',
  type
}: {
  label: string | null;
  direction?: 'row' | 'column';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  type?: Parameters<typeof Input>[0]['type'];
}) {
  const field = useFieldContext<string>();

  const InputComponent = (
    <Input
      id={field.name}
      className={cn('flex-shrink', inputClassName)}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      type={type}
    />
  );

  if (label === null) return InputComponent;

  return (
    <LabelWrapper
      label={label}
      direction={direction}
      className={className}
      labelClassName={labelClassName}
      htmlFor={field.name}>
      {InputComponent}
    </LabelWrapper>
  );
}

export function NumberField(props: Parameters<typeof TextField>[0]) {
  return <TextField {...props} type="number" />;
}

export function PasswordField({
  label,
  direction,
  className,
  inputClassName,
  labelClassName
}: Parameters<typeof TextField>[0]) {
  const field = useFieldContext<string>();

  const InputComponent = (
    <InputPassword
      id={field.name}
      className={cn('flex-shrink', inputClassName)}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
    />
  );

  if (label === null) return InputComponent;

  return (
    <LabelWrapper
      label={label}
      direction={direction}
      className={className}
      labelClassName={labelClassName}
      htmlFor={field.name}>
      {InputComponent}
    </LabelWrapper>
  );
}

export function DoubleField({
  input1,
  input2,
  direction = 'row',
  label,
  labelClassName = '',
  className = ''
}: {
  input1: Parameters<typeof TextField>[0];
  input2: Parameters<typeof TextField>[0];
  direction?: 'row' | 'column';
  label: string;
  labelClassName?: string;
  className?: string;
}) {
  return (
    <LabelWrapper
      label={label}
      direction={direction}
      labelClassName={labelClassName}
      className={className}>
      <div className="flex flex-grow gap-2">
        <TextField {...input1} label={null} />
        <TextField {...input2} label={null} />
      </div>
    </LabelWrapper>
  );
}

export function SubscribeButton({
  submitLabel,
  useResetButton = true
}: {
  submitLabel: string;
  useResetButton?: boolean;
}) {
  const form = useFormContext();

  return (
    <form.Subscribe selector={(state) => [state.canSubmit, state.isSubmitting]}>
      {([canSubmit, isSubmitting]) => (
        <div className="flex w-full justify-end space-x-2">
          {useResetButton && (
            <Button variant="ghost" type="reset" onClick={() => form.reset()}>
              Reset
            </Button>
          )}
          <Button variant="black" type="submit" disabled={!canSubmit} loading={isSubmitting}>
            {submitLabel}
          </Button>
        </div>
      )}
    </form.Subscribe>
  );
}
