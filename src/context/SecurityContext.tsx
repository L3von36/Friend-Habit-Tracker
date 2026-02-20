import React, { createContext, useContext, useState, useEffect } from 'react';
import CryptoJS from 'crypto-js';

interface SecurityContextType {
  isAuthenticated: boolean;
  isLockEnabled: boolean;
  login: (pin: string) => boolean;
  logout: () => void;
  setLock: (pin: string) => void;
  removeLock: () => void;
  hasSetPin: boolean;
}

const SecurityContext = createContext<SecurityContextType | undefined>(undefined);

export function SecurityProvider({ children }: { children: React.ReactNode }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLockEnabled, setIsLockEnabled] = useState(false);
  const [storedHash, setStoredHash] = useState<string | null>(null);

  useEffect(() => {
    // Check local storage for lock settings on mount
    const hash = localStorage.getItem('app_lock_hash');
    const enabled = localStorage.getItem('app_lock_enabled') === 'true';
    
    setStoredHash(hash);
    setIsLockEnabled(!!hash && enabled);
    
    // If lock is enabled, we start as NOT authenticated. 
    // If lock is disabled or not set, we are authenticated.
    if (!hash || !enabled) {
      setIsAuthenticated(true);
    }
  }, []);

  const hashPin = (pin: string) => {
    return CryptoJS.SHA256(pin).toString();
  };

  const login = (pin: string) => {
    if (!storedHash) return false;
    
    if (hashPin(pin) === storedHash) {
      setIsAuthenticated(true);
      return true;
    }
    return false;
  };

  const logout = () => {
    if (isLockEnabled) {
      setIsAuthenticated(false);
    }
  };

  const setLock = (pin: string) => {
    const hash = hashPin(pin);
    localStorage.setItem('app_lock_hash', hash);
    localStorage.setItem('app_lock_enabled', 'true');
    setStoredHash(hash);
    setIsLockEnabled(true);
    setIsAuthenticated(true); // Setting lock keeps you logged in initially
  };

  const removeLock = () => {
    localStorage.removeItem('app_lock_hash');
    localStorage.removeItem('app_lock_enabled');
    setStoredHash(null);
    setIsLockEnabled(false);
    setIsAuthenticated(true);
  };

  // Auto-lock on visibility change (backgrounding) could be added here
  useEffect(() => {
     const handleVisibilityChange = () => {
       if (document.visibilityState === 'hidden' && isLockEnabled) {
         setIsAuthenticated(false);
       }
     };
     document.addEventListener('visibilitychange', handleVisibilityChange);
     return () => document.removeEventListener('visibilitychange', handleVisibilityChange);
  }, [isLockEnabled]);

  return (
    <SecurityContext.Provider value={{ 
      isAuthenticated, 
      isLockEnabled, 
      login, 
      logout, 
      setLock, 
      removeLock,
      hasSetPin: !!storedHash 
    }}>
      {children}
    </SecurityContext.Provider>
  );
}

export function useSecurity() {
  const context = useContext(SecurityContext);
  if (context === undefined) {
    throw new Error('useSecurity must be used within a SecurityProvider');
  }
  return context;
}
