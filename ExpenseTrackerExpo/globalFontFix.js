// Global font scaling fix - must be imported first
import { Text, TextInput, PixelRatio, Platform } from 'react-native';

// CRITICAL: Override PixelRatio.getFontScale() FIRST before anything else
// This prevents React Navigation and other components from using scaled fonts
if (Platform.OS === 'android' && PixelRatio.getFontScale) {
  const originalGetFontScale = PixelRatio.getFontScale.bind(PixelRatio);
  PixelRatio.getFontScale = () => {
    // Always return 1.0 to completely disable font scaling
    return 1.0;
  };
  console.log('🔧 PixelRatio.getFontScale() overridden to return 1.0');
}

// More aggressive approach to disable font scaling
const originalText = Text;
const originalTextInput = TextInput;

// Override Text component defaultProps
Text.defaultProps = {
  ...Text.defaultProps,
  allowFontScaling: false,
};

// Override TextInput component defaultProps
TextInput.defaultProps = {
  ...TextInput.defaultProps,
  allowFontScaling: false,
};

// Monkey patch the render method to force allowFontScaling={false}
const originalTextRender = Text.render;
if (originalTextRender) {
  Text.render = function(props, ref) {
    // Force allowFontScaling to false even if explicitly set to true
    return originalTextRender.call(this, { ...props, allowFontScaling: false }, ref);
  };
}

const originalTextInputRender = TextInput.render;
if (originalTextInputRender) {
  TextInput.render = function(props, ref) {
    // Force allowFontScaling to false even if explicitly set to true
    return originalTextInputRender.call(this, { ...props, allowFontScaling: false }, ref);
  };
}

// Also override createElement if possible (for React 17+)
if (Text.createElement) {
  const originalTextCreateElement = Text.createElement;
  Text.createElement = function(type, props, ...children) {
    if (props) {
      props.allowFontScaling = false;
    }
    return originalTextCreateElement.call(this, type, props, ...children);
  };
}

console.log('🔧 Global font scaling disabled with aggressive approach');
