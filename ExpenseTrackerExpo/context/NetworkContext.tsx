import React, { createContext, useContext, useState, useEffect, useRef } from 'react';
import { setNetworkErrorHandler } from '../utils/NetworkErrorHandler';

interface NetworkContextType {
  isConnected: boolean;
  isInternetReachable: boolean;
  connectionType: string | null;
  isOfflineMode: boolean;
  isReconnecting: boolean;
  checkConnection: () => Promise<boolean>;
  forceOfflineCheck: () => Promise<void>;
  handleNetworkError: (error: any) => void;
}

const NetworkContext = createContext<NetworkContextType | undefined>(undefined);

export const useNetwork = () => {
  const context = useContext(NetworkContext);
  if (!context) {
    throw new Error('useNetwork must be used within a NetworkProvider');
  }
  return context;
};

interface NetworkProviderProps {
  children: React.ReactNode;
}

export const NetworkProvider: React.FC<NetworkProviderProps> = ({ children }) => {
  const [isConnected, setIsConnected] = useState(true); // Start as online (optimistic)
  const [isInternetReachable, setIsInternetReachable] = useState(true); // Start as online (optimistic)
  const [connectionType, setConnectionType] = useState<string | null>('wifi');
  const checkIntervalRef = useRef<NodeJS.Timeout | null>(null);
  const [isInitialized, setIsInitialized] = useState(false);
  const [isReconnecting, setIsReconnecting] = useState(false);
  const lastNetworkCheck = useRef<number>(0);
  const networkCheckDebounce = 10000; // 10 seconds debounce - much longer
  const consecutiveFailures = useRef<number>(0);
  const requiredFailures = 3; // Require 3 consecutive failures before going offline

  // Handle network errors from API calls
  const handleNetworkError = (error: any) => {
    // Filter out harmless errors that don't indicate network issues
    const harmlessErrors = [
      'Aborted',
      'Request aborted',
      'The operation was aborted',
      'AbortError',
      'Request cancelled',
      'Component unmounted'
    ];
    
    const isHarmlessError = harmlessErrors.some(harmless => 
      error.message?.includes(harmless) || 
      error.name?.includes(harmless)
    );
    
    if (isHarmlessError) {
      // Don't log harmless errors as they clutter the console
      return;
    }
    
    // Use console.error for production visibility
    console.error('🌐 Network error detected:', error.message);
    
    // Don't handle network errors if we're already offline to prevent loops
    if (!isConnected) {
      console.error('🌐 Already offline, ignoring network error to prevent loop');
      return;
    }
    
    // Check if it's a network-related error
    if (error.message?.includes('Network request failed') || 
        error.message?.includes('fetch') ||
        error.message?.includes('timeout') ||
        error.message?.includes('Failed to fetch') ||
        error.message?.includes('Network Error') ||
        error.name === 'TypeError') {
      
      console.error('🌐 Network error confirmed - going offline');
      setIsConnected(false);
      setIsInternetReachable(false);
      setIsReconnecting(false);
      
      // Start monitoring for recovery
      startNetworkMonitoring();
    } else {
      console.error('🌐 Not a network error, ignoring:', error.message);
    }
  };

  // Force an immediate network check with debounce - only when actually needed
  const forceOfflineCheck = async () => {
    const now = Date.now();
    if (now - lastNetworkCheck.current < networkCheckDebounce) {
      console.log('🌐 Network check debounced - too soon since last check');
      return;
    }
    
    lastNetworkCheck.current = now;
    console.log('🌐 Force checking network status...');
    
    // Set reconnecting state to show user that we're checking
    setIsReconnecting(true);
    
    try {
      const isOnline = await checkConnection();
      
      if (isOnline) {
        // Reset failure counter on successful connection
        consecutiveFailures.current = 0;
        setIsConnected(isOnline);
        setIsInternetReachable(isOnline);
        setIsReconnecting(false);
        console.error('🌐 Force check result: Online');
      } else {
        // Increment failure counter
        consecutiveFailures.current += 1;
        console.log(`🌐 Force check failed (${consecutiveFailures.current}/${requiredFailures})`);
        
        // Only go offline after multiple consecutive failures
        if (consecutiveFailures.current >= requiredFailures) {
          console.error('🌐 Multiple failures detected - going offline');
          setIsConnected(false);
          setIsInternetReachable(false);
        }
        setIsReconnecting(false);
      }
    } catch (error) {
      console.log('🌐 Force check error:', error);
      setIsReconnecting(false);
      // Don't change connection state on error, just stop reconnecting
    }
  };

  // Check network connectivity by making a simple API call
  const checkConnection = async (): Promise<boolean> => {
    // Create a timeout promise for React Native compatibility
    const createTimeoutPromise = (ms: number) => {
      return new Promise((_, reject) => {
        setTimeout(() => reject(new Error('Request timeout')), ms);
      });
    };

    try {
      // First try a simple connectivity test with a reliable service
      // Add cache-busting parameter to prevent cached responses
      const timestamp = Date.now();
      const connectivityResponse = await Promise.race([
        fetch(`https://www.google.com?t=${timestamp}`, {
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          }
        }),
        createTimeoutPromise(1500) // Shorter timeout for faster detection
      ]);
      
      if (connectivityResponse.ok) {
        console.log('🌐 Internet connectivity confirmed via Google');
        return true;
      }
    } catch (error) {
      console.log('🌐 Google connectivity check failed:', error.message);
    }
    
    try {
      // Fallback: Try to reach our backend API with cache-busting
      const timestamp = Date.now();
      const response = await Promise.race([
        fetch(`http://192.168.1.4:5000/api/auth/me?t=${timestamp}`, {
          method: 'HEAD',
          cache: 'no-cache',
          headers: {
            'Content-Type': 'application/json',
            'Cache-Control': 'no-cache, no-store, must-revalidate',
            'Pragma': 'no-cache',
            'Expires': '0'
          },
        }),
        createTimeoutPromise(1500) // Shorter timeout for faster detection
      ]);
      
      // Any response means the server is reachable
      const isOnline = true;
      console.log('🌐 Local API check result:', { status: response.status, isOnline });
      return isOnline;
    } catch (error) {
      console.log('🌐 All network checks failed:', error.message);
      return false;
    }
  };

  // Periodic network check - only when we're actually offline
  const startNetworkMonitoring = () => {
    if (checkIntervalRef.current) {
      clearInterval(checkIntervalRef.current);
    }
    
    checkIntervalRef.current = setInterval(async () => {
      // Only check if we're currently offline to avoid unnecessary checks
      if (!isConnected) {
        const now = Date.now();
        if (now - lastNetworkCheck.current < networkCheckDebounce) {
          console.log('🌐 Periodic check debounced - too soon since last check');
          return;
        }
        
        lastNetworkCheck.current = now;
        const isOnline = await checkConnection();
        
        if (isOnline) {
          // Reset failure counter on successful connection
          consecutiveFailures.current = 0;
          console.log('🌐 Network restored!');
          setIsConnected(isOnline);
          setIsInternetReachable(isOnline);
          setIsReconnecting(false);
        } else {
          // Increment failure counter
          consecutiveFailures.current += 1;
          console.log(`🌐 Network check failed (${consecutiveFailures.current}/${requiredFailures})`);
          
          // Only go offline after multiple consecutive failures
          if (consecutiveFailures.current >= requiredFailures) {
            console.log('🌐 Multiple failures detected - staying offline');
            // Already offline, no need to change state
          }
        }
      }
    }, 60000); // Check every 60 seconds when offline only - very infrequent
  };

  useEffect(() => {
    // Register the network error handler globally
    setNetworkErrorHandler(handleNetworkError);
    
    // Initial check with minimal delay - but don't show offline screen immediately
    const initialCheck = async () => {
      // Small delay to let the app initialize
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      const isOnline = await checkConnection();
      
      // Only update state if we're actually offline
      if (!isOnline) {
        console.log('🌐 Initial check: Network is offline');
        setIsConnected(false);
        setIsInternetReachable(false);
        startNetworkMonitoring();
      } else {
        console.log('🌐 Initial check: Network is online');
        // Keep the optimistic online state
      }
      
      setIsInitialized(true);
      console.log('🌐 Initial network check completed');
    };
    
    initialCheck();
    
    return () => {
      if (checkIntervalRef.current) {
        clearInterval(checkIntervalRef.current);
      }
    };
  }, []);

  // Show offline mode when we're offline, but also show reconnecting state
  // This prevents showing offline screen when network is working fine
  const isOfflineMode = isInitialized && (!isConnected || !isInternetReachable) && !isReconnecting;
  
  // Debug logging
  console.log('🌐 Network State:', { 
    isInitialized, 
    isConnected, 
    isInternetReachable, 
    isReconnecting,
    isOfflineMode 
  });

  const value: NetworkContextType = {
    isConnected,
    isInternetReachable,
    connectionType,
    isOfflineMode,
    isReconnecting,
    checkConnection,
    forceOfflineCheck,
    handleNetworkError,
  };

  return (
    <NetworkContext.Provider value={value}>
      {children}
    </NetworkContext.Provider>
  );
};
