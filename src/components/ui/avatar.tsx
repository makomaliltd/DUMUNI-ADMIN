import * as React from 'react';
import { cn } from '@/lib/utils';

interface AvatarProps extends React.HTMLAttributes<HTMLDivElement> {
  src?: string;
  alt?: string;
  fallback?: string;
}

const Avatar = React.forwardRef<HTMLDivElement, AvatarProps>(
  ({ className, src, alt, fallback, ...props }, ref) => {
    const [imageError, setImageError] = React.useState(false);

    const getInitials = (name?: string): string => {
      if (!name) return '?';
      return name.slice(0, 2).toUpperCase();
    };

    return (
      <div
        ref={ref}
        className={cn(
          'relative flex h-9 w-9 shrink-0 overflow-hidden rounded-full',
          className
        )}
        {...props}
      >
        {src && !imageError ? (
          <img
            src={src}
            alt={alt || ''}
            className="h-full w-full object-cover"
            onError={() => setImageError(true)}
          />
        ) : (
          <div className="flex h-full w-full items-center justify-center bg-primary-500/10 text-primary-500 text-sm font-medium">
            {fallback || getInitials(alt)}
          </div>
        )}
      </div>
    );
  }
);
Avatar.displayName = 'Avatar';

export { Avatar };