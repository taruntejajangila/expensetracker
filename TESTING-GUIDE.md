# 📱 Expense Tracker - Complete Testing Guide

## Overview
This guide provides comprehensive testing scenarios to test the Expense Tracker app like a real user. Follow these scenarios in order to systematically test all features.

---

## 🎯 Test Environment Setup

### Prerequisites
- [ ] Backend API running locally (port 5000) or on Railway
- [ ] PostgreSQL database accessible
- [ ] Mobile app (Expo) running on simulator/device
- [ ] Test user account credentials ready
- [ ] Network connectivity confirmed

---

## 📋 Testing Scenarios

---

## 1️⃣ **AUTHENTICATION & USER MANAGEMENT**

### Test Case 1.1: User Registration
**Objective**: Verify new user can create an account

**Steps**:
1. Open the app
2. Navigate to "Sign Up" / "Register"
3. Enter valid details:
   - First Name: `Test`
   - Last Name: `User`
   - Email: `testuser@example.com`
   - Password: `Test@123456`
   - Confirm Password: `Test@123456`
4. Tap "Sign Up"

**Expected Results**:
- ✅ Registration successful
- ✅ User is logged in automatically
- ✅ Redirected to home/dashboard screen
- ✅ Welcome message displayed (optional)

**Potential Issues to Check**:
- ❌ Email already exists error handling
- ❌ Password mismatch error
- ❌ Weak password validation
- ❌ Network timeout handling

---

### Test Case 1.2: User Login
**Objective**: Verify existing user can log in

**Steps**:
1. If logged in, log out first
2. Navigate to "Login" screen
3. Enter credentials:
   - Email: `testuser@example.com`
   - Password: `Test@123456`
4. Tap "Login"

**Expected Results**:
- ✅ Login successful
- ✅ Redirected to dashboard
- ✅ User data loaded correctly

**Potential Issues to Check**:
- ❌ Invalid credentials error handling
- ❌ Empty field validation
- ❌ "Remember me" functionality (if exists)
- ❌ Token storage and retrieval

---

### Test Case 1.3: Token Persistence
**Objective**: Verify user stays logged in after app restart

**Steps**:
1. Log in successfully
2. Close the app completely (force quit)
3. Reopen the app

**Expected Results**:
- ✅ User remains logged in
- ✅ No need to enter credentials again
- ✅ Data loads correctly

**Potential Issues to Check**:
- ❌ User logged out unexpectedly
- ❌ Token expiration not handled
- ❌ Infinite loading screen

---

### Test Case 1.4: Logout
**Objective**: Verify user can log out properly

**Steps**:
1. Navigate to Profile/Settings
2. Tap "Logout"
3. Confirm logout (if prompted)

**Expected Results**:
- ✅ User logged out successfully
- ✅ Redirected to login screen
- ✅ Token cleared from storage
- ✅ Cannot access protected screens

---

## 2️⃣ **BANK ACCOUNTS MANAGEMENT**

### Test Case 2.1: Add Bank Account
**Objective**: Create a new bank account

**Steps**:
1. Navigate to "Accounts" or "Bank Accounts" screen
2. Tap "Add Account" or "+" button
3. Fill in account details:
   - Account Name: `My Checking`
   - Account Holder Name: `Test User`
   - Bank Name: `Test Bank`
   - Account Number: `1234567890`
   - Account Type: `Checking`
   - Balance: `5000`
   - Currency: `USD` or `INR`
4. Tap "Save" or "Add"

**Expected Results**:
- ✅ Account created successfully
- ✅ Success message displayed
- ✅ Account appears in accounts list
- ✅ Balance displayed correctly
- ✅ Redirected to accounts list

**Potential Issues to Check**:
- ❌ Validation errors for required fields
- ❌ Account type dropdown not working
- ❌ Balance not displayed correctly
- ❌ Duplicate account handling
- ❌ Currency not saved

---

### Test Case 2.2: View All Bank Accounts
**Objective**: View list of all bank accounts

**Steps**:
1. Navigate to "Accounts" screen
2. Observe the list of accounts

**Expected Results**:
- ✅ All accounts displayed
- ✅ Account name, bank name, balance visible
- ✅ Account type indicator shown
- ✅ Total balance calculated correctly
- ✅ Empty state if no accounts

**Potential Issues to Check**:
- ❌ Accounts not loading
- ❌ Incorrect balance calculation
- ❌ Duplicate accounts shown
- ❌ Formatting issues (currency, numbers)

---

### Test Case 2.3: Edit Bank Account
**Objective**: Update existing bank account details

**Steps**:
1. Navigate to "Accounts" screen
2. Tap on an existing account
3. Tap "Edit" button
4. Modify details:
   - Account Name: `Updated Checking`
   - Balance: `6000`
5. Tap "Save"

**Expected Results**:
- ✅ Account updated successfully
- ✅ Changes reflected in accounts list
- ✅ Success message displayed

**Potential Issues to Check**:
- ❌ Changes not saved
- ❌ Original values not pre-filled
- ❌ Balance not updating correctly

---

### Test Case 2.4: Delete Bank Account
**Objective**: Remove a bank account

**Steps**:
1. Navigate to "Accounts" screen
2. Tap on an account with ZERO balance
3. Tap "Delete" button
4. Confirm deletion

**Expected Results**:
- ✅ Account deleted successfully
- ✅ Account removed from list
- ✅ Success message displayed

