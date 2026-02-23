import { useEffect, useRef } from 'react';

interface JwtPayload {
  name: string;
  email: string;
  picture: string;
  sub: string; // User ID
}

interface CredentialResponse {
  credential: string;
  select_by: string;
}

const parseJwt = (token: string): JwtPayload | null => {
  try {
    const base64Url = token.split('.')[1];
    const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
    const jsonPayload = decodeURIComponent(
      atob(base64)
        .split('')
        .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
        .join('')
    );
    return JSON.parse(jsonPayload) as JwtPayload;
  } catch (error: unknown) {
    console.error('JWT parsing failed', error);
    return null;
  }
};

declare global {
  interface Window {
    google: {
      accounts: {
        id: {
          initialize: (config: { client_id: string; callback: (response: CredentialResponse) => void }) => void;
          renderButton: (element: HTMLElement, config: { theme: string; size: string; width: string }) => void;
        };
      };
    };
  }
}

interface GoogleAuthProps {
  onSuccess: (user: { name: string; email: string; picture: string }) => void;
  onFailure?: (error: Error | unknown) => void;
}

export function GoogleAuth({ onSuccess, onFailure }: GoogleAuthProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = import.meta.env.VITE_GOOGLE_CLIENT_ID;
    
    const initializeGSI = () => {
      if (!window.google) return;
      
      window.google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: CredentialResponse) => {
          const user = parseJwt(response.credential);
          if (user) {
            onSuccess({
              name: user.name,
              email: user.email,
              picture: user.picture,
            });
          } else if (onFailure) {
             onFailure(new Error('Failed to parse JWT.'));
          }
        },
      });

      if (buttonRef.current) {
        window.google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '240',
        });
      }
    };

    // Load script if not already present
    if (!window.google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initializeGSI;
      document.head.appendChild(script);
    } else {
      initializeGSI();
    }
  }, [onSuccess, onFailure]);

  return <div ref={buttonRef} className="min-h-[44px] flex items-center justify-center" />;
}
