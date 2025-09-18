import React from 'react';
import { View, StyleSheet } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface TabBarIconProps {
  routeName: string;
  focused: boolean;
  color: string;
  size: number;
}

const TabBarIcon: React.FC<TabBarIconProps> = ({ routeName, focused, color, size }) => {
  const getIconName = () => {
    switch (routeName) {
      case 'Home':
        return focused ? 'home' : 'home-outline';
      case 'SpentInMonth':
        return focused ? 'analytics' : 'analytics-outline';
      case 'Profile':
        return focused ? 'person' : 'person-outline';
      default:
        return 'ellipse-outline';
    }
  };

  const styles = StyleSheet.create({
    container: {
      width: size * 1.2,
      height: size * 1.2,
      justifyContent: 'center',
      alignItems: 'center',
    },
  });

  return (
    <View style={styles.container}>
      <Ionicons 
        name={getIconName() as any} 
        size={size} 
        color={color}
      />
    </View>
  );
};

export default TabBarIcon; 