**Steps for Account with Balance**:
1. Try to delete an account with balance > 0

**Expected Results**:
- ✅ Deletion prevented
- ✅ Warning message: "Cannot delete account with balance"
- ✅ Account remains in list

**Potential Issues to Check**:
- ❌ Account with balance can be deleted
- ❌ Account not removed from list
- ❌ Transactions linked to account orphaned

---

## 3️⃣ **CATEGORIES MANAGEMENT**

### Test Case 3.1: View Default Categories
**Objective**: Verify default categories are available

**Steps**:
1. Navigate to "Categories" screen
2. View list of categories

**Expected Results**:
- ✅ Default categories visible:
  - Food & Dining 🍽️
  - Transportation 🚗
  - Shopping 🛍️
  - Entertainment 🎬
  - Bills & Utilities 💡
  - Healthcare 🏥
  - Education 📚
  - Travel ✈️
  - Salary 💰
  - Freelance 💼
  - Investment 📈
  - Other Income 💵
- ✅ Categories have icons and colors
- ✅ Categories grouped by type (Income/Expense)

**Potential Issues to Check**:
- ❌ Categories not loading
- ❌ Icons not displaying
- ❌ Colors not showing

---

### Test Case 3.2: Add Custom Category
**Objective**: Create a custom category

**Steps**:
1. Navigate to "Categories" screen
2. Tap "Add Category" or "+" button
3. Fill in details:
   - Name: `Gifts`
   - Type: `Expense`
   - Icon: Select an icon
   - Color: Select a color
4. Tap "Save"

**Expected Results**:
- ✅ Category created successfully
- ✅ Category appears in list
- ✅ Available when creating transactions

**Potential Issues to Check**:
- ❌ Category not saved
- ❌ Icon/color not applied
- ❌ Duplicate category allowed

---

## 4️⃣ **TRANSACTIONS MANAGEMENT**

### Test Case 4.1: Add Expense Transaction
**Objective**: Record a new expense

**Steps**:
1. Navigate to "Transactions" or "Home" screen
2. Tap "Add Transaction" or "+" button
3. Select "Expense" type
4. Fill in details:
   - Amount: `150`
   - Category: `Food & Dining`
   - Description: `Lunch at restaurant`
   - Date: Today's date
   - Account: Select the account created earlier
   - Location: `Downtown Restaurant` (optional)
   - Tags: `lunch`, `restaurant` (optional)
5. Tap "Save"

**Expected Results**:
- ✅ Transaction created successfully
- ✅ Transaction appears in transactions list
- ✅ Account balance decreased by 150
- ✅ Success message displayed
- ✅ Redirected to transactions list

**Potential Issues to Check**:
- ❌ Amount validation (negative, zero)
- ❌ Account balance not updated
- ❌ Date picker issues
- ❌ Category not selected
- ❌ Transaction not saved

---

### Test Case 4.2: Add Income Transaction
**Objective**: Record income

**Steps**:
1. Tap "Add Transaction"
2. Select "Income" type
3. Fill in details:
   - Amount: `3000`
   - Category: `Salary`
   - Description: `Monthly salary`
   - Date: Today's date
   - Account: Select account
4. Tap "Save"

**Expected Results**:
- ✅ Transaction created successfully
- ✅ Account balance increased by 3000
- ✅ Transaction appears with income indicator

**Potential Issues to Check**:
- ❌ Balance not increasing
- ❌ Income not differentiated from expense

---

### Test Case 4.3: Add Transfer Between Accounts
**Objective**: Transfer money between accounts

**Prerequisites**: Must have 2 bank accounts

**Steps**:
1. Create a second account if not exists
2. Tap "Add Transaction"
3. Select "Transfer" type
4. Fill in details:
   - Amount: `500`
   - From Account: `Account 1`
   - To Account: `Account 2`
   - Description: `Account transfer`
   - Date: Today's date
5. Tap "Save"

**Expected Results**:
- ✅ Transfer created successfully
- ✅ From account balance decreased by 500
- ✅ To account balance increased by 500
- ✅ Transaction appears in both accounts

**Potential Issues to Check**:
- ❌ Same account selected for both
- ❌ Only one account balance updated
- ❌ Incorrect balance calculation

---

### Test Case 4.4: View Transaction List
**Objective**: View all transactions

**Steps**:
1. Navigate to "Transactions" screen
2. Scroll through the list

**Expected Results**:
- ✅ All transactions displayed
- ✅ Transactions sorted by date (newest first)
- ✅ Amount, category, description visible
- ✅ Different colors for income/expense
- ✅ Filter options available (if implemented)
- ✅ Search functionality works (if implemented)

**Potential Issues to Check**:
- ❌ Transactions not loading
- ❌ Wrong sorting order
- ❌ Missing transaction details
- ❌ Formatting issues

---

### Test Case 4.5: Edit Transaction
**Objective**: Update existing transaction

**Steps**:
1. Tap on a transaction
2. Tap "Edit"
3. Modify details:
   - Amount: Change to `200`
   - Description: Update text
4. Tap "Save"

**Expected Results**:
- ✅ Transaction updated successfully
- ✅ Changes reflected in list
- ✅ Account balance recalculated correctly

**Potential Issues to Check**:
- ❌ Balance not recalculated
- ❌ Original values not pre-filled
- ❌ Changes not saved

