import { getPool } from '../config/database';
import { logger } from '../utils/logger';

// Analytics Service - Fixed column names (transaction_date, transaction_type)

export interface SpendingTrend {
  period: string;
  totalAmount: number;
  transactionCount: number;
  percentageChange: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  confidence: number;
}

export interface CategoryInsight {
  categoryId: string;
  categoryName: string;
  totalSpent: number;
  averageMonthly: number;
  percentageOfTotal: number;
  rank: number;
  budgetPerformance?: number;
  trend: 'increasing' | 'decreasing' | 'stable';
  recommendations: string[];
}

export interface FinancialHealthScore {
  overallScore: number;
  breakdown: {
    budgetAdherence: number;
    savingsRate: number;
    debtManagement: number;
    emergencyFund: number;
    investmentRatio: number;
  };
  grade: 'A' | 'B' | 'C' | 'D' | 'F';
  recommendations: string[];
}

export interface SpendingPrediction {
  nextMonthPrediction: number;
  confidence: number;
  highRiskCategories: string[];
  savingsOpportunity: number;
  recommendations: string[];
}

class AnalyticsService {
  private static instance: AnalyticsService;

  static getInstance(): AnalyticsService {
    if (!AnalyticsService.instance) {
      AnalyticsService.instance = new AnalyticsService();
    }
    return AnalyticsService.instance;
  }

