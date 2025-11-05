import React, { useState, useRef, useEffect } from 'react';
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

interface WheelTimePickerProps {
  selectedTime: string; // Format: "HH:MM" (e.g., "09:30")
  onTimeChange: (time: string) => void;
  placeholder?: string;
  label?: string;
  disabled?: boolean;
}

const WheelTimePicker: React.FC<WheelTimePickerProps> = ({
  selectedTime,
  onTimeChange,
  placeholder = 'Select Time',
  label,
  disabled = false,
}) => {
  const { theme } = useTheme();
  const [showTimePicker, setShowTimePicker] = useState(false);
  const [tempHour, setTempHour] = useState(9); // 12-hour format (1-12)
  const [tempMinute, setTempMinute] = useState(0);
  const [tempPeriod, setTempPeriod] = useState<'AM' | 'PM'>('AM');
  
  // Refs for scroll views
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);
  const periodScrollRef = useRef<ScrollView>(null);

  // Generate arrays for wheel picker (12-hour format)
  const hours = Array.from({ length: 12 }, (_, i) => i + 1); // 1-12
  const minutes = Array.from({ length: 60 }, (_, i) => i);
  const periods: ('AM' | 'PM')[] = ['AM', 'PM'];

  // Convert 24-hour format to 12-hour format
  const convert24To12 = (hour24: number): { hour12: number; period: 'AM' | 'PM' } => {
    if (hour24 === 0) return { hour12: 12, period: 'AM' };
    if (hour24 < 12) return { hour12: hour24, period: 'AM' };
    if (hour24 === 12) return { hour12: 12, period: 'PM' };
    return { hour12: hour24 - 12, period: 'PM' };
  };

  // Convert 12-hour format to 24-hour format
  const convert12To24 = (hour12: number, period: 'AM' | 'PM'): number => {
    if (period === 'AM') {
      return hour12 === 12 ? 0 : hour12;
    } else {
      return hour12 === 12 ? 12 : hour12 + 12;
    }
  };

  useEffect(() => {
    if (selectedTime) {
      const [hour24, minute] = selectedTime.split(':').map(Number);
      const { hour12, period } = convert24To12(hour24);
      setTempHour(hour12);
      setTempMinute(minute);
      setTempPeriod(period);
    }
  }, [selectedTime]);

  useEffect(() => {
    if (showTimePicker) {
      // Initialize scroll position when modal opens
      // Selection indicator is at top: 110px, height: 50px (center at 135px)
      // Label area: ~30px, so from scrollView start: 135px - 30px = 105px
      // We want item center at 105px: paddingTop (80px) + scrollY + itemHeight/2 (25px) = 105px
      // So scrollY should be: 105 - 80 - 25 = 0 for first item
      // For item at index i: scrollY = i * 50
      setTimeout(() => {
        const hourIndex = hours.indexOf(tempHour);
        const periodIndex = periods.indexOf(tempPeriod);
        hourScrollRef.current?.scrollTo({ y: hourIndex * 50, animated: false });
        minuteScrollRef.current?.scrollTo({ y: tempMinute * 50, animated: false });
        periodScrollRef.current?.scrollTo({ y: periodIndex * 50, animated: false });
      }, 150);
    }
  }, [showTimePicker]);

  useEffect(() => {
    if (showTimePicker) {
      // Update scroll position when temp values change
      setTimeout(() => {
        const hourIndex = hours.indexOf(tempHour);
        const periodIndex = periods.indexOf(tempPeriod);
        hourScrollRef.current?.scrollTo({ y: hourIndex * 50, animated: true });
        minuteScrollRef.current?.scrollTo({ y: tempMinute * 50, animated: true });
        periodScrollRef.current?.scrollTo({ y: periodIndex * 50, animated: true });
      }, 50);
    }
  }, [tempHour, tempMinute, tempPeriod, showTimePicker]);

  const formatTime = (hour12: number, minute: number, period: 'AM' | 'PM') => {
    return `${hour12.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatInputTime = (hour12: number, minute: number, period: 'AM' | 'PM') => {
    const hour24 = convert12To24(hour12, period);
    return `${hour24.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleNow = () => {
    const now = new Date();
    const hour24 = now.getHours();
    const minute = now.getMinutes();
    const { hour12, period } = convert24To12(hour24);
    setTempHour(hour12);
    setTempMinute(minute);
    setTempPeriod(period);
    
    // Scroll to current time position
    const hourIndex = hours.indexOf(hour12);
    const periodIndex = periods.indexOf(period);
    hourScrollRef.current?.scrollTo({ y: hourIndex * 50, animated: true });
    minuteScrollRef.current?.scrollTo({ y: minute * 50, animated: true });
    periodScrollRef.current?.scrollTo({ y: periodIndex * 50, animated: true });
  };

  const handleHourScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const hourIndex = Math.round(scrollY / 50);
    const clampedHourIndex = Math.max(0, Math.min(hourIndex, 11));
    setTempHour(hours[clampedHourIndex]);
  };

  const handlePeriodScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const periodIndex = Math.round(scrollY / 50);
    const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, 1));
    setTempPeriod(periods[clampedPeriodIndex]);
  };

  const handleMinuteScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const minuteIndex = Math.round(scrollY / 50);
    const clampedMinute = Math.max(0, Math.min(minuteIndex, 59));
    setTempMinute(clampedMinute);
  };

  // Real-time scroll handlers for smoother updates
  const handleHourScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const hourIndex = Math.round(scrollY / 50);
    const clampedHourIndex = Math.max(0, Math.min(hourIndex, 11));
    const newHour = hours[clampedHourIndex];
    if (newHour !== tempHour) {
      setTempHour(newHour);
    }
  };

  const handlePeriodScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const periodIndex = Math.round(scrollY / 50);
    const clampedPeriodIndex = Math.max(0, Math.min(periodIndex, 1));
    const newPeriod = periods[clampedPeriodIndex];
    if (newPeriod !== tempPeriod) {
      setTempPeriod(newPeriod);
    }
  };

  const handleMinuteScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const minuteIndex = Math.round(scrollY / 50);
    const clampedMinute = Math.max(0, Math.min(minuteIndex, 59));
    if (clampedMinute !== tempMinute) {
      setTempMinute(clampedMinute);
    }
  };

  const handleDone = () => {
    const timeString = formatInputTime(tempHour, tempMinute, tempPeriod);
    onTimeChange(timeString);
    setShowTimePicker(false);
  };

  const handleCancel = () => {
    // Reset to original time
    if (selectedTime) {
      const [hour24, minute] = selectedTime.split(':').map(Number);
      const { hour12, period } = convert24To12(hour24);
      setTempHour(hour12);
      setTempMinute(minute);
      setTempPeriod(period);
    }
    setShowTimePicker(false);
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
      flex: 1,
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
    timeButton: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'space-between',
      paddingHorizontal: 16,
      paddingVertical: 12,
      backgroundColor: '#FFFFFF',
      borderRadius: 12,
      borderWidth: 2,
      borderColor: '#E9ECEF',
      minHeight: 48,
    },
    timeButtonText: {
      fontSize: 12,
      color: theme.colors.text,
      fontWeight: '600',
    },
    placeholderText: {
      fontSize: 12,
      color: theme.colors.textSecondary,
      fontWeight: '600',
    },
    timeIcon: {
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
    selectedTimeContainer: {
      padding: 20,
      alignItems: 'center',
      backgroundColor: '#F2F2F7',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5EA',
    },
    selectedTimeText: {
      fontSize: 24,
      fontWeight: '600',
      color: '#007AFF',
      textAlign: 'center',
      letterSpacing: 1,
    },
    wheelContainer: {
      flexDirection: 'row',
      height: 240,
      backgroundColor: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden',
      paddingHorizontal: 8,
    },
    wheelColumn: {
      flex: 1,
      height: 240,
      position: 'relative',
      overflow: 'hidden',
      alignItems: 'center',
    },
    wheelLabel: {
      fontSize: 10,
      fontWeight: '700',
      color: '#8E8E93',
      textAlign: 'center',
      marginBottom: 4,
      marginTop: 8,
      textTransform: 'uppercase',
      letterSpacing: 1.2,
      height: 18,
    },
    // Selection indicator: top 110px, height 50px (spans 110-160px)
    // Center of indicator: 135px from container top
    // Label area: ~30px, so center is 105px from scrollView start
    // ScrollView paddingTop: 80px, so item center at scrollY=0 is at 80+25=105px ✓
    wheelItem: {
      height: 50,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 8,
      marginVertical: 0,
      borderRadius: 10,
      width: '100%',
    },
    wheelItemSelected: {
      backgroundColor: 'rgba(0, 122, 255, 0.06)',
    },
    wheelItemText: {
      fontSize: 20,
      color: '#C7C7CC',
      fontWeight: '400',
      textAlign: 'center',
    },
    wheelItemTextSelected: {
      fontSize: 20,
      color: '#007AFF',
      fontWeight: '700',
      textAlign: 'center',
    },
    selectionIndicator: {
      position: 'absolute',
      top: 110, // Centered: label area (30px) + (210px - 50px) / 2 = 110px
      left: 8,
      right: 8,
      height: 50,
      backgroundColor: 'transparent',
      borderTopWidth: 1,
      borderBottomWidth: 1,
      borderColor: '#E5E5EA',
      zIndex: 1,
      borderRadius: 0,
    },
    timeSeparator: {
      position: 'absolute',
      top: 110, // Match selectionIndicator top
      left: '33.3333%', // boundary between Hour (1/3) and Minute (2/3)
      marginLeft: -2, // compensate container padding (8) and half width (10)
      width: 20,
      textAlign: 'center',
      height: 50, // Match selectionIndicator height
      lineHeight: 50, // Vertically center the ':' between lines
      fontSize: 24,
      fontWeight: '600',
      color: '#007AFF',
      zIndex: 10,
      pointerEvents: 'none',
    },
    buttonContainer: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingHorizontal: 20,
      paddingVertical: 16,
      backgroundColor: '#F2F2F7',
      borderTopWidth: 1,
      borderTopColor: '#E5E5EA',
      borderBottomLeftRadius: 20,
      borderBottomRightRadius: 20,
    },
    button: {
      paddingHorizontal: 32,
      paddingVertical: 14,
      borderRadius: 12,
      minWidth: 100,
      alignItems: 'center',
    },
    nowButton: {
      backgroundColor: '#FFFFFF',
      borderWidth: 1.5,
      borderColor: '#007AFF',
    },
    doneButton: {
      backgroundColor: '#007AFF',
    },
    nowButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#007AFF',
    },
    doneButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: '#FFFFFF',
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
          style={[styles.timeButton, disabled && { opacity: 0.5 }]}
          onPress={() => !disabled && setShowTimePicker(true)}
          activeOpacity={0.7}
        >
          <Text style={selectedTime ? styles.timeButtonText : styles.placeholderText} allowFontScaling={false}>
            {selectedTime ? formatTime(tempHour, tempMinute, tempPeriod) : placeholder}
          </Text>
          <Ionicons
            name="time-outline"
            size={18}
            color={theme.colors.textSecondary}
            style={styles.timeIcon}
          />
        </TouchableOpacity>
      </View>

      <Modal
        visible={showTimePicker}
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
                Select Time
              </Text>
              <View style={styles.placeholder} />
            </View>
            
            <View style={styles.selectedTimeContainer}>
              <Text style={styles.selectedTimeText} allowFontScaling={false}>
                {formatTime(tempHour, tempMinute, tempPeriod)}
              </Text>
            </View>

            <View style={styles.wheelContainer}>
              <View style={styles.selectionIndicator} />
              <Text style={styles.timeSeparator} allowFontScaling={false}>:</Text>
              
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel} allowFontScaling={false}>HOUR</Text>
                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 80, paddingBottom: 110 }}
                  snapToInterval={50}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleHourScroll}
                  onScrollEndDrag={handleHourScroll}
                  onScroll={handleHourScrollRealTime}
                  scrollEventThrottle={16}
                  bounces={false}
                  overScrollMode="never"
                >
                  {hours.map((hour) => (
                    <WheelItem
                      key={hour}
                      value={hour.toString().padStart(2, '0')}
                      isSelected={hour === tempHour}
                      onPress={() => setTempHour(hour)}
                    />
                  ))}
                </ScrollView>
              </View>
              
              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel} allowFontScaling={false}>MIN</Text>
                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 80, paddingBottom: 110 }}
                  snapToInterval={50}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handleMinuteScroll}
                  onScrollEndDrag={handleMinuteScroll}
                  onScroll={handleMinuteScrollRealTime}
                  scrollEventThrottle={16}
                  bounces={false}
                  overScrollMode="never"
                >
                  {minutes.map((minute) => (
                    <WheelItem
                      key={minute}
                      value={minute.toString().padStart(2, '0')}
                      isSelected={minute === tempMinute}
                      onPress={() => setTempMinute(minute)}
                    />
                  ))}
                </ScrollView>
              </View>

              <View style={styles.wheelColumn}>
                <Text style={styles.wheelLabel} allowFontScaling={false}>AM/PM</Text>
                <ScrollView
                  ref={periodScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingTop: 80, paddingBottom: 110 }}
                  snapToInterval={50}
                  decelerationRate="fast"
                  onMomentumScrollEnd={handlePeriodScroll}
                  onScrollEndDrag={handlePeriodScroll}
                  onScroll={handlePeriodScrollRealTime}
                  scrollEventThrottle={16}
                  bounces={false}
                  overScrollMode="never"
                >
                  {periods.map((period) => (
                    <WheelItem
                      key={period}
                      value={period}
                      isSelected={period === tempPeriod}
                      onPress={() => setTempPeriod(period)}
                    />
                  ))}
                </ScrollView>
              </View>
            </View>

            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.nowButton]}
                onPress={handleNow}
                activeOpacity={0.7}
              >
                <Text style={styles.nowButtonText} allowFontScaling={false}>
                  Now
                </Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[styles.button, styles.doneButton]}
                onPress={handleDone}
                activeOpacity={0.7}
              >
                <Text style={styles.doneButtonText} allowFontScaling={false}>
                  Done
                </Text>
              </TouchableOpacity>
            </View>
          </TouchableOpacity>
        </TouchableOpacity>
      </Modal>
    </View>
  );
};

export default WheelTimePicker;