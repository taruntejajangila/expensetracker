# Production Branch Workflow

## Branch Structure

```
master (Production)
  ↓
  ↓ Create feature branch from here
  ↓
feature/feature-name
  ↓ Develop & test locally
  ↓
release (Release Branch)
  ↓ Push code here after internal testing
  ↓
master (Production) ← Merge release branch here
```

---

## Workflow Steps

### Step 1: Create Feature Branch from Production (Master)

```bash
# Always start from production
git checkout master
git pull origin master

# Create your feature branch
git checkout -b feature/ad-retry-fixes
```

### Step 2: Develop & Test Locally

- Make your code changes
- Test on your local device
- Ensure everything works

### Step 3: Commit Your Changes

```bash
git add .
git commit -m "feat: add ad retry mechanism"
```

### Step 4: Push to Release Branch

After internal testing, merge your feature branch to release:

```bash
# Switch to release branch
git checkout release
git pull origin release

# Merge your feature branch
git merge feature/ad-retry-fixes

# Push to release branch
git push origin release
```

### Step 5: Release to Production (Master)

When ready to release to production:

```bash
# Switch to master (production)
git checkout master
git pull origin master

# Merge release branch
git merge release

# Update version in app.json
# "version": "1.0.1" → "1.0.2"
# "versionCode": 2 → 3

git add ExpenseTrackerExpo/app.json
git commit -m "chore: bump version to 1.0.2"

# Tag release
git tag -a v1.0.2 -m "Release v1.0.2"

# Push to production
git push origin master
git push origin v1.0.2
```

### Step 6: Build APK

```bash
cd ExpenseTrackerExpo
npx eas-cli build --platform android --profile production --local
```

---

## Setup Instructions

### Initial Setup (One Time)

```bash
# 1. Create release branch from master
git checkout master
git checkout -b release
git push origin release

# 2. Set release as tracking branch
git branch --set-upstream-to=origin/release release
```

---

## Complete Example Workflow

### Example: Adding Ad Retry Fixes

```bash
# Step 1: Start from production
git checkout master
git pull origin master

# Step 2: Create feature branch
git checkout -b feature/ad-retry-fixes

# Step 3: Make changes (your ad fixes)
# ... edit files ...

# Step 4: Commit
git add .
git commit -m "fix: add retry mechanism for ad loading"

# Step 5: Test locally (on device)

# Step 6: Merge to release branch
git checkout release
git pull origin release
git merge feature/ad-retry-fixes
git push origin release

# Step 7: When ready for production
git checkout master
git pull origin master
git merge release

# Step 8: Update version
# Edit ExpenseTrackerExpo/app.json:
#   "version": "1.0.1" → "1.0.2"
#   "versionCode": 2 → 3

git add ExpenseTrackerExpo/app.json
git commit -m "chore: bump version to 1.0.2"
git tag -a v1.0.2 -m "Release v1.0.2 - Ad retry fixes"
git push origin master
git push origin v1.0.2

# Step 9: Build APK
cd ExpenseTrackerExpo
npx eas-cli build --platform android --profile production --local

# Step 10: Delete feature branch (cleanup)
git branch -d feature/ad-retry-fixes
```

---

## Important Rules

1. **Never work directly on master** - Always create feature branches
2. **Master = Production** - Only merge from release branch
3. **Test before release** - Always test locally before pushing to release
4. **Update version** - Always update version before merging to master
5. **Tag releases** - Always tag when merging to master

---

## Branch Purposes

- **master**: Production code (live app)
- **release**: Staging area (tested code ready for production)
- **feature/***: Development branches (your work in progress)

---

## Quick Reference

```bash
# Start new feature
git checkout master && git pull
git checkout -b feature/name

# After testing, push to release
git checkout release && git pull
git merge feature/name
git push origin release

# Deploy to production
git checkout master && git pull
git merge release
# Update version & tag
git push origin master --tags
```

