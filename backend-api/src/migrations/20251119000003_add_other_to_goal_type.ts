import { PoolClient } from 'pg';

const CONSTRAINT_NAME = 'goals_goal_type_check';
const TABLE_NAME = 'goals';
const VALID_GOAL_TYPES_WITH_OTHER = `('savings', 'debt_payoff', 'purchase', 'emergency_fund', 'other')`;
const VALID_GOAL_TYPES_ORIGINAL = `('savings', 'debt_payoff', 'purchase', 'emergency_fund')`;

const getConstraintDefinition = async (client: PoolClient): Promise<string | null> => {
  const result = await client.query<{ definition: string }>(
    `
      SELECT pg_get_constraintdef(oid) AS definition
      FROM pg_constraint
      WHERE conname = $1
        AND conrelid = $2::regclass
        AND contype = 'c'
    `,
    [CONSTRAINT_NAME, TABLE_NAME]
  );

  return result.rows[0]?.definition ?? null;
};

const dropConstraintIfExists = async (client: PoolClient): Promise<void> => {
  await client.query(
    `
      ALTER TABLE ${TABLE_NAME}
      DROP CONSTRAINT IF EXISTS ${CONSTRAINT_NAME}
    `
  );
};

const addConstraint = async (client: PoolClient, allowedTypes: string): Promise<void> => {
  await client.query(
    `
      ALTER TABLE ${TABLE_NAME}
      ADD CONSTRAINT ${CONSTRAINT_NAME}
      CHECK (goal_type IN ${allowedTypes})
    `
  );
};

export const up = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔧 Adding "other" to goal_type constraint...');

    const currentDefinition = await getConstraintDefinition(client);

    if (currentDefinition?.includes("'other'")) {
      console.log('✅ "other" already in goal_type constraint, skipping migration');
      return;
    }

    await dropConstraintIfExists(client);
    await addConstraint(client, VALID_GOAL_TYPES_WITH_OTHER);

    console.log('✅ "other" added to goal_type constraint');
  } catch (error) {
    console.error('❌ Error updating goal_type constraint:', error);
    throw error;
  }
};

export const down = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔄 Removing "other" from goal_type constraint...');

    const currentDefinition = await getConstraintDefinition(client);

    if (!currentDefinition?.includes("'other'")) {
      console.log('ℹ️  "other" not present in constraint, nothing to revert');
      return;
    }

    await dropConstraintIfExists(client);
    await addConstraint(client, VALID_GOAL_TYPES_ORIGINAL);

    console.log('✅ "other" removed from goal_type constraint');
  } catch (error) {
    console.error('❌ Error reverting goal_type constraint:', error);
    throw error;
  }
};

