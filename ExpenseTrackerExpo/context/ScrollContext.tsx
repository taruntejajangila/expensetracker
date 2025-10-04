import React, { createContext, useContext, useRef, ReactNode } from 'react';
import { Animated } from 'react-native';

interface ScrollContextType {
  scrollY: Animated.Value;
}

const ScrollContext = createContext<ScrollContextType | undefined>(undefined);

interface ScrollProviderProps {
  children: ReactNode;
}

export const ScrollProvider: React.FC<ScrollProviderProps> = ({ children }) => {
  const scrollY = useRef(new Animated.Value(0)).current;

  const value: ScrollContextType = {
    scrollY,
  };

  return (
    <ScrollContext.Provider value={value}>
      {children}
    </ScrollContext.Provider>
  );
};

export const useScroll = () => {
  const context = useContext(ScrollContext);
  if (context === undefined) {
    throw new Error('useScroll must be used within a ScrollProvider');
  }
  return context;
};


