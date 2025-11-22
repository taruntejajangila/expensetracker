# Files That Can Be Safely Deleted

## 🗑️ High Priority - Safe to Delete

### Installer/Executable Files (Should NOT be in repo)
- `postgresql-client.zip` - PostgreSQL client installer
- `postgresql-installer.exe` - PostgreSQL installer
- `postgresql-client/` - PostgreSQL client directory

### One-Time Scripts in backend-api/ (Already run, no longer needed)
- `add-column-migration.js`
- `button-reposition-summary.js`
- `card-borders-status.js`
- `card-height-optimization.js`
- `card-spacing-improvement-summary.js`
- `check-admin-users-table.js`
- `check-all-user-accounts.js`
- `check-bank-accounts-structure.js`
- `check-database.js`
- `check-default-accounts.js`
- `check-other-user-accounts.js`
- `check-sameera-accounts.js`
- `check-user-password.js`
- `check-users-simple.js`
- `compact-list-summary.js`
- `confirmation-modal-status.js`
- `confirmation-modal-summary.js`
- `corrected-width-summary.js`
- `create-admin-user-correct-table.js`
- `create-admin-user-railway.js`
- `create-custom-notifications-table-simple.js`
- `create-custom-notifications-table.js`
- `create-new-categories.js`
- `create-one-transaction-per-category.js`
- `create-user-transactions-fixed.js`
- `create-user-transactions.js`
- `custom-reminders-subtitle-summary.js`
- `debug-income-issue.js`
- `debug-transaction-update.js`
- `delete-all-categories-safe.js`
- `delete-all-categories.js`
- `final-typescript-fix.js`
- `fix-duplicate-categories.js`
- `fix-existing-dates.js`
- `fix-railway-constraint-now.js`
- `fix-railway-direct.js`
- `fix-railway-loan-type.js`
- `fix-transaction-date.js`
- `full-text-button-summary.js`
- `migrate-transaction-date.js`
- `modal-investigation-summary.js`
- `modern-design-summary.js`
- `paid-status-implementation-summary.js`
- `populate-sample-data.js`
- `rate-limiting-fixes-summary.js`
- `remove-left-colors-summary.js`
- `reset-user-financial-data-v2.js`
- `reset-user-financial-data.js`
- `reverted-design-summary.js`
- `run-migration.js`
- `run-migrations.js`
- `section-cards-summary.js`
- `send-custom-notification.js`
- `send-demo-notification.js`
- `setup-banner-management.js`
- `setup-banners-minimal.js`
- `setup-database.js`
- `setup-support-tickets.js`
- `start-simple-server.js`
- `typescript-fix-summary.js`
- `ui-design-options.js`
- `ultra-compact-summary.js`

### Old SQL Migration Files (Replaced by TypeScript migrations)
- `backend-api/fix-railway-loan-constraint.sql`
- `backend-api/migrate-budgets.sql`
- `backend-api/migrate-notification-tokens.sql`
- `backend-api/create-admin.sql`
- `backend-api/migrations/create_otp_table.sql`
- `CREATE_ALL_TABLES.sql` (if migrations are working)

### Temporary JSON/Text Files
- `backend-api/custom-notification-data.json`
- `backend-api/simple-custom-notification.json`
- `backend-api/user-details-final.json`
- `backend-api/user-details-updated.json`
- `backend-api/user-details.json`
- `backend-api/duplicate-analysis.txt`

