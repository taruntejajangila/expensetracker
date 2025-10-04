import React from 'react';
import {  View, Text, StyleSheet, ScrollView, TouchableOpacity  } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

const IconSelector: React.FC = () => {
  const { theme } = useTheme();

  const graphIcons = [
    { name: 'bar-chart', label: 'Bar Chart' },
    { name: 'bar-chart-outline', label: 'Bar Chart Outline' },
    { name: 'analytics', label: 'Analytics' },
    { name: 'analytics-outline', label: 'Analytics Outline' },
    { name: 'trending-up', label: 'Trending Up' },
    { name: 'trending-up-outline', label: 'Trending Up Outline' },
    { name: 'trending-down', label: 'Trending Down' },
    { name: 'trending-down-outline', label: 'Trending Down Outline' },
    { name: 'pie-chart', label: 'Pie Chart' },
    { name: 'pie-chart-outline', label: 'Pie Chart Outline' },
    { name: 'stats-chart', label: 'Stats Chart' },
    { name: 'stats-chart-outline', label: 'Stats Chart Outline' },
    { name: 'grid', label: 'Grid' },
    { name: 'grid-outline', label: 'Grid Outline' },
    { name: 'calculator', label: 'Calculator' },
    { name: 'calculator-outline', label: 'Calculator Outline' },
    { name: 'wallet', label: 'Wallet' },
    { name: 'wallet-outline', label: 'Wallet Outline' },
    { name: 'card', label: 'Card' },
    { name: 'card-outline', label: 'Card Outline' },
    { name: 'cash', label: 'Cash' },
    { name: 'cash-outline', label: 'Cash Outline' },
    { name: 'business', label: 'Business' },
    { name: 'business-outline', label: 'Business Outline' },
    { name: 'pie-chart', label: 'Pie Chart' },
    { name: 'pie-chart-outline', label: 'Pie Chart Outline' },
    { name: 'layers', label: 'Layers' },
    { name: 'layers-outline', label: 'Layers Outline' },
    { name: 'chart', label: 'Chart' },
    { name: 'chart-outline', label: 'Chart Outline' },
  ];

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.colors.background,
      padding: 16,
    },
    title: {
      color: theme.colors.text,
      marginBottom: 20,
    },
    grid: {
      flexDirection: 'row',
      flexWrap: 'wrap',
      justifyContent: 'space-between',
    },
    iconItem: {
      width: '30%',
      backgroundColor: theme.colors.surface,
      borderRadius: 8,
      padding: 16,
      marginBottom: 12,
      alignItems: 'center',
      borderWidth: 1,
      borderColor: theme.colors.border,
    },
    icon: {
      marginBottom: 8,
    },
    iconLabel: {
      color: theme.colors.textSecondary,
    },
  });

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.title} allowFontScaling={false}>Available Graph/Chart Icons</Text>
      <View style={styles.grid}>
        {graphIcons.map((icon, index) => (
          <View key={index} style={styles.iconItem}>
            <Ionicons 
              name={icon.name as any} 
              size={24} 
              color={theme.colors.primary} 
              style={styles.icon}
            />
            <Text style={styles.iconLabel} allowFontScaling={false}>{icon.label}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
};

export default IconSelector;