---

### Test Case 4.6: Delete Transaction
**Objective**: Remove a transaction

**Steps**:
1. Tap on a transaction
2. Tap "Delete"
3. Confirm deletion

**Expected Results**:
- ✅ Transaction deleted
- ✅ Account balance adjusted
- ✅ Transaction removed from list

**Potential Issues to Check**:
- ❌ Balance not adjusted
- ❌ Transaction not deleted

---

### Test Case 4.7: View Recent Transactions (Home Screen)
**Objective**: View recent transactions on dashboard

**Steps**:
1. Navigate to "Home" or "Dashboard" screen
2. View "Recent Transactions" section

**Expected Results**:
- ✅ Last 5-10 transactions displayed
- ✅ Quick view of transaction details
- ✅ "View All" button available

---

## 5️⃣ **SAVINGS GOALS**

### Test Case 5.1: Create Savings Goal
**Objective**: Set up a new savings goal

**Steps**:
1. Navigate to "Goals" or "Savings" screen
2. Tap "Add Goal" or "+" button
3. Fill in details:
   - Goal Name: `Vacation Fund`
   - Target Amount: `5000`
   - Target Date: Select a future date (e.g., 6 months from now)
   - Description: `Summer vacation to Hawaii` (optional)
4. Tap "Save"

**Expected Results**:
- ✅ Goal created successfully
- ✅ Goal appears in goals list
- ✅ Progress bar shows 0% (no contributions yet)
- ✅ Success message displayed
- ✅ Days remaining calculated correctly

**Potential Issues to Check**:
- ❌ Goal type validation errors
- ❌ Date picker issues (past dates allowed)
- ❌ Target amount validation (negative/zero)
- ❌ Progress calculation incorrect

---

### Test Case 5.2: View All Goals
**Objective**: View list of savings goals

**Steps**:
1. Navigate to "Goals" screen
2. Observe the list

**Expected Results**:
- ✅ All goals displayed
- ✅ Goal name, target amount, current amount visible
- ✅ Progress bar showing percentage
- ✅ Target date displayed
- ✅ Days remaining shown (e.g., "You still have X days to fulfill your goal")
- ✅ Empty state if no goals

**Potential Issues to Check**:
- ❌ Goals not loading
- ❌ Progress percentage incorrect
- ❌ Date display issues
- ❌ "undefined" or null errors in date fields
- ❌ Goal type "other" showing unnecessarily

---

### Test Case 5.3: Add Money to Goal
**Objective**: Contribute money towards a goal

**Steps**:
1. Tap on a goal
2. Tap "Add Money" or similar button
3. Enter amount: `500`
4. Confirm

**Expected Results**:
- ✅ Amount added to goal
- ✅ Progress bar updated
- ✅ Percentage recalculated
- ✅ Current amount displayed correctly

**Potential Issues to Check**:
- ❌ Amount not added
- ❌ Progress not updating
- ❌ Cannot add more than target amount

---

### Test Case 5.4: Withdraw Money from Goal
**Objective**: Remove money from a goal

**Steps**:
1. Tap on a goal with money in it
2. Tap "Withdraw Money" or similar
3. Enter amount: `100`
4. Confirm

**Expected Results**:
- ✅ Amount withdrawn successfully
- ✅ Progress bar updated
- ✅ Current amount decreased

**Potential Issues to Check**:
- ❌ Can withdraw more than current amount
- ❌ Progress not updating

---

### Test Case 5.5: Edit Goal
**Objective**: Modify existing goal

**Steps**:
1. Tap on a goal
2. Tap "Edit" button
3. Modify details:
   - Target Amount: `6000`
   - Target Date: Extend by 2 months
4. Tap "Save"

**Expected Results**:
- ✅ Goal updated successfully
- ✅ Changes reflected
- ✅ Progress recalculated

---

### Test Case 5.6: Delete Goal (with no money)
**Objective**: Delete a goal without contributions

**Steps**:
1. Create a goal with $0 contributions
2. Tap on the goal
3. Tap "Delete" button (in EditGoalScreen)
4. Confirm deletion in alert (⚠️ warning alert)

**Expected Results**:
- ✅ Warning alert displayed with ⚠️ emoji
- ✅ Goal deleted successfully
- ✅ Success alert with ✅ emoji
- ✅ Goal removed from list

---

### Test Case 5.7: Try to Delete Goal (with money)
**Objective**: Verify cannot delete goal with money

**Steps**:
1. Tap on a goal that has money (current_amount > 0)
2. Tap "Delete" button
3. Confirm deletion

**Expected Results**:
- ✅ Deletion prevented
- ✅ Error alert displayed with ❌ emoji
- ✅ Error message: "Cannot delete goal with existing money. Please withdraw all funds first."
- ✅ Goal remains in list

**Potential Issues to Check**:
- ❌ Goal with money can be deleted
- ❌ Money not returned to account
- ❌ Alert not showing properly

---

### Test Case 5.8: Complete Goal
**Objective**: Achieve a goal (100% progress)

**Steps**:
1. Add money to a goal until current amount >= target amount
2. Observe the goal

**Expected Results**:
- ✅ Goal marked as "Completed" or "Achieved"
- ✅ Progress bar at 100%
- ✅ Congratulatory message: "Goal achieved! Congratulations!"
- ✅ Special indicator/badge

---

