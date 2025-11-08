import { PoolClient } from 'pg';

const CONSTRAINT_NAME = 'bank_accounts_account_type_check';
const TABLE_NAME = 'bank_accounts';
const ACCOUNT_TYPES_WITH_WALLET = `('checking', 'savings', 'investment', 'wallet')`;
const ACCOUNT_TYPES_ORIGINAL = `('checking', 'savings', 'investment')`;

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
      CHECK (account_type IN ${allowedTypes})
    `
  );
};

export const up = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔄 Ensuring wallet account type is allowed for bank_accounts...');

    const currentDefinition = await getConstraintDefinition(client);

    if (currentDefinition?.includes('wallet')) {
      console.log('✅ Wallet account type already allowed, skipping migration');
      return;
    }

    await dropConstraintIfExists(client);
    await addConstraint(client, ACCOUNT_TYPES_WITH_WALLET);

    console.log('✅ Wallet account type added to bank_accounts constraint');
  } catch (error) {
    console.error('❌ Error adding wallet account type:', error);
    throw error;
  }
};

export const down = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔄 Reverting wallet account type change for bank_accounts...');

    const currentDefinition = await getConstraintDefinition(client);

    if (!currentDefinition?.includes('wallet')) {
      console.log('ℹ️  Wallet account type not present, nothing to revert');
      return;
    }

    await dropConstraintIfExists(client);
    await addConstraint(client, ACCOUNT_TYPES_ORIGINAL);

    console.log('✅ Wallet account type removed from bank_accounts constraint');
  } catch (error) {
    console.error('❌ Error removing wallet account type:', error);
    throw error;
  }
};
