# 📸 Play Store Assets

This folder contains screenshots and assets for Google Play Store listing.

## 📁 Folder Structure

```
play-store-assets/
├── screenshots/
│   ├── phone/
│   │   ├── 01-home-screen.png
│   │   ├── 02-add-transaction.png
│   │   ├── 03-all-transactions.png
│   │   ├── 04-savings-goals.png
│   │   ├── 05-budget-planning.png
│   │   ├── 06-accounts.png
│   │   ├── 07-loans.png
│   │   └── 08-reminders.png
│   └── tablet/  (optional)
│       └── ...
└── feature-graphic/
    └── feature-graphic-1024x500.png
```

## 📸 Screenshot Requirements

### Phone Screenshots (Required)
- **Minimum:** 2 screenshots
- **Maximum:** 8 screenshots
- **Recommended:** 4-6 screenshots
- **Dimensions:** 1080 x 1920 px (portrait) or 1920 x 1080 px (landscape)
- **Format:** PNG or JPEG (24-bit)
- **File Size:** Max 8 MB per image

### Feature Graphic (Recommended)
- **Dimensions:** 1024 x 500 px
- **Format:** PNG or JPEG
- **Purpose:** Banner at top of Play Store listing

## 🚀 How to Capture Screenshots

### Using PowerShell Script (Windows)

```powershell
# 1. Connect your Android device via USB
# 2. Enable USB debugging on device
# 3. Verify connection:
adb devices

# 4. Navigate to screen on device, then run:
.\scripts\capture-screenshots.ps1 01-home-screen

# 5. Navigate to next screen and repeat:
.\scripts\capture-screenshots.ps1 02-add-transaction
.\scripts\capture-screenshots.ps1 03-all-transactions
# ... continue for all screens
```

### Using Device Screenshot (Alternative)

1. Open app on your Android device
2. Navigate to the screen you want
3. Press **Power + Volume Down** simultaneously
4. Transfer screenshot from Gallery to this folder
5. Rename to numbered filename (01-home-screen.png, etc.)

## 📋 Recommended Screenshots (Priority Order)

1. **🏠 Home Screen** - Dashboard with financial overview
2. **➕ Add Transaction** - Transaction entry form
3. **📊 All Transactions** - Transaction history list
4. **💰 Savings Goals** - Goals with progress
5. **📈 Budget Planning** - Budget categories
6. **🏦 Accounts** - Bank accounts overview
7. **💳 Loans** - Loan management (if applicable)
8. **🔔 Reminders** - Reminders list (optional)

## ✅ Checklist Before Uploading

- [ ] At least 2 phone screenshots (minimum required)
- [ ] All screenshots are correct dimensions (1080x1920 recommended)
- [ ] Screenshots are clear and high quality
- [ ] No sensitive/personal data visible
- [ ] Feature graphic is 1024x500 px (if created)
- [ ] All files are organized in correct folders

---

**See `CREATE_PLAY_STORE_SCREENSHOTS.md` for detailed guide.**

