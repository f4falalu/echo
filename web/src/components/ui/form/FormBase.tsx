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
        'label-wrapper flex gap-x-4 gap-y-2',
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
  type,
  placeholder
}: {
  label: string | null;
  direction?: 'row' | 'column';
  className?: string;
  labelClassName?: string;
  inputClassName?: string;
  placeholder?: string;
  type?: Parameters<typeof Input>[0]['type'];
}) {
  const field = useFieldContext<string>();

  const InputComponent = (
    <Input
      id={field.name}
      className={cn('flex-shrink', className)}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      type={type}
      placeholder={placeholder}
    />
  );

  if (label === null) return InputComponent;

  return (
    <LabelWrapper
      label={label}
      direction={direction}
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
  labelClassName,
  placeholder
}: Parameters<typeof TextField>[0]) {
  const field = useFieldContext<string>();

  const InputComponent = (
    <InputPassword
      id={field.name}
      className={cn('flex-shrink', inputClassName)}
      value={field.state.value}
      onChange={(e) => field.handleChange(e.target.value)}
      placeholder={placeholder}
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

export function MultipleInlineFields({
  children,
  direction = 'row',
  label,
  labelClassName = '',
  className = ''
}: {
  direction?: 'row' | 'column';
  label: string;
  labelClassName?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <LabelWrapper
      label={label}
      direction={direction}
      labelClassName={labelClassName}
      className={className}>
      <div className="flex w-full flex-grow gap-2">{children}</div>
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
