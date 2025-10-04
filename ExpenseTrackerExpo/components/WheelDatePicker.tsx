import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Platform,
  Modal,
  Dimensions,
  ScrollView,
  Animated,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface WheelDatePickerProps {
  selectedDate: Date;
  onDateChange: (date: Date) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

const WheelDatePicker: React.FC<WheelDatePickerProps> = ({
  selectedDate,
  onDateChange,
  placeholder = 'Select Date',
  label,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [tempDate, setTempDate] = useState(selectedDate);
  
  // Refs for scroll views
  const monthScrollRef = useRef<ScrollView>(null);
  const dayScrollRef = useRef<ScrollView>(null);
  const yearScrollRef = useRef<ScrollView>(null);

  // Generate arrays for wheel picker
  const currentYear = new Date().getFullYear();
  const years = Array.from({ length: 50 }, (_, i) => currentYear - 25 + i);
  const months = [
    'January', 'February', 'March', 'April', 'May', 'June',
    'July', 'August', 'September', 'October', 'November', 'December'
  ];
  const days = Array.from({ length: 31 }, (_, i) => i + 1);

  const formatDate = (date: Date) => {
    const day = date.getDate();
    const month = date.toLocaleDateString('en-US', { month: 'long' });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'short' });
    
    // Add ordinal suffix to day
    const getOrdinalSuffix = (day: number) => {
      if (day >= 11 && day <= 13) {
        return 'th';
      }
      switch (day % 10) {
        case 1: return 'st';
        case 2: return 'nd';
        case 3: return 'rd';
        default: return 'th';
      }
    };
    
    return `${day}${getOrdinalSuffix(day)} ${month} ${year}' ${weekday}`;
  };

  const formatInputDate = (date: Date) => {
    const day = date.getDate().toString().padStart(2, '0');
    const month = date.toLocaleDateString('en-US', { month: 'short' });
    const year = date.getFullYear();
    const weekday = date.toLocaleDateString('en-US', { weekday: 'long' });
    
    return `${weekday}, ${day} ${month} ${year}`;
  };

  const getDaysInMonth = (year: number, month: number) => {
    return new Date(year, month + 1, 0).getDate();
  };

  const handleToday = () => {
    const today = new Date();
    setTempDate(today);
    
    // Scroll to today's position
    const monthIndex = today.getMonth();
    const day = today.getDate();
    const year = today.getFullYear();
    const yearIndex = years.indexOf(year);
    
    // Scroll to today's positions
    monthScrollRef.current?.scrollTo({ y: monthIndex * 44, animated: true });
    dayScrollRef.current?.scrollTo({ y: (day - 1) * 44, animated: true });
    yearScrollRef.current?.scrollTo({ y: yearIndex * 44, animated: true });
  };

  const handleDone = () => {
    onDateChange(tempDate);
    setShowDatePicker(false);
  };

  const handleCancel = () => {
    setTempDate(selectedDate);
    setShowDatePicker(false);
  };

  const updateDate = (year: number, month: number, day: number) => {
    const daysInMonth = getDaysInMonth(year, month);
    const validDay = Math.min(day, daysInMonth);
    const newDate = new Date(year, month, validDay);
    setTempDate(newDate);
  };

  const handleMonthScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const monthIndex = Math.round(scrollY / 44);
    const clampedIndex = Math.max(0, Math.min(monthIndex, 11));
    updateDate(tempDate.getFullYear(), clampedIndex, tempDate.getDate());
  };

  const handleDayScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const dayIndex = Math.round(scrollY / 44);
    const maxDays = getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth());
    const clampedDay = Math.max(1, Math.min(dayIndex + 1, maxDays));
    updateDate(tempDate.getFullYear(), tempDate.getMonth(), clampedDay);
  };

  const handleYearScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const yearIndex = Math.round(scrollY / 44);
    const clampedYearIndex = Math.max(0, Math.min(yearIndex, years.length - 1));
    const selectedYear = years[clampedYearIndex];
    updateDate(selectedYear, tempDate.getMonth(), tempDate.getDate());
  };

  // Real-time scroll handlers for smoother updates
  const handleMonthScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const monthIndex = Math.round(scrollY / 44);
    const clampedIndex = Math.max(0, Math.min(monthIndex, 11));
    if (clampedIndex !== tempDate.getMonth()) {
      updateDate(tempDate.getFullYear(), clampedIndex, tempDate.getDate());
    }
  };

  const handleDayScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const dayIndex = Math.round(scrollY / 44);
    const maxDays = getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth());
    const clampedDay = Math.max(1, Math.min(dayIndex + 1, maxDays));
    if (clampedDay !== tempDate.getDate()) {
      updateDate(tempDate.getFullYear(), tempDate.getMonth(), clampedDay);
    }
  };

  const handleYearScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const yearIndex = Math.round(scrollY / 44);
    const clampedYearIndex = Math.max(0, Math.min(yearIndex, years.length - 1));
    const selectedYear = years[clampedYearIndex];
    if (selectedYear !== tempDate.getFullYear()) {
      updateDate(selectedYear, tempDate.getMonth(), tempDate.getDate());
    }
  };

  const WheelItem = ({ value, isSelected, onPress }: { value: string | number; isSelected: boolean; onPress: () => void }) => (
    <TouchableOpacity
      style={[styles.wheelItem, isSelected && styles.wheelItemSelected]}
      onPress={onPress}
      activeOpacity={0.7}
    >
      <Text style={[styles.wheelItemText, isSelected && styles.wheelItemTextSelected]} allowFontScaling={false}>
        {value}
      </Text>
    </TouchableOpacity>
  );

  const styles = StyleSheet.create({
    container: {
      marginBottom: 16,
    },
    inputWrapper: {
      position: 'relative',
    },
    floatingLabel: {
      position: 'absolute',
      top: -8,
      left: 12,
      backgroundColor: theme.colors.background,
      paddingHorizontal: 4,
      fontSize: 12,
      fontWeight: '600',
      color: theme.colors.text,
      zIndex: 1,
    },
    dateButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 12,
      paddingVertical: 8,
      backgroundColor: theme.colors.surface,
      borderRadius: 12,
      borderWidth: 2,
      borderColor: theme.colors.border,
      minHeight: 40,
    },
    dateText: {
      fontSize: 14,
      color: theme.colors.text,
      fontWeight: '600',
    },
    placeholderText: {
      fontSize: 14,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    icon: {
      marginLeft: 8,
    },
    modalOverlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.6)',
      justifyContent: 'center',
      alignItems: 'center',
    },
    modalContainer: {
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
      width: Dimensions.get('window').width * 0.85,
      maxWidth: 360,
      maxHeight: '60%',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 10,
      },
      shadowOpacity: 0.3,
      shadowRadius: 25,
      elevation: 25,
    },
    modalHeader: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderTopLeftRadius: 20,
      borderTopRightRadius: 20,
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    closeButton: {
      width: 36,
      height: 36,
      borderRadius: 18,
      borderTopLeftRadius: 18,
      borderTopRightRadius: 18,
      borderBottomLeftRadius: 18,
      borderBottomRightRadius: 18,
      backgroundColor: '#F1F3F4',
      alignItems: 'center',
      justifyContent: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 1,
      },
      shadowOpacity: 0.1,
      shadowRadius: 2,
      elevation: 2,
    },
    modalTitle: {
      fontSize: 16,
      fontWeight: '700',
      color: '#1A1A1A',
      letterSpacing: 0.5,
    },
    placeholder: {
      width: 32,
    },
    selectedDateContainer: {
      padding: 16,
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    selectedDateText: {
      fontSize: 14,
      fontWeight: '700',
      color: '#007AFF',
      textAlign: 'center',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 122, 255, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 2,
    },
    wheelContainer: {
      flexDirection: 'row',
      height: 160,
      backgroundColor: '#FFFFFF',
      position: 'relative',
    },
    wheelColumn: {
      flex: 1,
      justifyContent: 'center',
      position: 'relative',
    },
    wheelItem: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginVertical: 0,
    },
    wheelItemSelected: {
      backgroundColor: 'transparent',
    },
    wheelItemText: {
      fontSize: 12,
      color: '#999999',
      fontWeight: '400',
    },
    wheelItemTextSelected: {
      fontSize: 14,
      color: '#000000',
      fontWeight: '700',
    },
    selectionIndicator: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      height: 44,
      backgroundColor: 'rgba(0, 122, 255, 0.1)',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: 'rgba(0, 122, 255, 0.3)',
      zIndex: 1,
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 20,
      backgroundColor: '#F8F8F8',
      borderTopWidth: 1,
      borderTopColor: '#E5E5E5',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    button: {
      paddingHorizontal: 24,
      paddingVertical: 12,
      borderRadius: 12,
      borderTopLeftRadius: 12,
      borderTopRightRadius: 12,
      borderBottomLeftRadius: 12,
      borderBottomRightRadius: 12,
      minWidth: 90,
      alignItems: 'center',
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.1,
      shadowRadius: 4,
      elevation: 3,
    },
    todayButton: {
      backgroundColor: '#F8F9FA',
      borderWidth: 2,
      borderColor: '#007AFF',
    },
    doneButton: {
      backgroundColor: '#007AFF',
      shadowColor: '#007AFF',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.3,
      shadowRadius: 8,
      elevation: 6,
    },
    todayButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#007AFF',
      letterSpacing: 0.3,
    },
    doneButtonText: {
      fontSize: 13,
      fontWeight: '800',
      color: '#FFFFFF',
      letterSpacing: 0.5,
      textShadowColor: 'rgba(0, 0, 0, 0.1)',
      textShadowOffset: { width: 0, height: 1 },
      textShadowRadius: 1,
    },
  });

  return (
    <View style={styles.container}>
      <View style={styles.inputWrapper}>
        {label && (
          <Text style={styles.floatingLabel} allowFontScaling={false}>
            {label}
          </Text>
        )}
        
        <TouchableOpacity
          style={styles.dateButton}
        onPress={() => {
          if (!disabled) {
            setTempDate(selectedDate);
            setShowDatePicker(true);
            
            // Scroll to current date position after modal opens
            setTimeout(() => {
              const monthIndex = selectedDate.getMonth();
              const day = selectedDate.getDate();
              const year = selectedDate.getFullYear();
              const yearIndex = years.indexOf(year);
              
              // Scroll to current positions
              monthScrollRef.current?.scrollTo({ y: monthIndex * 44, animated: false });
              dayScrollRef.current?.scrollTo({ y: (day - 1) * 44, animated: false });
              yearScrollRef.current?.scrollTo({ y: yearIndex * 44, animated: false });
            }, 100);
          }
        }}
        activeOpacity={0.7}
        disabled={disabled}
      >
        <Text
          style={selectedDate ? styles.dateText : styles.placeholderText}
          allowFontScaling={false}
        >
          {selectedDate ? formatInputDate(selectedDate) : placeholder}
        </Text>
        <Ionicons
          name="calendar-outline"
          size={20}
          color={theme.colors.textSecondary}
          style={styles.icon}
        />
      </TouchableOpacity>
      </View>

      <Modal
        visible={showDatePicker}
        transparent={true}
        animationType="fade"
        onRequestClose={handleCancel}
        presentationStyle="overFullScreen"
      >
        <TouchableOpacity 
          style={styles.modalOverlay}
          activeOpacity={1}
          onPress={handleCancel}
        >
          <TouchableOpacity 
            style={styles.modalContainer}
            activeOpacity={1}
            onPress={(e) => e.stopPropagation()}
          >
            <View style={styles.modalHeader}>
              <TouchableOpacity 
                style={styles.closeButton}
                onPress={handleCancel}
                activeOpacity={0.7}
              >
                <Ionicons name="close" size={20} color="#666666" />
              </TouchableOpacity>
              <Text style={styles.modalTitle} allowFontScaling={false}>
                Select Date
              </Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.selectedDateContainer}>
              <Text style={styles.selectedDateText} allowFontScaling={false}>
                {formatDate(tempDate)}
              </Text>
            </View>
            
            <View style={styles.wheelContainer}>
              {/* Selection Indicator */}
              <View style={styles.selectionIndicator} />
              
              {/* Month Wheel */}
              <View style={styles.wheelColumn}>
                <ScrollView
                  ref={monthScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                  snapToInterval={44}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMonthScroll}
                  onScrollEndDrag={handleMonthScroll}
                  onScroll={handleMonthScrollRealTime}
                >
                  {months.map((month, index) => (
                    <WheelItem
                      key={index}
                      value={month}
                      isSelected={index === tempDate.getMonth()}
                      onPress={() => updateDate(tempDate.getFullYear(), index, tempDate.getDate())}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Day Wheel */}
              <View style={styles.wheelColumn}>
                <ScrollView
                  ref={dayScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                  snapToInterval={44}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleDayScroll}
                  onScrollEndDrag={handleDayScroll}
                  onScroll={handleDayScrollRealTime}
                >
                  {Array.from({ length: getDaysInMonth(tempDate.getFullYear(), tempDate.getMonth()) }, (_, i) => i + 1).map((day) => (
                    <WheelItem
                      key={day}
                      value={day}
                      isSelected={day === tempDate.getDate()}
                      onPress={() => updateDate(tempDate.getFullYear(), tempDate.getMonth(), day)}
                    />
                  ))}
                </ScrollView>
              </View>

              {/* Year Wheel */}
              <View style={styles.wheelColumn}>
                <ScrollView
                  ref={yearScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                  snapToInterval={44}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleYearScroll}
                  onScrollEndDrag={handleYearScroll}
                  onScroll={handleYearScrollRealTime}
                >
                  {years.map((year) => (
                    <WheelItem
                      key={year}
                      value={year}
                      isSelected={year === tempDate.getFullYear()}
                      onPress={() => updateDate(year, tempDate.getMonth(), tempDate.getDate())}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>
            
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.todayButton]}
                onPress={handleToday}
              >
                <Text style={styles.todayButtonText} allowFontScaling={false}>
                  TODAY
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.doneButton]}
                onPress={handleDone}
              >
                <Text style={styles.doneButtonText} allowFontScaling={false}>
                  DONE
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default WheelDatePicker;
