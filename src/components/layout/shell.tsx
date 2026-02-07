import React from 'react';
import { cn } from '@/lib/utils';
import { cva, type VariantProps } from 'class-variance-authority';

const shellVariants = cva('flex flex-col gap-8 p-6 md:p-8 lg:p-10 animate-fade-in', {
  variants: {
    layout: {
      default: 'max-w-[1600px] mx-auto w-full',
      centered: 'max-w-4xl mx-auto w-full',
      wide: 'max-w-[1800px] mx-auto w-full',
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

function Shell({ className, layout, as: Component = 'main', ...props }: ShellProps) {
  return (
    <Component
      id="main-content"
      className={cn(shellVariants({ layout }), className)}
      {...props}
    />
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
        'flex flex-col gap-4 md:flex-row md:items-start md:justify-between pb-2',
        className
      )}
      {...props}
    >
      <div className="flex flex-col gap-2">
        {heading && (
          <h1 className="text-3xl md:text-4xl font-bold tracking-tight text-foreground">
            {heading}
          </h1>
        )}
        {text && (
          <p className="text-base text-muted-foreground max-w-2xl leading-relaxed">
            {text}
          </p>
        )}
      </div>
      {children && (
        <div className="flex gap-2 items-center flex-shrink-0">
          {children}
        </div>
      )}
    </div>
  );
}

function ShellContent({ className, ...props }: React.HTMLAttributes<HTMLDivElement>) {
  return <div className={cn('space-y-8', className)} {...props} />;
}

export { Shell, ShellHeader, ShellContent };