  // Get spending trends for a user over different time periods
  async getSpendingTrends(userId: string, months: number = 6): Promise<SpendingTrend[]> {
    try {
      const pool = getPool();
      
      // Get monthly spending data
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_spent,
          COUNT(*) as transaction_count
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_date >= NOW() - INTERVAL '${months} months'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month ASC
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length < 2) {
        return [];
      }

      const trends: SpendingTrend[] = [];
      
      for (let i = 1; i < result.rows.length; i++) {
        const current = result.rows[i];
        const previous = result.rows[i - 1];
        
        const percentageChange = previous.total_spent > 0 
          ? ((current.total_spent - previous.total_spent) / previous.total_spent) * 100
          : 0;
        
        const trend: 'increasing' | 'decreasing' | 'stable' = 
          percentageChange > 5 ? 'increasing' :
          percentageChange < -5 ? 'decreasing' : 'stable';
        
        trends.push({
          period: current.month.toISOString().slice(0, 7), // YYYY-MM format
          totalAmount: parseFloat(current.total_spent),
          transactionCount: parseInt(current.transaction_count),
          percentageChange: Math.round(percentageChange * 100) / 100,
          trend,
          confidence: Math.min(95, Math.max(70, 100 - Math.abs(percentageChange)))
        });
      }
      
      return trends;
    } catch (error) {
      logger.error('Error getting spending trends:', error);
      throw error;
    }
  }

  // Get category insights and analysis
  async getCategoryInsights(userId: string, months: number = 3): Promise<CategoryInsight[]> {
    try {
      const pool = getPool();
      
      const query = `
        SELECT 
          c.id as category_id,
          c.name as category_name,
          c.color,
          c.icon,
          SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as total_spent,
          COUNT(*) as transaction_count,
          AVG(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) as avg_amount
        FROM categories c
        LEFT JOIN transactions t ON c.id = t.category_id AND t.user_id = $1
        WHERE c.is_default = true
          AND (t.transaction_date IS NULL OR t.transaction_date >= NOW() - INTERVAL '${months} months')
        GROUP BY c.id, c.name, c.color, c.icon
        HAVING SUM(CASE WHEN t.transaction_type = 'expense' THEN t.amount ELSE 0 END) > 0
        ORDER BY total_spent DESC
      `;
      
      const result = await pool.query(query, [userId]);
      
      // Get total spending for percentage calculation
      const totalSpent = result.rows.reduce((sum, row) => sum + parseFloat(row.total_spent), 0);
      
      const insights: CategoryInsight[] = result.rows.map((row, index) => {
        const percentageOfTotal = totalSpent > 0 ? (parseFloat(row.total_spent) / totalSpent) * 100 : 0;
        
        // Generate recommendations based on spending patterns
        const recommendations: string[] = [];
        if (percentageOfTotal > 30) {
          recommendations.push('This category represents a large portion of your spending. Consider setting a budget.');
        }
        if (parseFloat(row.avg_amount) > 1000) {
          recommendations.push('Your average transaction in this category is high. Look for ways to reduce individual purchase amounts.');
        }
        if (parseInt(row.transaction_count) > 20) {
          recommendations.push('You make many small purchases in this category. Consider bulk buying or reducing frequency.');
        }
        
        return {
          categoryId: row.category_id,
          categoryName: row.category_name,
          totalSpent: parseFloat(row.total_spent),
          averageMonthly: parseFloat(row.total_spent) / months,
          percentageOfTotal: Math.round(percentageOfTotal * 100) / 100,
          rank: index + 1,
          trend: 'stable', // Will be enhanced with historical comparison
          recommendations: recommendations.length > 0 ? recommendations : ['Your spending in this category looks balanced.']
        };
      });
      
      return insights;
    } catch (error) {
      logger.error('Error getting category insights:', error);
      throw error;
    }
  }

  // Calculate financial health score
  async getFinancialHealthScore(userId: string): Promise<FinancialHealthScore> {
    try {
      const pool = getPool();
      
      // Get current month data
      const currentMonth = new Date();
      const startOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth(), 1);
      const endOfMonth = new Date(currentMonth.getFullYear(), currentMonth.getMonth() + 1, 0);
      
      // Get monthly income and expenses
      const incomeQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_income
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_type = 'income' 
          AND transaction_date >= $2 
          AND transaction_date <= $3
      `;
      
      const expenseQuery = `
        SELECT COALESCE(SUM(amount), 0) as total_expenses
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_type = 'expense' 
          AND transaction_date >= $2 
          AND transaction_date <= $3
      `;
      
      const [incomeResult, expenseResult] = await Promise.all([
        pool.query(incomeQuery, [userId, startOfMonth, endOfMonth]),
        pool.query(expenseQuery, [userId, startOfMonth, endOfMonth])
      ]);
      
      const monthlyIncome = parseFloat(incomeResult.rows[0]?.total_income || '0');
      const monthlyExpenses = parseFloat(expenseResult.rows[0]?.total_expenses || '0');
      
      // Calculate scores
      const savingsRate = monthlyIncome > 0 ? ((monthlyIncome - monthlyExpenses) / monthlyIncome) * 100 : 0;
      const budgetAdherence = 85; // Placeholder - will be enhanced with actual budget data
      const debtManagement = 90; // Placeholder - will be enhanced with debt data
      const emergencyFund = 65; // Placeholder - will be enhanced with savings data
      const investmentRatio = 45; // Placeholder - will be enhanced with investment data
      
      // Calculate overall score
      const overallScore = Math.round(
        (budgetAdherence + savingsRate + debtManagement + emergencyFund + investmentRatio) / 5
      );
      
      // Determine grade
      const grade: 'A' | 'B' | 'C' | 'D' | 'F' = 
        overallScore >= 90 ? 'A' :
        overallScore >= 80 ? 'B' :
        overallScore >= 70 ? 'C' :
        overallScore >= 60 ? 'D' : 'F';
      
      // Generate recommendations
      const recommendations: string[] = [];
      if (savingsRate < 20) {
        recommendations.push('Aim to save at least 20% of your income. Consider setting up automatic transfers.');
      }
      if (emergencyFund < 80) {
        recommendations.push('Build your emergency fund to cover 6 months of expenses.');
      }
      if (investmentRatio < 60) {
        recommendations.push('Consider increasing your investment allocation for long-term wealth building.');
      }
      
      return {
        overallScore,
        breakdown: {
          budgetAdherence,
          savingsRate: Math.round(savingsRate * 100) / 100,
          debtManagement,
          emergencyFund,
          investmentRatio
        },
        grade,
        recommendations: recommendations.length > 0 ? recommendations : ['Great job! Your financial health looks strong.']
      };
    } catch (error) {
      logger.error('Error calculating financial health score:', error);
      throw error;
    }
  }

  // Get spending predictions for next month
  async getSpendingPrediction(userId: string): Promise<SpendingPrediction> {
    try {
      const pool = getPool();
      
      // Get last 3 months of spending data
      const query = `
        SELECT 
          DATE_TRUNC('month', transaction_date) as month,
          SUM(CASE WHEN transaction_type = 'expense' THEN amount ELSE 0 END) as total_spent
        FROM transactions 
        WHERE user_id = $1 
          AND transaction_type = 'expense'
          AND transaction_date >= NOW() - INTERVAL '3 months'
        GROUP BY DATE_TRUNC('month', transaction_date)
        ORDER BY month DESC
        LIMIT 3
      `;
      
      const result = await pool.query(query, [userId]);
      
      if (result.rows.length === 0) {
        return {
          nextMonthPrediction: 0,
          confidence: 0,
          highRiskCategories: [],
          savingsOpportunity: 0,
          recommendations: ['Not enough data for predictions yet.']
        };
      }
      
      // Simple linear regression for prediction
      const months = result.rows.length;
      let sumX = 0, sumY = 0, sumXY = 0, sumX2 = 0;
      
      result.rows.forEach((row, index) => {
        const x = months - index;
        const y = parseFloat(row.total_spent);
        sumX += x;
        sumY += y;
        sumXY += x * y;
        sumX2 += x * x;
      });
      
      const slope = (months * sumXY - sumX * sumY) / (months * sumX2 - sumX * sumX);
      const intercept = (sumY - slope * sumX) / months;
      
      const nextMonthPrediction = Math.max(0, slope * (months + 1) + intercept);
      
      // Calculate confidence based on data consistency
      const variance = result.rows.reduce((sum, row) => {
        const diff = parseFloat(row.total_spent) - (sumY / months);
        return sum + diff * diff;
      }, 0) / months;
      
      const confidence = Math.max(50, Math.min(95, 100 - Math.sqrt(variance) / 1000));
      
      // Identify high-risk categories (simplified)
      const highRiskCategories = ['Dining Out', 'Shopping', 'Entertainment'];
      
      // Calculate savings opportunity
      const currentMonthSpending = parseFloat(result.rows[0]?.total_spent || '0');
      const savingsOpportunity = Math.max(0, currentMonthSpending * 0.15); // Assume 15% savings potential
      
      const recommendations: string[] = [];
      if (nextMonthPrediction > currentMonthSpending * 1.1) {
        recommendations.push('Your spending is trending upward. Consider reviewing your budget categories.');
      }
      if (savingsOpportunity > 0) {
        recommendations.push(`You could potentially save ₹${Math.round(savingsOpportunity)} next month by optimizing your spending.`);
      }
      
      return {
        nextMonthPrediction: Math.round(nextMonthPrediction),
        confidence: Math.round(confidence),
        highRiskCategories,
        savingsOpportunity: Math.round(savingsOpportunity),
        recommendations: recommendations.length > 0 ? recommendations : ['Your spending patterns look stable.']
      };
    } catch (error) {
      logger.error('Error getting spending prediction:', error);
      throw error;
    }
  }

  // Get comprehensive analytics summary
  async getAnalyticsSummary(userId: string): Promise<{
    trends: SpendingTrend[];
    insights: CategoryInsight[];
    healthScore: FinancialHealthScore;
    prediction: SpendingPrediction;
  }> {
    try {
      const [trends, insights, healthScore, prediction] = await Promise.all([
        this.getSpendingTrends(userId),
        this.getCategoryInsights(userId),
        this.getFinancialHealthScore(userId),
        this.getSpendingPrediction(userId)
      ]);
      
      return {
        trends,
        insights,
        healthScore,
        prediction
      };
    } catch (error) {
      logger.error('Error getting analytics summary:', error);
      throw error;
    }
  }
}

export default AnalyticsService;
