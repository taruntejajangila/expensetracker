// Simple script to create custom_notifications table
// This will be run when the server starts

const createCustomNotificationsTable = `
  CREATE TABLE IF NOT EXISTS custom_notifications (
    id VARCHAR(255) PRIMARY KEY,
    title VARCHAR(255) NOT NULL,
    body VARCHAR(500) NOT NULL,
    type VARCHAR(50) NOT NULL,
    content TEXT NOT NULL,
    author VARCHAR(255),
    image_url VARCHAR(2048),
    action_button_text VARCHAR(100),
    action_button_url VARCHAR(2048),
    action_button_action VARCHAR(100),
    tags JSONB,
    created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP
  )
`;

console.log('Custom notifications table creation SQL:');
console.log(createCustomNotificationsTable);

module.exports = createCustomNotificationsTable;
