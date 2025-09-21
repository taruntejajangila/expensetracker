import { Reminder } from '../types/PaymentTypes';

// Calculate days until due date
export const calculateDaysUntilDue = (dueDate: Date | string): number => {
  const now = new Date();
  const dueDateObj = dueDate instanceof Date ? dueDate : new Date(dueDate);
  const diffTime = dueDateObj.getTime() - now.getTime();
  return Math.ceil(diffTime / (1000 * 60 * 60 * 24));
};

// Get urgency color based on days until due
export const getUrgencyColor = (daysUntilDue: number): string => {
  if (daysUntilDue < 0) return '#FF3B30';      // Overdue - Red
  if (daysUntilDue === 0) return '#FF9500';    // Due today - Orange
  if (daysUntilDue <= 3) return '#FF9500';     // Due soon - Orange
  if (daysUntilDue <= 7) return '#FFCC00';     // Due this week - Yellow
  return '#34C759';                            // Future - Green
};

// Format date for display
export const formatDate = (date: Date | string): string => {
  const dateObj = date instanceof Date ? date : new Date(date);
  return dateObj.toLocaleDateString('en-US', {
    weekday: 'short',
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  });
};

// Format time for display
export const formatTime = (time: string): string => {
  const [hours, minutes] = time.split(':');
  const hour = parseInt(hours);
  const ampm = hour >= 12 ? 'PM' : 'AM';
  const displayHour = hour % 12 || 12;
  return `${displayHour}:${minutes} ${ampm}`;
};