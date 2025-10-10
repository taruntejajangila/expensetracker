# 📱 Manual Testing Guide - Expense Tracker App

## 🎯 Testing Overview
This guide will help you systematically test all features of the expense tracker app to ensure everything is working correctly.

---

## 📋 Pre-Testing Setup

### 1. **Backend API Setup**
- ✅ Ensure backend is running on `http://192.168.29.14:5000`
- ✅ Database is connected and running
- ✅ All recent fixes are applied

### 2. **Admin Panel Setup**
- ✅ Admin panel running on `http://localhost:3001`
- ✅ Admin credentials: `admin@expensetracker.com` / `admin123`

### 3. **Mobile App Setup**
- ✅ Mobile app running on Expo
- ✅ Connected to backend API

---

## 🧪 Testing Scenarios

### **SCENARIO 1: User Registration & Login**
**Objective:** Test user account creation and authentication

#### Steps:
1. **Open Mobile App**
2. **Register New User**
   - Tap "Register" or "Sign Up"
   - Fill in: Name, Email, Password, Phone
   - Tap "Register"
   - ✅ **Expected:** Success message, auto-login

3. **Login with Existing User**
   - Use credentials: `testuser@gmail.com` / `password123`
   - Tap "Login"
   - ✅ **Expected:** Successful login, redirect to dashboard

4. **Test Login with Wrong Credentials**
   - Enter wrong password
   - Tap "Login"
   - ✅ **Expected:** Error message "Invalid email or password"

---

### **SCENARIO 2: Bank Account Management**
**Objective:** Test bank account creation, viewing, and management

#### Steps:
1. **Navigate to Accounts Section**
   - Go to "Accounts" or "Bank Accounts" tab
   - ✅ **Expected:** Shows existing accounts (if any)

2. **Create New Bank Account**
   - Tap "Add Account" or "+" button
   - Fill in:
     - Account Name: "My Salary Account"
     - Bank Name: "ICICI Bank"
     - Account Holder: "Your Name"
     - Account Number: "1234567890"
     - Account Type: "Savings"
     - Balance: "50000"
   - Tap "Save" or "Create"
   - ✅ **Expected:** Success message, account appears in list

3. **View Account Details**
   - Tap on created account
   - ✅ **Expected:** Shows account details with balance

4. **Edit Account**
   - Tap "Edit" on account
   - Change balance to "55000"
   - Tap "Save"
   - ✅ **Expected:** Updated balance reflects in account list

5. **Delete Account** (Optional)
   - Tap "Delete" on account
   - Confirm deletion
   - ✅ **Expected:** Account removed from list

---

### **SCENARIO 3: Transaction Management**
**Objective:** Test income and expense transactions

#### Steps:
1. **Navigate to Transactions**
   - Go to "Transactions" or "Add Transaction" tab

2. **Create Income Transaction**
   - Tap "Add Transaction" or "+"
   - Select "Income"
   - Fill in:
     - Amount: "25000"
     - Category: "Salary"
     - Description: "Monthly salary"
     - Date: Today's date
     - To Account: Select your bank account
   - Tap "Save"
   - ✅ **Expected:** Transaction created, account balance updated

3. **Create Expense Transaction**
   - Tap "Add Transaction" or "+"
   - Select "Expense"
   - Fill in:
     - Amount: "500"
     - Category: "Food & Dining"
     - Description: "Lunch with friends"
     - Date: Today's date
     - From Account: Select your bank account
   - Tap "Save"
   - ✅ **Expected:** Transaction created, account balance reduced

4. **View Transaction History**
   - Go to "All Transactions" or "History"
   - ✅ **Expected:** Shows both income and expense transactions
   - ✅ **Expected:** Transactions show correct amounts and categories

5. **Filter Transactions**
   - Try filtering by "Income" only
   - Try filtering by "Expense" only
   - Try filtering by category
   - ✅ **Expected:** Filters work correctly

---

### **SCENARIO 4: Financial Goals**
**Objective:** Test goal creation and tracking

#### Steps:
1. **Navigate to Goals**
   - Go to "Goals" tab

2. **Create New Goal**
   - Tap "Add Goal" or "+"
   - Fill in:
     - Goal Name: "Vacation Fund"
     - Description: "Save for summer vacation"
     - Target Amount: "100000"
     - Target Date: 6 months from now
     - Goal Type: "Savings"
   - Tap "Save"
   - ✅ **Expected:** Goal created successfully

3. **View Goal Progress**
   - Tap on created goal
   - ✅ **Expected:** Shows progress bar, current amount, target amount

4. **Add Money to Goal**
   - Tap "Add Money" or "Contribute"
   - Enter amount: "5000"
   - Select source account
   - Tap "Save"
   - ✅ **Expected:** Goal progress updated

5. **Edit Goal**
   - Tap "Edit" on goal
   - Change target amount to "150000"
   - Tap "Save"
   - ✅ **Expected:** Updated target amount reflects

---

### **SCENARIO 5: Budget Planning**
**Objective:** Test budget creation and tracking

#### Steps:
1. **Navigate to Budgets**
   - Go to "Budgets" tab

2. **Create New Budget**
   - Tap "Add Budget" or "+"
   - Fill in:
     - Budget Name: "Monthly Food Budget"
     - Amount: "8000"
     - Period: "Monthly"
     - Start Date: Beginning of current month
     - End Date: End of current month
   - Tap "Save"
   - ✅ **Expected:** Budget created successfully

3. **View Budget Status**
   - Tap on created budget
   - ✅ **Expected:** Shows budget vs actual spending

