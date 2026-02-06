import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const shellVariants = cva('flex flex-col gap-6 p-6', {
  variants: {
    layout: {
      default: 'max-w-[1600px] mx-auto w-full',
      centered: 'max-w-4xl mx-auto w-full',
      full: 'w-full',
    },
  },
  defaultVariants: {
    layout: 'default',
  },
});

interface ShellProps
  extends React.HTMLAttributes<HTMLDivElement>,
    VariantProps<typeof shellVariants> {
  as?: React.ElementType;
}

function Shell({ className, layout, as: Component = 'div', ...props }: ShellProps) {
  return (
    <Component className={cn(shellVariants({ layout }), className)} {...props} />
  );
}

interface ShellHeaderProps extends React.HTMLAttributes<HTMLDivElement> {
  heading?: string;
  text?: string;
  children?: React.ReactNode;
}

function ShellHeader({
  className,
  heading,
  text,
  children,
  ...props
}: ShellHeaderProps) {
  return (
    <div
      className={cn(
        'flex flex-col gap-4 md:flex-row md:items-center md:justify-between',
        className
      )}
      {...props}
    >
      <div className="grid gap-1">
        {heading && (
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            {heading}
          </h1>
        )}
        {text && <p className="text-sm text-muted-foreground">{text}</p>}
      </div>
      {children}
    </div>
  );
}

function ShellContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-6', className)} {...props} />;
}

export { Shell, ShellHeader, ShellContent };
