// Global font scaling fix - must be imported first
import { Text, TextInput } from 'react-native';

// More aggressive approach to disable font scaling
const originalText = Text;
const originalTextInput = TextInput;

// Override Text component
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: false,
};

// Override TextInput component  
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  allowFontScaling: false,
};

// Also try monkey patching the render method
const originalTextRender = Text.render;
if (originalTextRender) {
  Text.render = function(props, ref) {
    return originalTextRender.call(this, { ...props, allowFontScaling: false }, ref);
  };
}

const originalTextInputRender = TextInput.render;
if (originalTextInputRender) {
  TextInput.render = function(props, ref) {
    return originalTextInputRender.call(this, { ...props, allowFontScaling: false }, ref);
  };
}

console.log('🔧 Global font scaling disabled with aggressive approach');
