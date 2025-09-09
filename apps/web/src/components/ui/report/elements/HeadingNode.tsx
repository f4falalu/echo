import { cva, type VariantProps } from 'class-variance-authority';
import type { PlateElementProps } from 'platejs/react';
import { PlateElement } from 'platejs/react';

const headingVariants = cva('relative mb-1', {
  variants: {
    variant: {
      h1: 'mt-8 mb-1.5 text-2xl font-semibold ',
      h2: 'mt-6 mb-1.5 text-xl font-semibold ',
      h3: 'mt-5 mb-1 text-lg font-semibold ',
      h4: 'mt-4 mb-1 text-base font-semibold ',
      h5: 'mt-4 mb-1 text-sm font-semibold ',
      h6: 'mt-4 mb-1 text-xs font-semibold ',
    },
  },
});

export function HeadingElement({
  variant = 'h1',
  ...props
}: PlateElementProps & VariantProps<typeof headingVariants>) {
  return (
    <PlateElement as={variant as 'h1'} className={headingVariants({ variant })} {...props}>
      {props.children}
    </PlateElement>
  );
}

export function H1Element(props: PlateElementProps) {
  return <HeadingElement variant="h1" {...props} />;
}

export function H2Element(props: PlateElementProps) {
  return <HeadingElement variant="h2" {...props} />;
}

export function H3Element(props: PlateElementProps) {
  return <HeadingElement variant="h3" {...props} />;
}

export function H4Element(props: PlateElementProps) {
  return <HeadingElement variant="h4" {...props} />;
}

export function H5Element(props: PlateElementProps) {
  return <HeadingElement variant="h5" {...props} />;
}

export function H6Element(props: PlateElementProps) {
  return <HeadingElement variant="h6" {...props} />;
}