4. **Test Budget Tracking**
   - Create some food-related expense transactions
   - Go back to budget
   - ✅ **Expected:** Shows updated spending against budget

---

### **SCENARIO 6: Loan Management**
**Objective:** Test loan tracking functionality

#### Steps:
1. **Navigate to Loans**
   - Go to "Loans" tab

2. **Create New Loan**
   - Tap "Add Loan" or "+"
   - Fill in:
     - Loan Name: "Personal Loan"
     - Loan Type: "Personal"
     - Amount: "200000"
     - Interest Rate: "12.5" (percentage)
     - Term: "24" months
     - Start Date: Today
     - Lender: "ABC Bank"
   - Tap "Save"
   - ✅ **Expected:** Loan created successfully

3. **View Loan Details**
   - Tap on created loan
   - ✅ **Expected:** Shows loan details, monthly payment, remaining balance

4. **Make Loan Payment**
   - Tap "Make Payment"
   - Enter payment amount: "10000"
   - Select source account
   - Tap "Save"
   - ✅ **Expected:** Payment recorded, remaining balance updated

---

### **SCENARIO 7: Support Tickets**
**Objective:** Test support ticket system

#### Steps:
1. **Navigate to Support**
   - Go to "Support" or "Help" tab

2. **Create Support Ticket**
   - Tap "Create Ticket" or "+"
   - Fill in:
     - Subject: "App not syncing properly"
     - Description: "My transactions are not showing up in the app"
     - Category: "Technical"
     - Priority: "Medium"
   - Tap "Submit"
   - ✅ **Expected:** Ticket created, ticket number generated

3. **View Ticket Status**
   - Go to "My Tickets"
   - Tap on created ticket
   - ✅ **Expected:** Shows ticket details, status, messages

4. **Add Reply to Ticket**
   - Tap "Reply" or "Add Message"
   - Type: "Please provide more details about the sync issue"
   - Tap "Send"
   - ✅ **Expected:** Message added to ticket

---

### **SCENARIO 8: Admin Panel Testing**
**Objective:** Test admin panel functionality

#### Steps:
1. **Access Admin Panel**
   - Open browser: `http://localhost:3001`
   - Login with: `admin@expensetracker.com` / `admin123`
   - ✅ **Expected:** Successful login, dashboard loads

2. **View User Management**
   - Go to "Users" section
   - ✅ **Expected:** Shows list of registered users
   - Click on a user to view details
   - ✅ **Expected:** Shows user's accounts, transactions, goals

3. **View Support Tickets**
   - Go to "Support Tickets" section
   - ✅ **Expected:** Shows all support tickets
   - Click on a ticket
   - ✅ **Expected:** Shows ticket details and conversation

4. **Reply to Support Ticket**
   - In ticket details, type reply: "Thank you for reporting this. We're looking into the sync issue."
   - Click "Send Reply"
   - ✅ **Expected:** Reply sent successfully

5. **Test Admin Sign Out**
   - Click user menu in top-right
   - Click "Sign Out"
   - ✅ **Expected:** Redirected to login page

---

### **SCENARIO 9: Data Synchronization**
**Objective:** Test data sync between mobile app and backend

#### Steps:
1. **Create Data in Mobile App**
   - Create a new transaction in mobile app
   - Create a new goal in mobile app

2. **Check Admin Panel**
   - Go to admin panel
   - Check user details
   - ✅ **Expected:** New transaction and goal visible in admin panel

3. **Admin Panel Changes**
   - Reply to a support ticket in admin panel
   - Go back to mobile app
   - Check support ticket
   - ✅ **Expected:** Admin reply visible in mobile app

---

### **SCENARIO 10: Error Handling**
**Objective:** Test app behavior with invalid data

#### Steps:
1. **Invalid Login**
   - Try login with non-existent email
   - ✅ **Expected:** Proper error message

2. **Invalid Transaction**
   - Try creating transaction with negative amount
   - ✅ **Expected:** Validation error message

3. **Network Error**
   - Disconnect internet
   - Try to create transaction
   - ✅ **Expected:** Network error message
   - Reconnect internet
   - ✅ **Expected:** App recovers gracefully

---

## 🎯 Testing Checklist

### ✅ **Core Features**
- [ ] User registration works
- [ ] User login works
- [ ] Bank account creation works
- [ ] Bank account viewing works
- [ ] Bank account editing works
- [ ] Transaction creation works (income)
- [ ] Transaction creation works (expense)
- [ ] Transaction history displays correctly
- [ ] Goal creation works
- [ ] Goal tracking works
- [ ] Budget creation works
- [ ] Budget tracking works
- [ ] Loan creation works
- [ ] Loan payment tracking works
- [ ] Support ticket creation works
- [ ] Support ticket viewing works

### ✅ **Admin Panel**
- [ ] Admin login works
- [ ] User management works
- [ ] Support ticket management works
- [ ] Admin can reply to tickets
- [ ] Admin sign out works

### ✅ **Data Sync**
- [ ] Mobile app data appears in admin panel
- [ ] Admin panel changes appear in mobile app
- [ ] Real-time updates work

### ✅ **Error Handling**
- [ ] Invalid login shows proper error
- [ ] Invalid data shows validation errors
- [ ] Network errors handled gracefully

---

## 🚨 **If You Find Issues:**

1. **Note the exact error message**
2. **Note what you were trying to do**
3. **Note which screen/feature was involved**
4. **Take a screenshot if possible**

## 📞 **Support:**
If you encounter any issues during testing, please report them with:
- Device type (Android/iOS)
- App version
- Steps to reproduce
- Error messages
- Screenshots

---

**Happy Testing! 🎉**