### Old Documentation Files (Outdated/Redundant)
- `2FACTOR_COMPLETION_CHECKLIST.md`
- `2FACTOR_INTEGRATION_GUIDE.md`
- `2FACTOR_SETUP_CHECKLIST.md`
- `2FACTOR_SETUP_STEP_BY_STEP.md`
- `2FACTOR_SMS_VS_VOICE_FIX.md`
- `AD_REVENUE_STRATEGY.md`
- `ADMIN_PANEL_RAILWAY_DEPLOYMENT.md`
- `ADMOB_SETUP_GUIDE.md`
- `ADMOB_SETUP.md`
- `API_ROUTES_TEST_REPORT.md`
- `BANNER_IMAGE_TESTING_GUIDE.md`
- `BANNER_VISIBILITY_FIX.md`
- `BUILD_APK_GUIDE.md`
- `BUILD_CHECK_ICONS.md`
- `BUILD_FAILURE_CHECKLIST.md`
- `CLOUD_DEPLOYMENT_DOCUMENTATION.md`
- `CLOUDINARY_SETUP_GUIDE.md`
- `COMPLETE_IP_CONFIGURATION_GUIDE.md`
- `CONFIGURATION_SETUP.md`
- `CREATE_ADMIN_USER_GUIDE.md`
- `DATABASE_FEATURES_TEST_REPORT.md`
- `DATABASE_SETUP_STATUS.md`
- `DATABASE_VOLUME_USAGE_ANALYSIS.md`
- `DELETE_NON_ADMIN_USERS.md`
- `DELETE_USER_GUIDE.md`
- `DELETE_USERS_POWERSHELL.md`
- `DELETE_USERS_RAILWAY_CLI.md`
- `DENSITY_SETUP_SUMMARY.md`
- `DEPLOY_QUICK_START.md`
- `deploy.md`
- `DLT_REGISTRATION_GUIDE.md`
- `DUAL_DEVELOPMENT_SETUP.md`
- `EARNINGS_EXPLAINED_INDIAN_MARKET.md`
- `EXPENSETRACKER_ICONS_CHECK.md`
- `GOAL_PAST_DATE_BUG.md`
- `HOW_REMINDERS_WORK.md`
- `HOW_TO_BUILD_DEVELOPMENT_ANDROID.md`
- `INSTALL_PSQL_WINDOWS.md`
- `IP_ADDRESS_CONFIGURATION_SIMPLE.md`
- `LOAN_FILES_COMPARISON.md`
- `LOAN_TYPE_COMPARISON.md`
- `LOAN_TYPE_MISMATCH_ANALYSIS.md`
- `MANUAL_TESTING_GUIDE.md`
- `MIGRATION_DEPLOYMENT_GUIDE.md`
- `MIGRATION_SYSTEM.md`
- `NATIVE_ADS_PLACEMENT_PLAN.md`
- `PASSWORDLESS_AUTH_IMPLEMENTATION.md`
- `PLAYSTORE_SCREENSHOTS_GUIDE.md`
- `PROJECT_OVERVIEW.md`
- `RAILWAY_AUTO_DEPLOY_FIX.md`
- `RAILWAY_DATABASE_TROUBLESHOOTING.md`
- `RAILWAY_DEPLOYMENT_FIX.md`
- `RAILWAY_DEPLOYMENT_GUIDE.md`
- `RAILWAY_KNOWN_ISSUES_FIX.md`
- `REALISTIC_MOCK_ADS.md`
- `REMINDER_REPEAT_BUG_FIX.md`
- `REMINDER_REPEAT_FEATURE.md`
- `SCALABILITY_AND_DATA_MANAGEMENT.md`
- `SECURITY_ENHANCEMENTS_COMPLETE.md`
- `SECURITY_FIXES_APPLIED.md`
- `SECURITY_INCIDENT_RESOLVED.md`
- `SECURITY_RECOMMENDATIONS.md`
- `SMART_INSIGHTS_DOCUMENTATION.md`
- `SMS_OTP_CODE_EXAMPLE.md`
- `SMS_OTP_EXPLANATION.md`
- `SMS_PROVIDER_COST_COMPARISON.md`
- `TESTING_ADS_IN_EXPO_GO.md`
- `TESTING-GUIDE.md`
- `VERIFY_REPEAT_OPTIONS.md`
- `VIEW_RAILWAY_LOGS.md`
- `WORKFLOW.md`
- `WSL2_SETUP_AND_LOCAL_APK_BUILD.md`

### ExpenseTrackerExpo Documentation (Review - Some might be useful)
- `ExpenseTrackerExpo/ADB_READY.md`
- `ExpenseTrackerExpo/AD_APPROACH_ANALYSIS.md`
- `ExpenseTrackerExpo/BUILD_CORRUPTION_FIX.md`
- `ExpenseTrackerExpo/BUILD_FIX_GRADLE_CACHE.md`
- `ExpenseTrackerExpo/BUILD_MEMORY_FIX.md`
- `ExpenseTrackerExpo/CAPTURE_CRASH_LOGS.md`
- `ExpenseTrackerExpo/CHECK_APK_LOGS.md`
- `ExpenseTrackerExpo/CREATE_PLAY_STORE_SCREENSHOTS.md`
- `ExpenseTrackerExpo/DEBUG_CRASH.md`
- `ExpenseTrackerExpo/EXPO_GO_AND_BUILD_WORKFLOW.md`
- `ExpenseTrackerExpo/FIREBASE_CONFIG_TEMPLATE.md`
- `ExpenseTrackerExpo/FIX_APK_CRASH.md`
- `ExpenseTrackerExpo/INSTALL_ADB.md`
- `ExpenseTrackerExpo/INSTALL_NEW_APK.md`
- `ExpenseTrackerExpo/INSTALL_WINDOWS_ADB.md`
- `ExpenseTrackerExpo/MISSING_CATEGORY_IMAGES.md`
- `ExpenseTrackerExpo/PROJECT_SUMMARY.md`
- `ExpenseTrackerExpo/QUICK_DEBUG_EXPO.md`
- `ExpenseTrackerExpo/REBUILD_INSTRUCTIONS.md`
- `ExpenseTrackerExpo/RUN_EXPO_DEBUG.md`
- `ExpenseTrackerExpo/SCREEN_PROGRESS_DOCUMENT.md`
- `ExpenseTrackerExpo/SCREENSHOT_CHECKLIST.md`
- `ExpenseTrackerExpo/TEST_ADB_SETUP.md`
- `ExpenseTrackerExpo/get-crash-logs.md`