## 6️⃣ **LOANS MANAGEMENT**

### Test Case 6.1: Create Personal Loan
**Objective**: Record a new loan

**Steps**:
1. Navigate to "Loans" screen
2. Tap "Add Loan" or "+" button
3. Fill in details:
   - Loan Name: `Car Loan`
   - Loan Type: `Auto`
   - Principal Amount: `20000`
   - Interest Rate: `26` (for 26% per annum)
   - Loan Term: `24` months
   - Start Date: Today's date
   - Lender: `Test Bank` (optional)
   - Account Number: `1234567890` (optional)
4. Tap "Save"

**Expected Results**:
- ✅ Loan created successfully
- ✅ Loan appears in loans list
- ✅ Monthly EMI calculated correctly
- ✅ Interest rate displayed as percentage (26%)
- ✅ Outstanding balance equals principal amount initially
- ✅ End date calculated automatically (start date + 24 months)

**How to verify EMI calculation**:
- For ₹20,000 at 26% annual interest for 24 months:
- Monthly interest rate = 26% / 12 = 2.167% = 0.02167
- EMI formula: P × r × (1 + r)^n / ((1 + r)^n - 1)
- Expected EMI ≈ ₹1,070 - ₹1,100 per month

**Potential Issues to Check**:
- ❌ Interest rate shown as 0% on card
- ❌ EMI calculation incorrect
- ❌ Loan not saved
- ❌ Interest rate interpreted incorrectly (26 vs 0.26)
- ❌ End date not calculated
- ❌ Outstanding balance incorrect

---

### Test Case 6.2: View All Loans
**Objective**: View list of all loans

**Steps**:
1. Navigate to "Loans" screen
2. View the list

**Expected Results**:
- ✅ All loans displayed
- ✅ Loan cards show:
  - Loan name
  - Loan type
  - Principal amount
  - Outstanding balance
  - Interest rate (as percentage, e.g., 26%)
  - Monthly payment (EMI)
  - Loan term
  - Progress bar (amount paid vs principal)
  - Start and end dates
- ✅ Active loans shown first
- ✅ Empty state if no loans

**Potential Issues to Check**:
- ❌ Loans not loading
- ❌ Interest rate showing 0%
- ❌ EMI showing incorrect amount
- ❌ Progress bar incorrect
- ❌ Formatting issues

---

### Test Case 6.3: Record Loan Payment
**Objective**: Make a payment towards loan

**Steps**:
1. Tap on a loan
2. Tap "Make Payment" or similar
3. Enter payment amount: Equal to or greater than EMI
4. Select payment date
5. Confirm

**Expected Results**:
- ✅ Payment recorded successfully
- ✅ Outstanding balance decreased
- ✅ Progress bar updated
- ✅ Payment history shows new entry
- ✅ Principal and interest portions calculated

**Potential Issues to Check**:
- ❌ Outstanding balance not updating
- ❌ Payment amount validation
- ❌ Cannot pay more than outstanding balance

---

### Test Case 6.4: View Loan Payment History
**Objective**: View all payments made towards a loan

**Steps**:
1. Tap on a loan
2. Navigate to "Payment History" or similar
3. View list of payments

**Expected Results**:
- ✅ All payments listed
- ✅ Payment date, amount shown
- ✅ Principal and interest breakdown visible
- ✅ Remaining balance after each payment

---

### Test Case 6.5: Edit Loan
**Objective**: Update loan details

**Steps**:
1. Tap on a loan
2. Tap "Edit"
3. Modify details:
   - Interest Rate: `22` (changed from 26%)
4. Tap "Save"

**Expected Results**:
- ✅ Loan updated successfully
- ✅ EMI recalculated with new interest rate
- ✅ Changes reflected in loan card

**Potential Issues to Check**:
- ❌ Interest rate not updating
- ❌ EMI not recalculated
- ❌ Original values not pre-filled

---

### Test Case 6.6: Mark Loan as Paid Off
**Objective**: Complete a loan

**Steps**:
1. Make payments until outstanding balance = 0
2. Or manually mark as "Paid Off" (if feature exists)

**Expected Results**:
- ✅ Loan status changed to "Paid Off" or "Inactive"
- ✅ Progress bar at 100%
- ✅ Loan moved to "Completed" section or marked differently
- ✅ Congratulatory message

---

### Test Case 6.7: Delete Loan
**Objective**: Remove a loan record

**Steps**:
1. Tap on a loan
2. Tap "Delete"
3. Confirm deletion

**Expected Results**:
- ✅ Loan deleted successfully
- ✅ Loan removed from list
- ✅ Confirmation alert

**Potential Issues to Check**:
- ❌ Loan with payments can be deleted (should have warning)
- ❌ Payment history orphaned

---

## 7️⃣ **BUDGETS**

### Test Case 7.1: Create Budget
**Objective**: Set up spending limit for a category

**Steps**:
1. Navigate to "Budgets" screen
2. Tap "Add Budget" or "+" button
3. Fill in details:
   - Budget Name: `Food Budget`
   - Category: `Food & Dining`
   - Amount: `1000`
   - Period: `Monthly`
   - Start Date: First day of current month
   - End Date: Last day of current month
4. Tap "Save"

**Expected Results**:
- ✅ Budget created successfully
- ✅ Budget appears in list
- ✅ Shows 0% spent initially

