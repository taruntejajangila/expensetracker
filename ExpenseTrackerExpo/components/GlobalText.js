import React from 'react';
import { Text as RNText, TextInput as RNTextInput } from 'react-native';

// Create custom Text component with font scaling disabled
const Text = (props) => {
  return <RNText {...props} allowFontScaling={false} />;
};

// Create custom TextInput component with font scaling disabled
const TextInput = (props) => {
  return <RNTextInput {...props} allowFontScaling={false} />;
};

// Override the default Text and TextInput components
RNText.defaultProps = RNText.defaultProps || {};
RNText.defaultProps.allowFontScaling = false;

RNTextInput.defaultProps = RNTextInput.defaultProps || {};
RNTextInput.defaultProps.allowFontScaling = false;

export { Text, TextInput };
