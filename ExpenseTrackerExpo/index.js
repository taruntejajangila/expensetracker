// Import font fix first - must be before any other imports
import './globalFontFix';

import { registerRootComponent } from 'expo';
import App from './App';

// Register the main component
registerRootComponent(App);