**Potential Issues to Check**:
- ❌ Budget not saved
- ❌ Period selection issues
- ❌ Date range validation

---

### Test Case 7.2: Track Budget Progress
**Objective**: Verify budget tracks spending

**Steps**:
1. Create a Food Budget (as above)
2. Add expense transactions in "Food & Dining" category
3. View the budget

**Expected Results**:
- ✅ Budget shows spent amount
- ✅ Progress bar updated
- ✅ Percentage calculated correctly
- ✅ Status indicator:
  - Green: Under budget
  - Yellow: Near limit (e.g., >80%)
  - Red: Over budget

**Potential Issues to Check**:
- ❌ Spent amount not updating
- ❌ Percentage incorrect
- ❌ Transactions not linked to budget

---

### Test Case 7.3: Budget Alert (Over Budget)
**Objective**: Test over-budget notification

**Steps**:
1. Create a budget with small amount (e.g., $50)
2. Add expense that exceeds the budget
3. Check for alerts/notifications

**Expected Results**:
- ✅ Warning/alert displayed
- ✅ Budget marked as "Over Budget"
- ✅ Notification sent (if implemented)

---

### Test Case 7.4: Edit Budget
**Objective**: Update budget details

**Steps**:
1. Tap on a budget
2. Tap "Edit"
3. Change amount to `1500`
4. Tap "Save"

**Expected Results**:
- ✅ Budget updated
- ✅ Progress recalculated

---

### Test Case 7.5: Delete Budget
**Objective**: Remove a budget

**Steps**:
1. Tap on a budget
2. Tap "Delete"
3. Confirm

**Expected Results**:
- ✅ Budget deleted
- ✅ Removed from list

---

## 8️⃣ **CREDIT CARDS** (if implemented)

### Test Case 8.1: Add Credit Card
**Objective**: Record a credit card

**Steps**:
1. Navigate to "Credit Cards" screen
2. Tap "Add Card"
3. Fill in details:
   - Card Name: `My Visa Card`
   - Card Number: `****1234` (last 4 digits)
   - Card Type: `Visa`
   - Credit Limit: `5000`
   - Available Credit: `5000`
   - Interest Rate: `18%`
   - Due Date: `15` (day of month)
   - Expiry Date: Future date
4. Tap "Save"

**Expected Results**:
- ✅ Card created successfully
- ✅ Card appears in list
- ✅ Credit limit displayed

---

### Test Case 8.2: Record Credit Card Transaction
**Objective**: Track spending on credit card

**Steps**:
1. Add a transaction
2. Select payment method as Credit Card
3. Select the card
4. Fill in transaction details
5. Save

**Expected Results**:
- ✅ Transaction recorded
- ✅ Available credit reduced
- ✅ Transaction linked to card

---

### Test Case 8.3: Make Credit Card Payment
**Objective**: Pay off credit card balance

**Steps**:
1. Tap on credit card
2. Tap "Make Payment"
3. Enter amount
4. Select payment source (bank account)
5. Confirm

**Expected Results**:
- ✅ Payment recorded
- ✅ Available credit increased
- ✅ Bank account balance decreased

---

## 9️⃣ **NOTIFICATIONS**

### Test Case 9.1: View Notifications
**Objective**: Check notifications screen

**Steps**:
1. Navigate to "Notifications" screen (bell icon)
2. View list of notifications

**Expected Results**:
- ✅ Notifications displayed (if any)
- ✅ Read/unread status shown
- ✅ Notification types:
  - Budget alerts
  - Goal achievements
  - Loan payment reminders
  - System announcements
- ✅ Empty state if no notifications

**Potential Issues to Check**:
- ❌ Notifications not loading
- ❌ Error: "column n.target_user_id does not exist"
- ❌ Notifications not marked as read

---

### Test Case 9.2: Register Push Notification Token
**Objective**: Verify push notification setup

**Steps**:
1. Open app (first time or after reinstall)
2. Grant notification permissions when prompted

**Expected Results**:
- ✅ Push token registered with backend
- ✅ Device can receive notifications

**Potential Issues to Check**:
- ❌ Token not registered
- ❌ Permission denied handling

---

### Test Case 9.3: Receive Push Notification
**Objective**: Test receiving notifications

**Steps**:
1. Trigger a notification event (e.g., exceed budget, goal deadline)
2. Check if notification appears on device

**Expected Results**:
- ✅ Notification received on device
- ✅ Tapping notification opens relevant screen

---

## 🔟 **BANNERS** (if implemented)

### Test Case 10.1: View Public Banners
**Objective**: Check if promotional banners display

**Steps**:
1. Navigate to Home screen
2. Look for banner section

**Expected Results**:
- ✅ Banners displayed (if any)
- ✅ Banner images load
- ✅ Tapping banner opens link/screen

**Potential Issues to Check**:
- ❌ Error: "relation 'banners' does not exist"
- ❌ Banners not loading
- ❌ API returning 500 error

---

## 1️⃣1️⃣ **REMINDERS**

### Test Case 11.1: Create Reminder
**Objective**: Set up a payment reminder

**Steps**:
1. Navigate to "Reminders" screen
2. Tap "Add Reminder"
3. Fill in details:
   - Title: `Pay Electricity Bill`
   - Description: `Monthly electricity payment`
   - Reminder Type: `Bill Payment`
   - Reminder Date: Select future date/time
   - Is Recurring: Yes
   - Frequency: Monthly
