import { useEffect, useState } from 'react';

export function useMicrophonePermission() {
  const [hasGrantedPermissions, setHasGrantPermissions] = useState(false);

  useEffect(() => {
    if (navigator.permissions) {
      navigator.permissions
        .query({ name: 'microphone' as PermissionName })
        .then((result) => {
          if (result.state === 'granted') {
            setHasGrantPermissions(true);
          } else if (result.state === 'denied') {
            setHasGrantPermissions(false);
          } else {
            setHasGrantPermissions(true);
          }

          // You can also listen for changes
          result.onchange = () => {
            const isGranted = result.state === 'granted';
            setHasGrantPermissions(isGranted);
          };
        })
        .catch((err) => {
          console.error('Permission API error:', err);
        });
    }
  }, []);

  return hasGrantedPermissions;
}
