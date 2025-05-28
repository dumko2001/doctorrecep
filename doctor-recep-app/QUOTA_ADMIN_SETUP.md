# Quota System & Admin Dashboard Setup Guide

This guide explains how to set up and use the new quota system and admin dashboard for the Doctor Reception System.

## 🚀 Features Added

### 1. Doctor Quota System
- **Monthly AI Generation Limits**: Each doctor has a configurable monthly quota for AI summaries
- **Automatic Quota Tracking**: System tracks usage and prevents overuse
- **Monthly Reset**: Quotas automatically reset on the 1st of each month
- **Usage Analytics**: Detailed logging of all AI generations

### 2. Admin Dashboard
- **Doctor Management**: Approve/reject new doctor signups
- **Quota Management**: Set and modify doctor quotas
- **Usage Monitoring**: View system-wide statistics
- **Account Control**: Enable/disable doctor accounts

### 3. Approval Workflow
- **Pending Signups**: New doctors require admin approval
- **Controlled Access**: Only approved doctors can use the system
- **Audit Trail**: Track who approved which doctors

## 📋 Database Changes

### New Tables
1. **admins** - Admin user accounts
2. **usage_logs** - Detailed quota usage tracking

### Updated Tables
1. **doctors** - Added quota and approval fields:
   - `monthly_quota` (default: 100)
   - `quota_used` (default: 0)
   - `quota_reset_at` (auto-calculated)
   - `approved` (default: false for new signups)
   - `approved_by` (admin who approved)
   - `approved_at` (approval timestamp)

## 🛠️ Setup Instructions

### Step 1: Database Migration

Run the migration script on your Supabase database:

```sql
-- Execute the migration file
\i database/migrations/001_add_quota_and_admin_system.sql
```

Or apply the full schema:

```sql
-- Execute the updated schema
\i database/schema.sql
```

### Step 2: Create First Admin User

```bash
# Install dependencies if not already done
npm install

# Run the admin creation script
node scripts/create-admin.js
```

Follow the prompts to create your first admin user.

### Step 3: Environment Variables

Ensure these environment variables are set:

```env
# Existing variables
NEXT_PUBLIC_SUPABASE_URL=your_supabase_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SESSION_SECRET=your_session_secret

# Backend API
NEXT_PUBLIC_API_URL=http://localhost:3001
GEMINI_API_KEY=your_gemini_api_key
```

### Step 4: Update Supabase Functions (Optional)

For automatic monthly quota resets, you can set up a Supabase Edge Function:

```sql
-- Create a scheduled function to reset quotas monthly
SELECT cron.schedule(
  'reset-monthly-quotas',
  '0 0 1 * *', -- First day of every month at midnight
  'SELECT reset_all_quotas();'
);
```

## 🎯 Usage Guide

### For Admins

#### Accessing Admin Dashboard
1. Navigate to `/admin/login`
2. Login with your admin credentials
3. Access the dashboard at `/admin/dashboard`

#### Managing Doctors
- **Approve Signups**: Click the checkmark icon for pending doctors
- **Reject Signups**: Click the X icon to reject applications
- **Update Quotas**: Click the edit icon to modify monthly limits
- **Reset Quotas**: Click the refresh icon to reset current usage
- **Disable Accounts**: Click the ban icon to disable access

#### Monitoring Usage
- View system-wide statistics on the dashboard
- Monitor quota usage percentages
- Track AI generation trends

### For Doctors

#### New Signup Flow
1. Sign up at `/signup`
2. Wait for admin approval
3. Receive approval notification
4. Login and start using the system

#### Quota Monitoring
- View quota usage on the dashboard
- See remaining generations
- Get warnings when approaching limits
- Track reset dates

#### When Quota is Exceeded
- AI generation will be blocked
- Error message will be displayed
- Contact admin for quota increase
- Wait for monthly reset

## 🔧 Configuration

### Default Settings
- **New Doctor Quota**: 100 AI generations per month
- **Approval Required**: Yes (can be changed in signup logic)
- **Quota Reset**: 1st of every month
- **Admin Roles**: admin, super_admin

### Customization Options

#### Changing Default Quota
Update the default in the database schema:

```sql
ALTER TABLE doctors 
ALTER COLUMN monthly_quota SET DEFAULT 200;
```

#### Auto-Approval for Existing Doctors
To approve all existing doctors:

```sql
UPDATE doctors 
SET approved = TRUE, 
    approved_at = NOW() 
WHERE approved = FALSE;
```

#### Adjusting Quota Limits
Use the admin dashboard or direct SQL:

```sql
UPDATE doctors 
SET monthly_quota = 200 
WHERE id = 'doctor_uuid';
```

## 📊 Monitoring & Analytics

### Usage Logs
All quota-related actions are logged in the `usage_logs` table:
- AI generations
- Quota resets
- Quota updates
- Admin actions

### Key Metrics
- Total doctors
- Pending approvals
- System-wide quota usage
- AI generation trends
- Doctor activity levels

## 🚨 Troubleshooting

### Common Issues

#### 1. Quota Check Fails
```
Error: Quota exceeded
```
**Solution**: Check if doctor is approved and has remaining quota

#### 2. Admin Login Issues
```
Error: Invalid credentials
```
**Solution**: Verify admin user exists in `admins` table

#### 3. Database Function Errors
```
Error: function check_and_update_quota does not exist
```
**Solution**: Run the migration script to create database functions

### Database Queries for Debugging

```sql
-- Check doctor quota status
SELECT id, name, email, monthly_quota, quota_used, approved 
FROM doctors 
WHERE email = 'doctor@example.com';

-- View recent usage logs
SELECT * FROM usage_logs 
ORDER BY created_at DESC 
LIMIT 10;

-- Check admin users
SELECT id, name, email, role 
FROM admins;
```

## 🔐 Security Considerations

1. **Admin Access**: Admin routes are protected by separate authentication
2. **Quota Enforcement**: Server-side validation prevents quota bypass
3. **Audit Trail**: All admin actions are logged
4. **Role-Based Access**: Different admin roles for different permissions

## 📈 Future Enhancements

Potential improvements to consider:
- Email notifications for quota warnings
- Tiered pricing plans
- Usage analytics dashboard
- Bulk doctor management
- API rate limiting
- WhatsApp integration for notifications

## 🆘 Support

If you encounter issues:
1. Check the troubleshooting section
2. Verify database migration completed
3. Ensure all environment variables are set
4. Check Supabase logs for errors
5. Review the usage logs table for debugging

For additional support, refer to the main project documentation or contact the development team.