4. Tap "Save"

**Expected Results**:
- ✅ Reminder created successfully
- ✅ Reminder appears in list
- ✅ Notification scheduled

**Potential Issues to Check**:
- ❌ Error: "column 'due_date' does not exist"
- ❌ Reminder not saved
- ❌ Date/time picker issues

---

### Test Case 11.2: View Reminders List
**Objective**: Check upcoming reminders

**Steps**:
1. Navigate to "Reminders" screen
2. View list

**Expected Results**:
- ✅ All reminders displayed
- ✅ Sorted by date
- ✅ Upcoming reminders highlighted

---

### Test Case 11.3: Mark Reminder as Complete
**Objective**: Complete a reminder

**Steps**:
1. Tap on a reminder
2. Tap "Mark as Complete" or checkbox
3. Confirm

**Expected Results**:
- ✅ Reminder marked as completed
- ✅ Moved to completed section or hidden

---

### Test Case 11.4: Receive Reminder Notification
**Objective**: Test reminder alert

**Steps**:
1. Create a reminder for a near future time (e.g., 2 minutes ahead)
2. Wait for the time
3. Check if notification appears

**Expected Results**:
- ✅ Notification received at scheduled time
- ✅ Notification contains reminder details

---

## 1️⃣2️⃣ **SUPPORT TICKETS**

### Test Case 12.1: Create Support Ticket
**Objective**: Submit a help request

**Steps**:
1. Navigate to "Support" or "Help" screen
2. Tap "Create Ticket" or "Contact Support"
3. Fill in details:
   - Subject: `Unable to delete account`
   - Description: `I'm getting an error when trying to delete my checking account`
   - Category: `Technical Issue`
   - Priority: `Medium`
   - Attachments: Upload screenshot (optional)
4. Tap "Submit"

**Expected Results**:
- ✅ Ticket created successfully
- ✅ Ticket ID assigned
- ✅ Ticket appears in "My Tickets" list
- ✅ Status: "Open"
- ✅ Success message displayed

**Potential Issues to Check**:
- ❌ Ticket not saved
- ❌ Attachments not uploading
- ❌ Validation errors

---

### Test Case 12.2: View Support Tickets List
**Objective**: Check all submitted tickets

**Steps**:
1. Navigate to "My Tickets" or "Support History"
2. View list of tickets

**Expected Results**:
- ✅ All tickets displayed
- ✅ Ticket subject, status, date shown
- ✅ Filtered by status (Open, In Progress, Resolved, Closed)

**Potential Issues to Check**:
- ❌ Tickets not loading
- ❌ Status not updating

---

### Test Case 12.3: View Ticket Messages
**Objective**: Check conversation in a ticket

**Steps**:
1. Tap on a ticket
2. View ticket details and messages

**Expected Results**:
- ✅ Ticket details displayed
- ✅ Message thread visible
- ✅ User messages and admin responses differentiated
- ✅ Timestamps shown

**Potential Issues to Check**:
- ❌ Error: "relation 'ticket_messages' does not exist"
- ❌ Messages not loading
- ❌ Cannot distinguish user from admin messages

---

### Test Case 12.4: Reply to Ticket
**Objective**: Add a message to existing ticket

**Steps**:
1. Open a ticket
2. Type a reply in message box
3. Tap "Send"

**Expected Results**:
- ✅ Message added to thread
- ✅ Ticket status updated to "In Progress" (if applicable)
- ✅ Message appears in thread

---

### Test Case 12.5: Close Ticket
**Objective**: Mark ticket as resolved

**Steps**:
1. Open a resolved ticket
2. Tap "Close Ticket" or "Mark as Resolved"
3. Confirm

**Expected Results**:
- ✅ Ticket status changed to "Closed"
- ✅ Cannot add more messages (optional)

---

## 1️⃣3️⃣ **REPORTS & ANALYTICS** (if implemented)

### Test Case 13.1: View Spending by Category
**Objective**: Analyze expense distribution

**Steps**:
1. Navigate to "Reports" or "Analytics" screen
2. View "Spending by Category" chart

**Expected Results**:
- ✅ Pie chart or bar chart displayed
- ✅ Categories with spending shown
- ✅ Percentages calculated
- ✅ Legend with colors

---

### Test Case 13.2: View Income vs Expense
**Objective**: Check financial summary

**Steps**:
1. Navigate to "Reports"
2. View "Income vs Expense" chart

**Expected Results**:
- ✅ Line or bar chart displayed
- ✅ Income and expense trends shown
- ✅ Time period selector (Monthly, Quarterly, Yearly)

---

### Test Case 13.3: Export Data
**Objective**: Download financial data

**Steps**:
1. Navigate to "Reports" or "Settings"
2. Tap "Export Data" or "Download"
3. Select format (CSV, PDF, Excel)
4. Confirm

**Expected Results**:
- ✅ File generated successfully
- ✅ File downloaded to device
- ✅ Data accurate and formatted

---

## 1️⃣4️⃣ **PROFILE & SETTINGS**

### Test Case 14.1: View Profile
**Objective**: Check user profile details

**Steps**:
1. Navigate to "Profile" or "Settings"
2. View profile information

**Expected Results**:
- ✅ User name, email displayed
- ✅ Avatar/profile picture (if implemented)
- ✅ Account creation date
- ✅ Currency preference

---

