import React from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { useAuth } from '../../context/AuthContext';

const OfflineIndicator: React.FC = () => {
  const { isOfflineMode } = useAuth();

  if (!isOfflineMode) {
    return null;
  }

  return (
    <View style={styles.container}>
      <Text style={styles.text}>📡 You're offline - some features may be limited</Text>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    backgroundColor: '#FF6B6B',
    paddingVertical: 8,
    paddingHorizontal: 16,
    alignItems: 'center',
    justifyContent: 'center',
  },
  text: {
    color: 'white',
    fontSize: 12,
    fontWeight: '500',
  },
});

export default OfflineIndicator;
