import React, { useState } from 'react';
import {
  Modal,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { useTheme } from '../context/ThemeContext';

interface LogoutVerificationModalProps {
  visible: boolean;
  onClose: () => void;
  onConfirm: () => void;
}

const LogoutVerificationModal: React.FC<LogoutVerificationModalProps> = ({
  visible,
  onClose,
  onConfirm,
}) => {
  const { theme } = useTheme();
  const [confirmationText, setConfirmationText] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  const handleConfirm = () => {
    if (confirmationText.trim() === 'LogOut') {
      setIsLoading(true);
      onConfirm();
    } else {
      Alert.alert(
        'Invalid Confirmation',
        'Please type "LogOut" exactly to confirm logout.',
        [{ text: 'OK' }]
      );
    }
  };

  const handleClose = () => {
    setConfirmationText('');
    setIsLoading(false);
    onClose();
  };

  const isConfirmEnabled = confirmationText.trim() === 'LogOut';

  return (
    <Modal
      visible={visible}
      transparent
      animationType="fade"
      onRequestClose={handleClose}
    >
      <KeyboardAvoidingView
        style={styles.overlay}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        <View style={styles.modalContainer}>
          <View style={[styles.modalContent, { backgroundColor: theme.colors.background }]}>
            {/* Header */}
            <View style={styles.header}>
              <View style={[styles.iconContainer, { backgroundColor: '#FF3B30' }]}>
                <Ionicons name="log-out-outline" size={24} color="#FFFFFF" />
              </View>
              <Text style={[styles.title, { color: theme.colors.text }]}>
                Confirm Logout
              </Text>
              <Text style={[styles.subtitle, { color: theme.colors.textSecondary }]}>
                This action will log you out of your account
              </Text>
            </View>

            {/* Verification Input */}
            <View style={styles.inputContainer}>
              <Text style={[styles.inputLabel, { color: theme.colors.text }]}>
                Type "LogOut" to confirm:
              </Text>
              <TextInput
                style={[
                  styles.textInput,
                  {
                    backgroundColor: theme.colors.surface,
                    borderColor: isConfirmEnabled ? '#34C759' : '#E0E0E0',
                    color: theme.colors.text,
                  },
                ]}
                value={confirmationText}
                onChangeText={setConfirmationText}
                placeholder="Enter LogOut"
                placeholderTextColor={theme.colors.textSecondary}
                autoCapitalize="none"
                autoCorrect={false}
                editable={!isLoading}
                returnKeyType="done"
                onSubmitEditing={handleConfirm}
              />
              {isConfirmEnabled && (
                <View style={styles.checkIcon}>
                  <Ionicons name="checkmark-circle" size={20} color="#34C759" />
                </View>
              )}
            </View>

            {/* Action Buttons */}
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                style={[styles.button, styles.cancelButton]}
                onPress={handleClose}
                disabled={isLoading}
              >
                <Text style={styles.cancelButtonText}>Cancel</Text>
              </TouchableOpacity>
              
              <TouchableOpacity
                style={[
                  styles.button,
                  styles.confirmButton,
                  {
                    backgroundColor: isConfirmEnabled ? '#FF3B30' : '#CCCCCC',
                  },
                ]}
                onPress={handleConfirm}
                disabled={!isConfirmEnabled || isLoading}
              >
                <Text style={styles.confirmButtonText}>
                  {isLoading ? 'Logging Out...' : 'Logout'}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </KeyboardAvoidingView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  modalContainer: {
    width: '90%',
    maxWidth: 400,
  },
  modalContent: {
    borderRadius: 16,
    padding: 24,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.25,
    shadowRadius: 8,
    elevation: 8,
  },
  header: {
    alignItems: 'center',
    marginBottom: 24,
  },
  iconContainer: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    marginBottom: 8,
    textAlign: 'center',
  },
  subtitle: {
    fontSize: 14,
    textAlign: 'center',
    lineHeight: 20,
  },
  inputContainer: {
    marginBottom: 24,
  },
  inputLabel: {
    fontSize: 14,
    fontWeight: '600',
    marginBottom: 8,
  },
  textInput: {
    borderWidth: 2,
    borderRadius: 8,
    paddingHorizontal: 16,
    paddingVertical: 12,
    fontSize: 16,
    fontWeight: '500',
  },
  checkIcon: {
    position: 'absolute',
    right: 12,
    top: 38,
  },
  buttonContainer: {
    flexDirection: 'row',
    gap: 12,
  },
  button: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 8,
    alignItems: 'center',
    justifyContent: 'center',
  },
  cancelButton: {
    backgroundColor: '#F0F0F0',
  },
  confirmButton: {
    // backgroundColor set dynamically
  },
  cancelButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#666666',
  },
  confirmButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
  },
});

export default LogoutVerificationModal;