### Test Case 14.2: Edit Profile
**Objective**: Update user information

**Steps**:
1. Navigate to Profile
2. Tap "Edit Profile"
3. Modify details:
   - First Name: `Updated Name`
   - Phone: `+1234567890`
   - Date of Birth: Select date
4. Tap "Save"

**Expected Results**:
- ✅ Profile updated successfully
- ✅ Changes reflected

---

### Test Case 14.3: Change Password
**Objective**: Update account password

**Steps**:
1. Navigate to Settings
2. Tap "Change Password"
3. Enter:
   - Current Password
   - New Password
   - Confirm New Password
4. Tap "Save"

**Expected Results**:
- ✅ Password changed successfully
- ✅ Can login with new password

---

### Test Case 14.4: Change Currency
**Objective**: Update default currency

**Steps**:
1. Navigate to Settings
2. Tap "Currency"
3. Select new currency (e.g., INR, EUR, GBP)
4. Save

**Expected Results**:
- ✅ Currency updated
- ✅ All amounts displayed in new currency
- ✅ Currency symbol updated

---

### Test Case 14.5: Enable/Disable Notifications
**Objective**: Manage notification preferences

**Steps**:
1. Navigate to Settings
2. Tap "Notifications"
3. Toggle notification types:
   - Budget Alerts: ON/OFF
   - Goal Reminders: ON/OFF
   - Loan Payments: ON/OFF
4. Save

**Expected Results**:
- ✅ Preferences saved
- ✅ Notifications respect settings

---

## 1️⃣5️⃣ **ERROR HANDLING & EDGE CASES**

### Test Case 15.1: Offline Mode
**Objective**: Test app behavior without internet

**Steps**:
1. Turn off WiFi and mobile data
2. Try to perform actions:
   - View cached data
   - Add transaction
   - Login

**Expected Results**:
- ✅ Cached data still visible
- ✅ "No internet connection" message displayed
- ✅ Actions queued for sync when online (if implemented)
- ✅ App doesn't crash

**Potential Issues to Check**:
- ❌ Infinite loading screens
- ❌ App crashes
- ❌ No error messages

---

### Test Case 15.2: Network Timeout
**Objective**: Test slow network handling

**Steps**:
1. Enable slow network simulation (if possible)
2. Perform API calls

**Expected Results**:
- ✅ Loading indicators shown
- ✅ Timeout after reasonable period
- ✅ Retry option provided
- ✅ Error message displayed

---

### Test Case 15.3: Invalid Token Handling
**Objective**: Test expired token scenario

**Steps**:
1. Manually expire the auth token (modify stored token)
2. Try to access protected resources

**Expected Results**:
- ✅ User logged out automatically
- ✅ Redirected to login screen
- ✅ Error message: "Session expired. Please login again."

**Potential Issues to Check**:
- ❌ Error: "Token verification failed: invalid signature"
- ❌ App stuck in loading state

---

### Test Case 15.4: Empty States
**Objective**: Test UI with no data

**Steps**:
1. Create fresh account
2. View each screen without adding data

**Expected Results**:
- ✅ Friendly empty state messages:
  - "No accounts yet. Add your first account!"
  - "No transactions to display"
  - "Start tracking your goals"
- ✅ Call-to-action buttons visible
- ✅ Helpful instructions

---

### Test Case 15.5: Large Data Sets
**Objective**: Test performance with many records

**Steps**:
1. Add 100+ transactions
2. Add 50+ goals
3. Add 20+ loans
4. Navigate through the app

**Expected Results**:
- ✅ App remains responsive
- ✅ Scrolling smooth
- ✅ Pagination implemented (if applicable)
- ✅ Search/filter works efficiently

**Potential Issues to Check**:
- ❌ Slow loading
- ❌ App crashes
- ❌ UI stuttering

---

### Test Case 15.6: Special Characters & Emojis
**Objective**: Test input handling

**Steps**:
1. Add transactions/accounts with special characters:
   - Description: `Café ☕ & Restaurant 🍽️`
   - Name: `Test!@#$%^&*()_+`
2. Save and view

**Expected Results**:
- ✅ Special characters saved correctly
- ✅ Emojis displayed properly
- ✅ No encoding issues

---

### Test Case 15.7: Concurrent Requests
**Objective**: Test multiple simultaneous actions

**Steps**:
1. Quickly perform multiple actions:
   - Add transaction
   - View accounts
   - Update goal
   - Fetch notifications
2. Observe behavior

**Expected Results**:
- ✅ All requests processed
- ✅ No race conditions
- ✅ Data consistency maintained

---

## 1️⃣6️⃣ **CROSS-PLATFORM TESTING** (if applicable)

### Test Case 16.1: iOS Device Testing
**Objective**: Test on iPhone/iPad

**Steps**:
1. Install app on iOS device
2. Run through key scenarios
3. Check UI rendering

**Expected Results**:
- ✅ App works on iOS
- ✅ UI follows iOS design guidelines
- ✅ Gestures work correctly

---

### Test Case 16.2: Android Device Testing
**Objective**: Test on Android device

**Steps**:
1. Install app on Android device
2. Run through key scenarios
3. Check UI rendering

**Expected Results**:
- ✅ App works on Android
- ✅ UI follows Material Design
- ✅ Back button works correctly

---

## 1️⃣7️⃣ **SECURITY TESTING**

