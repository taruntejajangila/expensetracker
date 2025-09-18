-- Migration: Create notification_tokens table for push notifications
-- Created: 2025-01-09
-- Description: Table to store push notification tokens for users

CREATE TABLE IF NOT EXISTS notification_tokens (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    token TEXT NOT NULL,
    platform VARCHAR(10) NOT NULL CHECK (platform IN ('ios', 'android')),
    device_id VARCHAR(255),
    is_active BOOLEAN NOT NULL DEFAULT true,
    created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
    
    -- Ensure unique token per user
    UNIQUE(user_id, token)
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_notification_tokens_user_id ON notification_tokens(user_id);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_active ON notification_tokens(is_active);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_platform ON notification_tokens(platform);
CREATE INDEX IF NOT EXISTS idx_notification_tokens_updated_at ON notification_tokens(updated_at);

-- Create trigger to update updated_at timestamp
CREATE OR REPLACE FUNCTION update_notification_tokens_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER trigger_update_notification_tokens_updated_at
    BEFORE UPDATE ON notification_tokens
    FOR EACH ROW
    EXECUTE FUNCTION update_notification_tokens_updated_at();

-- Add comments for documentation
COMMENT ON TABLE notification_tokens IS 'Stores push notification tokens for users to receive notifications';
COMMENT ON COLUMN notification_tokens.user_id IS 'Reference to the user who owns this token';
COMMENT ON COLUMN notification_tokens.token IS 'Expo push notification token';
COMMENT ON COLUMN notification_tokens.platform IS 'Platform type: ios or android';
COMMENT ON COLUMN notification_tokens.device_id IS 'Optional device identifier';
COMMENT ON COLUMN notification_tokens.is_active IS 'Whether this token is currently active and should receive notifications';
COMMENT ON COLUMN notification_tokens.created_at IS 'When this token was first registered';
COMMENT ON COLUMN notification_tokens.updated_at IS 'When this token was last updated';

-- Insert sample data (optional - for testing)
-- INSERT INTO notification_tokens (user_id, token, platform, device_id) 
-- SELECT 
--     u.id,
--     'ExponentPushToken[test-token-' || u.id || ']',
--     'android',
--     'test-device-' || u.id
-- FROM users u 
-- WHERE u.email = 'admin@expensetracker.com'
-- ON CONFLICT (user_id, token) DO NOTHING;
