# 🔍 Loan Type Verification - Mobile App vs Backend

**Date:** October 21, 2025  
**Issue:** Loan types mismatch between mobile app and backend

---

## 🎯 **Current Situation from Railway Logs:**

```
Error: new row for relation "loans" violates check constraint "loans_loan_type_check"
Failing row: loan_type: "other"
```

**Two Problems Identified:**
1. ❌ Railway database doesn't allow loan_type = 'other'
2. ❌ Interest rate sent as `0.26` instead of `26`

---

## 📱 **Mobile App - AddLoanScreen.tsx**

### Loan Types Offered to User (Line 253):
```typescript
['Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 
 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other']
```

### What Gets Sent (Line 196):
```typescript
const loanData = {
  type: type,  // This sends: "Car Loan", "Home Loan", etc. (display names!)
  // ...
};

await LoanService.addLoan(loanData);
```

---

## 🔄 **Mobile App - LoanService.ts Mapping**

### Mapping Logic (Lines 117-121):
```typescript
loanType: loan.type === 'personal' ? 'personal' :   ← Expects lowercase 'personal'
         loan.type === 'mortgage' || loan.type === 'home' ? 'home' :
         loan.type === 'auto' || loan.type === 'car' ? 'car' :
         loan.type === 'business' ? 'business' :
         loan.type === 'student' ? 'student' : 'other',
```

**Problem:** 
- Expects: `'personal'`, `'home'`, `'car'`, `'auto'`, `'business'`, `'student'`
- Receives: `'Car Loan'`, `'Home Loan'`, `'Personal Loan'`, `'Other'`
- Result: **ALWAYS maps to 'other'** ❌

---

## 🖥️ **Backend - database.ts**

### Current Constraint (Line 263):
```sql
CHECK (loan_type IN ('personal', 'auto', 'mortgage', 'student', 'credit_card', 'business'))
```

**Allowed Types:**
- ✅ 'personal'
- ✅ 'auto'
- ✅ 'mortgage'
- ✅ 'student'
- ✅ 'credit_card'
- ✅ 'business'
- ❌ 'other' ← NOT ALLOWED!

---

## 🔴 **THE PROBLEM:**

### Flow Breakdown:

1. **User selects:** "Car Loan" in mobile app
2. **AddLoanScreen sends:** `type: "Car Loan"`
3. **LoanService.addLoan receives:** `loan.type = "Car Loan"`
4. **Mapping check:** `loan.type === 'auto'` → FALSE (it's "Car Loan", not "auto")
5. **Mapping check:** `loan.type === 'car'` → FALSE (it's "Car Loan", not "car")
6. **Falls through to:** `'other'`
7. **Backend receives:** `loanType: 'other'`
8. **Database rejects:** ❌ 'other' not in CHECK constraint!

---

## ✅ **SOLUTIONS:**

### **Solution 1: Fix Mobile App Mapping (RECOMMENDED)**

Update `AddLoanScreen.tsx` to send correct backend values:

```typescript
// Map display name to backend type
const mapLoanType = (displayType: string): string => {
  const typeMap: {[key: string]: string} = {
    'Personal Loan': 'personal',
    'Home Loan': 'mortgage',
    'Car Loan': 'auto',
    'Business Loan': 'business',
    'Gold Loan': 'other',
    'Education Loan': 'student',
    'Private Money Lending': 'other',
    'Other': 'other'
  };
  return typeMap[displayType] || 'other';
};

const loanData = {
  type: mapLoanType(type), // Now sends: 'auto', 'personal', 'mortgage', etc.
  // ...
};
```

### **Solution 2: Update Backend Constraint**

Add 'other' to the allowed types in `database.ts` (Line 263):

```sql
CHECK (loan_type IN ('personal', 'auto', 'mortgage', 'student', 'credit_card', 'business', 'other'))
```

**We need BOTH solutions!**

---

## 📊 **Mobile App to Backend Mapping Table:**

| Mobile App Display | Should Map To | Currently Maps To |
|-------------------|---------------|-------------------|
| Personal Loan | `'personal'` ✅ | `'other'` ❌ |
| Home Loan | `'mortgage'` ✅ | `'other'` ❌ |
| Car Loan | `'auto'` ✅ | `'other'` ❌ |
| Business Loan | `'business'` ✅ | `'other'` ❌ |
| Gold Loan | `'other'` ✅ | `'other'` ✅ |
| Education Loan | `'student'` ✅ | `'other'` ❌ |
| Private Money Lending | `'other'` ✅ | `'other'` ✅ |
| Other | `'other'` ✅ | `'other'` ✅ |

---

## 🎯 **Backend Allowed Types:**

### **Currently in Railway Database:**
```sql
'personal', 'auto', 'mortgage', 'student', 'credit_card', 'business'
```
❌ Missing: 'other'

### **After Fix:**
```sql
'personal', 'auto', 'mortgage', 'student', 'credit_card', 'business', 'other'
```
✅ Includes: 'other'

---

## 🔧 **Files That Need Fixing:**

### 1. **backend-api/src/config/database.ts** ✅ ALREADY FIXED LOCALLY
```typescript
// Line 263: Added 'other' to constraint
CHECK (loan_type IN ('personal', 'auto', 'mortgage', 'student', 'credit_card', 'business', 'other'))
```

### 2. **ExpenseTrackerExpo/screens/AddLoanScreen.tsx** ❌ NEEDS FIX
```typescript
// Need to add mapLoanType function
// Change line 196 from: type: type
// To: type: mapLoanType(type)
```

### 3. **Railway Database** ❌ NEEDS MANUAL FIX
```sql
-- Need to run this SQL on Railway:
ALTER TABLE loans DROP CONSTRAINT IF EXISTS loans_loan_type_check;
ALTER TABLE loans ADD CONSTRAINT loans_loan_type_check 
  CHECK (loan_type IN ('personal', 'auto', 'mortgage', 'student', 'credit_card', 'business', 'other'));
```

---

## 🚨 **Immediate Action Required:**

1. ✅ Fix `database.ts` - Done locally
2. ⚠️ Fix `AddLoanScreen.tsx` - Need to do now
3. ⚠️ Update Railway database constraint - Need to do now
4. ⚠️ Push changes to GitHub
5. ⚠️ Railway will auto-deploy

---

## 💡 **Why This Happened:**

- Mobile app uses **user-friendly display names** ("Car Loan")
- Backend expects **code values** ('auto')
- Mapping logic in `LoanService.ts` was checking for lowercase values
- But `AddLoanScreen.tsx` was sending capitalized display names
- **All loans were mapping to 'other'**
- **Railway database doesn't allow 'other'**
- **Result: All loan creations fail!** ❌

---

**Status:** Issue identified. Fixes ready to apply.

