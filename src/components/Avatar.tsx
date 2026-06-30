import { useState, useEffect } from 'react';
import { cn } from '../utils/cn';

interface AvatarProps {
  photoURL?: string | null;
  avatar?: string | null;
  name: string;
  className?: string;
}

export function Avatar({ photoURL, avatar, name, className }: AvatarProps) {
  const [imgError, setImgError] = useState(false);
  const initials = avatar && !avatar.startsWith('http') ? avatar : name.charAt(0).toUpperCase();
  const imgSrc = photoURL || (avatar && avatar.startsWith('http') ? avatar : null);

  useEffect(() => {
    setImgError(false);
  }, [imgSrc]);

  return (
    <div className={cn("relative flex items-center justify-center overflow-hidden", className)}>
      <span className="z-0">{initials}</span>
      {imgSrc && !imgError && (
        <img
          src={imgSrc}
          alt={name}
          className="absolute inset-0 w-full h-full object-cover z-10"
          loading="lazy"
          onError={() => setImgError(true)}
        />
      )}
    </div>
  );
}
