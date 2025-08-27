# Supabase Authentication Setup

This project has been integrated with Supabase email+password authentication. Follow these steps to set up and use the authentication system.

## Prerequisites

1. A Supabase project (create one at [supabase.com](https://supabase.com))
2. Node.js and npm installed

## Installation

The required dependencies have already been installed:
- `@supabase/supabase-js` - Supabase client library
- `react-router-dom` - React routing

## Environment Configuration

1. Copy the example environment file:
   ```bash
   cp env.supabase.example .env.local
   ```

2. Edit `.env.local` and add your Supabase credentials:
   ```env
   REACT_APP_SUPABASE_URL=https://your-project-ref.supabase.co
   REACT_APP_SUPABASE_ANON_KEY=your-anon-public-key
   ```

   You can find these values in your Supabase project dashboard under Settings > API.

## Supabase Project Setup

1. **Enable Email Authentication**:
   - Go to Authentication > Settings in your Supabase dashboard
   - Enable "Enable email confirmations" if you want email verification
   - Set "Enable email change confirmations" to true for security

2. **Configure Email Templates** (Optional):
   - Go to Authentication > Email Templates
   - Customize the password reset and confirmation emails

3. **Create a User** (for testing):
   - Go to Authentication > Users in your Supabase dashboard
   - Click "Add user" and create a test account
   - Or use the signup flow if enabled

## Features

### Authentication Flow
- **Login**: Email/password authentication
- **Protected Routes**: All dashboard routes require authentication
- **Password Reset**: Forgot password flow with email reset link
- **Change Password**: 2FA email OTP for authenticated users
- **Auto-redirect**: Users are redirected based on authentication status

### Routes
- `/login` - Login page (public)
- `/forgot` - Forgot password page (public)
- `/reset` - Password reset page (public, accessed via email link)
- `/` - Home page (protected)
- `/dashboard` - Main dashboard (protected)
- `/change-password` - Change password with 2FA (protected)

### Security Features
- **Session Management**: Automatic session handling with Supabase
- **Route Protection**: Unauthenticated users are redirected to login
- **2FA Password Change**: Email OTP required for password changes
- **Secure Logout**: Proper session cleanup on logout

## Usage

1. **Start the application**:
   ```bash
   npm start
   ```

2. **Navigate to the app**:
   - The app will redirect to `/login` if not authenticated
   - After successful login, you'll be redirected to `/` (Home)

3. **Access the dashboard**:
   - Click "Go to Dashboard" from the Home page
   - Or navigate directly to `/dashboard`

4. **Change password**:
   - Navigate to `/change-password`
   - Enter new password and confirm
   - Check email for OTP code
   - Enter OTP to complete password change

5. **Reset password** (if forgotten):
   - Go to `/forgot`
   - Enter email address
   - Check email for reset link
   - Click link and set new password

## Troubleshooting

### Common Issues

1. **Environment Variables Not Loading**:
   - Ensure `.env.local` file exists in the project root
   - Restart the development server after adding environment variables
   - Check that variable names start with `REACT_APP_`

2. **Supabase Connection Errors**:
   - Verify your Supabase URL and anon key are correct
   - Check that your Supabase project is active
   - Ensure your IP is not blocked by Supabase

3. **Authentication Not Working**:
   - Check browser console for errors
   - Verify Supabase authentication is enabled in your project
   - Ensure email templates are configured if using email verification

### Development Tips

- Use browser dev tools to monitor network requests
- Check Supabase dashboard logs for authentication events
- Test with multiple browser sessions to verify session isolation

## Security Notes

- The anon key is safe to use in client-side code
- All sensitive operations require user authentication
- Password changes require email OTP verification
- Sessions are automatically managed by Supabase

## Next Steps

After setting up authentication:
1. Test the login flow with a test user
2. Verify protected routes work correctly
3. Test password reset and change flows
4. Customize email templates if needed
5. Add additional security features as required

For more information, refer to the [Supabase documentation](https://supabase.com/docs).