### Test Case 17.1: SQL Injection
**Objective**: Test input sanitization

**Steps**:
1. Try entering SQL commands in input fields:
   - Description: `'; DROP TABLE users; --`
2. Submit

**Expected Results**:
- ✅ Input sanitized
- ✅ No database errors
- ✅ Tables remain intact

---

### Test Case 17.2: Password Security
**Objective**: Verify password requirements

**Steps**:
1. Try registering with weak passwords:
   - `123`
   - `password`
   - `abc`

**Expected Results**:
- ✅ Weak passwords rejected
- ✅ Password requirements displayed:
  - Minimum 8 characters
  - At least one uppercase
  - At least one number
  - Special character (optional)

---

### Test Case 17.3: API Authorization
**Objective**: Test protected endpoints

**Steps**:
1. Remove auth token
2. Try to access protected API endpoints directly (using tools like Postman)

**Expected Results**:
- ✅ Unauthorized access denied
- ✅ 401 Unauthorized response
- ✅ Error message: "Authentication required"

---

## 📊 **TEST RESULTS TRACKING**

Use this template to track your testing:

```
| Test Case | Status | Notes | Severity |
|-----------|--------|-------|----------|
| 1.1 - User Registration | ✅ Pass | | |
| 1.2 - User Login | ❌ Fail | Token verification error | High |
| 2.1 - Add Bank Account | ⚠️ Warning | Slow loading | Medium |
| ... | | | |
```

**Status Indicators**:
- ✅ **Pass**: Working as expected
- ❌ **Fail**: Critical issue found
- ⚠️ **Warning**: Minor issue or improvement needed
- ⏭️ **Skip**: Not applicable/Not implemented

**Severity Levels**:
- **Critical**: App crashes, data loss, security issue
- **High**: Feature doesn't work, major bug
- **Medium**: Feature works but with issues
- **Low**: UI glitch, minor improvement

---

## 🐛 **KNOWN ISSUES FROM LOGS**

Based on the backend logs, here are confirmed issues:

### Critical Issues:
1. ❌ **Missing `banners` table**
   - Error: `relation "banners" does not exist`
   - Impact: Public banners API fails (500 error)
   - Test: Test Case 10.1

2. ❌ **Missing `target_user_id` column in notifications**
   - Error: `column n.target_user_id does not exist`
   - Impact: Cannot fetch user notifications
   - Test: Test Case 9.1

3. ❌ **Missing `due_date` column in reminders**
   - Error: `column "due_date" does not exist`
   - Impact: Cannot fetch reminders
   - Test: Test Case 11.2

### Medium Issues:
4. ⚠️ **Token verification failures**
   - Error: `invalid signature`
   - Impact: Old/invalid tokens cause errors
   - Test: Test Case 15.3

---

## 🎯 **PRIORITY TESTING ORDER**

### Phase 1 - Core Functionality (Must Work):
1. Authentication (Test Cases 1.1 - 1.4)
2. Bank Accounts (Test Cases 2.1 - 2.4)
3. Transactions (Test Cases 4.1 - 4.6)

### Phase 2 - Key Features:
4. Savings Goals (Test Cases 5.1 - 5.8)
5. Loans (Test Cases 6.1 - 6.7)
6. Categories (Test Cases 3.1 - 3.2)

### Phase 3 - Additional Features:
7. Budgets (Test Cases 7.1 - 7.5)
8. Notifications (Test Cases 9.1 - 9.3)
9. Support Tickets (Test Cases 12.1 - 12.5)
10. Reminders (Test Cases 11.1 - 11.4)

### Phase 4 - Edge Cases & Polish:
11. Error Handling (Test Cases 15.1 - 15.7)
12. Profile & Settings (Test Cases 14.1 - 14.5)
13. Security (Test Cases 17.1 - 17.3)

---

## 📝 **TESTING CHECKLIST**

Before marking testing complete, ensure:

- [ ] All core features tested (Auth, Accounts, Transactions)
- [ ] All CRUD operations work (Create, Read, Update, Delete)
- [ ] Data validation working on all forms
- [ ] Error messages clear and helpful
- [ ] Success confirmations displayed
- [ ] UI responsive on different screen sizes
- [ ] No console errors or warnings
- [ ] No backend API errors (500, 404, etc.)
- [ ] Offline mode handled gracefully
- [ ] Loading states shown appropriately
- [ ] Empty states informative
- [ ] Known database issues fixed

---

## 🚀 **NEXT STEPS**

After completing testing:

1. **Document all issues** found with:
   - Test case reference
   - Steps to reproduce
   - Expected vs actual behavior
   - Screenshots/videos
   - Device/platform information

2. **Prioritize fixes** by severity:
   - Critical: Fix immediately
   - High: Fix before release
   - Medium: Fix in next iteration
   - Low: Nice to have

3. **Regression testing** after fixes:
   - Re-run failed test cases
   - Verify fixes don't break other features

4. **User Acceptance Testing (UAT)**:
   - Share with beta testers
   - Gather feedback
   - Iterate

---

## 📞 **SUPPORT**

If you encounter issues during testing:
- Check backend logs: `backend-api/logs/*.log`
- Check mobile app console: Expo developer tools
- Check database: Use PostgreSQL client or Railway dashboard
- Review this guide for expected behavior

---

**Happy Testing! 🎉**

Find bugs, report them, and let's make this app amazing! 🚀

