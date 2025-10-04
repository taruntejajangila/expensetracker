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
  const [tempHour, setTempHour] = useState(9);
  const [tempMinute, setTempMinute] = useState(0);
  
  // Refs for scroll views
  const hourScrollRef = useRef<ScrollView>(null);
  const minuteScrollRef = useRef<ScrollView>(null);

  // Generate arrays for wheel picker
  const hours = Array.from({ length: 24 }, (_, i) => i);
  const minutes = Array.from({ length: 60 }, (_, i) => i);

  useEffect(() => {
    if (selectedTime) {
      const [hour, minute] = selectedTime.split(':').map(Number);
      setTempHour(hour);
      setTempMinute(minute);
    }
  }, [selectedTime]);

  useEffect(() => {
    if (showTimePicker) {
      // Initialize scroll position when modal opens
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: tempHour * 44, animated: false });
        minuteScrollRef.current?.scrollTo({ y: tempMinute * 44, animated: false });
      }, 150);
    }
  }, [showTimePicker]);

  useEffect(() => {
    if (showTimePicker) {
      // Update scroll position when temp values change
      setTimeout(() => {
        hourScrollRef.current?.scrollTo({ y: tempHour * 44, animated: true });
        minuteScrollRef.current?.scrollTo({ y: tempMinute * 44, animated: true });
      }, 50);
    }
  }, [tempHour, tempMinute, showTimePicker]);

  const formatTime = (hour: number, minute: number) => {
    const period = hour >= 12 ? 'PM' : 'AM';
    const displayHour = hour === 0 ? 12 : hour > 12 ? hour - 12 : hour;
    return `${displayHour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')} ${period}`;
  };

  const formatInputTime = (hour: number, minute: number) => {
    return `${hour.toString().padStart(2, '0')}:${minute.toString().padStart(2, '0')}`;
  };

  const handleNow = () => {
    const now = new Date();
    const hour = now.getHours();
    const minute = now.getMinutes();
    setTempHour(hour);
    setTempMinute(minute);
    
    // Scroll to current time position
    hourScrollRef.current?.scrollTo({ y: hour * 44, animated: true });
    minuteScrollRef.current?.scrollTo({ y: minute * 44, animated: true });
  };

  const handleHourScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const hourIndex = Math.round(scrollY / 44);
    const clampedHour = Math.max(0, Math.min(hourIndex, 23));
    setTempHour(clampedHour);
  };

  const handleMinuteScroll = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const minuteIndex = Math.round(scrollY / 44);
    const clampedMinute = Math.max(0, Math.min(minuteIndex, 59));
    setTempMinute(clampedMinute);
  };

  // Real-time scroll handlers for smoother updates
  const handleHourScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const hourIndex = Math.round(scrollY / 44);
    const clampedHour = Math.max(0, Math.min(hourIndex, 23));
    if (clampedHour !== tempHour) {
      setTempHour(clampedHour);
    }
  };

  const handleMinuteScrollRealTime = (event: any) => {
    const scrollY = event.nativeEvent.contentOffset.y;
    const minuteIndex = Math.round(scrollY / 44);
    const clampedMinute = Math.max(0, Math.min(minuteIndex, 59));
    if (clampedMinute !== tempMinute) {
      setTempMinute(clampedMinute);
    }
  };

  const handleDone = () => {
    const timeString = formatInputTime(tempHour, tempMinute);
    onTimeChange(timeString);
    setShowTimePicker(false);
  };

  const handleCancel = () => {
    // Reset to original time
    if (selectedTime) {
      const [hour, minute] = selectedTime.split(':').map(Number);
      setTempHour(hour);
      setTempMinute(minute);
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

  const renderWheel = (
    items: number[],
    selectedValue: number,
    onValueChange: (value: number) => void,
    scrollRef: React.RefObject<ScrollView>,
    label: string
  ) => {
    return (
      <View style={styles.wheelColumn}>
        <Text style={styles.wheelLabel} allowFontScaling={false}>{label}</Text>
        <View style={styles.wheelContainer}>
          <ScrollView
            ref={scrollRef}
            showsVerticalScrollIndicator={false}
            snapToInterval={44}
            decelerationRate="fast"
            onMomentumScrollEnd={(event) => {
              const index = Math.round(event.nativeEvent.contentOffset.y / 44);
              onValueChange(items[index]);
            }}
            contentContainerStyle={styles.wheelContent}
          >
            {items.map((item, index) => (
              <View key={item} style={styles.wheelItem}>
                <Text
                  style={[
                    styles.wheelItemText,
                    {
                      color: item === selectedValue ? theme.colors.text : theme.colors.textSecondary,
                      fontSize: item === selectedValue ? 18 : 16,
                      fontWeight: item === selectedValue ? '700' : '500',
                    },
                  ]}
                  allowFontScaling={false}
                >
                  {item.toString().padStart(2, '0')}
                </Text>
              </View>
            ))}
          </ScrollView>
        </View>
      </View>
    );
  };

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
      backgroundColor: theme.colors.surface,
      borderWidth: 2,
      borderColor: theme.colors.border,
      borderRadius: 12,
      paddingHorizontal: 16,
      paddingVertical: 12,
      height: 56,
    },
    timeButtonText: {
      fontSize: 16,
      fontWeight: '600',
      color: theme.colors.text,
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
      padding: 16,
      alignItems: 'center',
      backgroundColor: '#F8F9FA',
      borderBottomWidth: 1,
      borderBottomColor: '#E5E5E5',
    },
    selectedTimeText: {
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
      height: 200,
      backgroundColor: '#FFFFFF',
      position: 'relative',
      overflow: 'hidden',
    },
    wheelColumn: {
      flex: 1,
      height: 200,
      position: 'relative',
      overflow: 'hidden',
    },
    wheelItem: {
      height: 44,
      justifyContent: 'center',
      alignItems: 'center',
      paddingHorizontal: 12,
      marginVertical: 0,
      borderRadius: 8,
    },
    wheelItemSelected: {
      backgroundColor: 'rgba(0, 122, 255, 0.05)',
    },
    wheelItemText: {
      fontSize: 12,
      color: '#999999',
      fontWeight: '400',
      textAlign: 'center',
    },
    wheelItemTextSelected: {
      fontSize: 16,
      color: '#000000',
      fontWeight: '700',
      textAlign: 'center',
    },
    selectionIndicator: {
      position: 'absolute',
      top: 60,
      left: 0,
      right: 0,
      height: 44,
      backgroundColor: 'rgba(0, 122, 255, 0.08)',
      borderTopWidth: 2,
      borderBottomWidth: 2,
      borderColor: 'rgba(0, 122, 255, 0.4)',
      zIndex: 1,
      borderRadius: 8,
      marginHorizontal: 8,
    },
    timeSeparator: {
      position: 'absolute',
      top: '50%',
      left: '50%',
      transform: [{ translateX: -10 }, { translateY: -10 }],
      fontSize: 20,
      fontWeight: '700',
      color: '#000000',
      zIndex: 2,
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
    nowButton: {
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
    nowButtonText: {
      fontSize: 13,
      fontWeight: '700',
      color: '#007AFF',
    },
    doneButtonText: {
      fontSize: 13,
      fontWeight: '700',
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
          <Text style={styles.timeButtonText} allowFontScaling={false}>
            {selectedTime ? formatTime(tempHour, tempMinute) : placeholder}
          </Text>
          <Ionicons
            name="time-outline"
            size={20}
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
                {formatTime(tempHour, tempMinute)}
              </Text>
            </View>

            <View style={styles.wheelContainer}>
              <View style={styles.selectionIndicator} />
              <Text style={styles.timeSeparator} allowFontScaling={false}>:</Text>
              
              <View style={styles.wheelColumn}>
                <ScrollView
                  ref={hourScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                  snapToInterval={44}
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
                <ScrollView
                  ref={minuteScrollRef}
                  showsVerticalScrollIndicator={false}
                  contentContainerStyle={{ paddingVertical: 60 }}
                  snapToInterval={44}
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
