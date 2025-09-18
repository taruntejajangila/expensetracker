import React from 'react';
import {  View, Text, StyleSheet  } from 'react-native';


import { Ionicons } from '@expo/vector-icons';
import { LinearGradient } from 'expo-linear-gradient';

interface SpendingAnalyticsProps {
  spendingData: {
    totalSpent: number;
    topCategories: Array<{
      category: string;
      amount: number;
      percentage: number;
      color: string;
      icon: string;
    }>;
  } | null;
}

const SpendingAnalytics: React.FC<SpendingAnalyticsProps> = ({ spendingData }) => {
  return (
    <View style={styles.section}>
      <LinearGradient
        colors={['#667eea', '#764ba2']}
        start={{ x: 0, y: 0 }}
        end={{ x: 1, y: 1 }}
        style={styles.spendingCard}
      >
        <View style={styles.spendingHeader}>
          <View style={styles.spendingIconContainer}>
            <Ionicons name="analytics" size={24} color="#FFFFFF" />
          </View>
          <View style={styles.spendingHeaderText}>
            <Text style={styles.spendingTitle} allowFontScaling={false}>Spending Analytics</Text>
            <Text style={styles.spendingSubtitle} allowFontScaling={false}>This month's breakdown</Text>
          </View>
        </View>
        
        {spendingData && spendingData.topCategories && spendingData.topCategories.length > 0 ? (
          <>
            <View style={styles.spendingGrid}>
              {spendingData.topCategories.map((category, index) => (
                <View key={category.category} style={styles.spendingRow}>
                  <View style={styles.categoryContainer}>
                    <View style={[styles.categoryIcon, { backgroundColor: category.color }]}>
                      <Ionicons name={category.icon as any} size={16} color="#FFFFFF" />
                    </View>
                    <View style={styles.categoryDetails}>
                      <Text style={styles.modernCategoryName} allowFontScaling={false}>
                        {category.category.charAt(0).toUpperCase() + category.category.slice(1)}
                      </Text>
                      <Text style={styles.categoryAmount} allowFontScaling={false}>₹{category.amount.toLocaleString()}</Text>
                    </View>
                    <View style={styles.percentageContainer}>
                      <Text style={styles.modernPercentage} allowFontScaling={false}>{category.percentage && !isNaN(category.percentage) ? category.percentage.toFixed(1) : '0.0'}%</Text>
                    </View>
                  </View>
                  <View style={styles.modernProgressContainer}>
                    <View style={[styles.modernProgressBar, { 
                      width: `${Math.min(category.percentage && !isNaN(category.percentage) ? category.percentage : 0, 100)}%`, 
                      backgroundColor: category.color 
                    }]} />
                  </View>
                </View>
              ))}
            </View>

            <View style={styles.totalSpendingContainer}>
              <Text style={styles.totalSpendingLabel} allowFontScaling={false}>Total Spending</Text>
              <Text style={styles.totalSpendingAmount} allowFontScaling={false}>
                ₹{spendingData.totalSpent.toLocaleString()}
              </Text>
            </View>
          </>
        ) : (
          <View style={styles.noDataContainer}>
            <Ionicons name="analytics-outline" size={48} color="rgba(255, 255, 255, 0.5)" />
            <Text style={styles.noDataText} allowFontScaling={false}>No spending data available</Text>
            <Text style={styles.noDataSubtext} allowFontScaling={false}>Your spending analytics will appear here</Text>
          </View>
        )}
      </LinearGradient>
    </View>
  );
};

const styles = StyleSheet.create({
  section: {
    marginTop: 24,
    paddingHorizontal: 20,
  },
  spendingCard: {
    borderRadius: 20,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 12 },
    shadowOpacity: 0.25,
    shadowRadius: 16,
    elevation: 15,
  },
  spendingHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 24,
  },
  spendingIconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  spendingHeaderText: {
    flex: 1,
  },
  spendingTitle: {

    color: '#FFFFFF',
    marginBottom: 2,
  },
  spendingSubtitle: {

    color: 'rgba(255, 255, 255, 0.8)',
  },
  spendingGrid: {
    marginBottom: 20,
  },
  spendingRow: {
    marginBottom: 16,
  },
  categoryContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryDetails: {
    flex: 1,
  },
  modernCategoryName: {

    color: '#FFFFFF',
    marginBottom: 2,
  },
  categoryAmount: {

    color: 'rgba(255, 255, 255, 0.8)',
  },
  percentageContainer: {
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
    marginLeft: 12,
  },
  modernPercentage: {

    color: '#FFFFFF',
  },
  modernProgressContainer: {
    height: 6,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    borderRadius: 3,
    overflow: 'hidden',
  },
  modernProgressBar: {
    height: '100%',
    borderRadius: 3,
  },
  totalSpendingContainer: {
    borderTopWidth: 1,
    borderTopColor: 'rgba(255, 255, 255, 0.2)',
    paddingTop: 20,
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  totalSpendingLabel: {

    color: 'rgba(255, 255, 255, 0.9)',
  },
  totalSpendingAmount: {

    color: '#FFFFFF',
  },
  noDataContainer: {
    alignItems: 'center',
    paddingVertical: 40,
  },
  noDataText: {

    color: '#FFFFFF',
    marginTop: 16,
    marginBottom: 4,
  },
  noDataSubtext: {

    color: 'rgba(255, 255, 255, 0.7)',
  },
});

export default SpendingAnalytics;
