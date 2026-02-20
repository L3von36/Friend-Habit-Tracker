import { useEffect, useRef } from 'react';

interface GoogleAuthProps {
  onSuccess: (user: { name: string; email: string; picture: string }) => void;
  onFailure?: (error: any) => void;
}

export function GoogleAuth({ onSuccess, onFailure }: GoogleAuthProps) {
  const buttonRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const clientId = (import.meta as any).env.VITE_GOOGLE_CLIENT_ID;
    
    const initializeGSI = () => {
      if (!(window as any).google) return;
      
      (window as any).google.accounts.id.initialize({
        client_id: clientId,
        callback: (response: any) => {
          const user = parseJwt(response.credential);
          if (user) {
            onSuccess({
              name: user.name,
              email: user.email,
              picture: user.picture,
            });
          }
        },
      });

      if (buttonRef.current) {
        (window as any).google.accounts.id.renderButton(buttonRef.current, {
          theme: 'outline',
          size: 'large',
          width: '240',
        });
      }
    };

    // Load script if not already present
    if (!(window as any).google) {
      const script = document.createElement('script');
      script.src = 'https://accounts.google.com/gsi/client';
      script.async = true;
      script.onload = initializeGSI;
      document.head.appendChild(script);
    } else {
      initializeGSI();
    }
  }, [onSuccess]);

  const parseJwt = (token: string) => {
    try {
      const base64Url = token.split('.')[1];
      const base64 = base64Url.replace(/-/g, '+').replace(/_/g, '/');
      const jsonPayload = decodeURIComponent(
        atob(base64)
          .split('')
          .map((c) => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2))
          .join('')
      );
      return JSON.parse(jsonPayload);
    } catch (e) {
      console.error('JWT parsing failed', e);
      if (onFailure) onFailure(e);
      return null;
    }
  };

  return <div ref={buttonRef} className="min-h-[44px] flex items-center justify-center" />;
}