### Shell Scripts (Review - Some might be useful for automation)
- `ExpenseTrackerExpo/build-apk.sh`
- `ExpenseTrackerExpo/build-and-install.sh`
- `ExpenseTrackerExpo/build-direct.sh`
- `ExpenseTrackerExpo/clear-and-rebuild.sh`
- `ExpenseTrackerExpo/connect-wireless-adb.sh`
- `ExpenseTrackerExpo/fix-build-corruption.sh`
- `ExpenseTrackerExpo/install-apk.sh`
- `ExpenseTrackerExpo/restart-build.sh`
- `ExpenseTrackerExpo/scripts/capture-screenshots.sh`
- `ExpenseTrackerExpo/scripts/offline-build.sh`
- `ExpenseTrackerExpo/scripts/setup-offline-build.sh`

### PowerShell Scripts
- `capture-crash-logs.ps1`

### HTML Files (Review)
- `ExpenseTrackerExpo/play-store-assets/feature-graphic-alternative.html` (if not using)
- `admin-panel/clear-admin-cache.html` (utility, might be useful)

### Build Output (Should be in .gitignore)
- `backend-api/dist/` - TypeScript build output (should be ignored)

### Log Files
- `backend-api/logs/combined.log`
- `backend-api/logs/error.log`

## ⚠️ Medium Priority - Review Before Deleting

### Keep These (Might be useful):
- `README.md` - Main project readme
- `ExpenseTrackerExpo/README.md` - Expo app readme
- `admin-panel/README.md` - Admin panel readme
- `backend-api/src/migrations/README.md` - Migration documentation
- `ExpenseTrackerExpo/MOCK_DATA_SETUP_GUIDE.md` - For screenshots
- `ExpenseTrackerExpo/SCREENSHOT_DATA_CHECKLIST.md` - For screenshots
- `ExpenseTrackerExpo/play-store-assets/DESIGN_SPECIFICATIONS.md` - For Play Store
- `ExpenseTrackerExpo/play-store-assets/FIGMA_GUIDE.md` - For Play Store
- `ExpenseTrackerExpo/API_CONFIGURATION_GUIDE.md` - Configuration guide
- `ExpenseTrackerExpo/ONBOARDING_IMPLEMENTATION.md` - Feature documentation
- `ExpenseTrackerExpo/PUSH_NOTIFICATIONS_SETUP.md` - Setup guide
- `ExpenseTrackerExpo/ERROR_LOGGING_SETUP.md` - Setup guide
- `ExpenseTrackerExpo/ADMOB_SETUP.md` - Setup guide
- `ExpenseTrackerExpo/PLAY_STORE_SCREENSHOTS_GUIDE.md` - For Play Store

### Scripts in backend-api/scripts/ (Keep - These are organized utilities)
- Keep all files in `backend-api/scripts/` - These are organized utility scripts

## 📝 Notes

1. **Backup before deleting**: Make sure you have a backup or commit current state
2. **Test after deletion**: Ensure the app still builds and runs
3. **Keep migration files**: Don't delete TypeScript migration files in `backend-api/src/migrations/`
4. **Keep active scripts**: Don't delete scripts that are actively used in CI/CD or deployment

## 🚀 Quick Delete Commands

```bash
# Delete installer files
rm postgresql-client.zip postgresql-installer.exe
rm -rf postgresql-client/

# Delete one-time scripts from backend-api root
cd backend-api
rm -f *-summary.js *-status.js check-*.js create-*.js debug-*.js fix-*.js migrate-*.js run-*.js setup-*.js send-*.js reset-*.js delete-*.js populate-*.js start-*.js

# Delete old SQL files
rm -f *.sql migrations/*.sql

# Delete temporary JSON/text files
rm -f *.json duplicate-analysis.txt

# Delete old documentation (be selective)
# Review the list above and delete what you don't need
```

