import { PoolClient } from 'pg';

const CONSTRAINT_NAME = 'loans_loan_type_check';
const TABLE_NAME = 'loans';
const VALID_LOAN_TYPES = `('Personal Loan', 'Home Loan', 'Car Loan', 'Business Loan', 'Gold Loan', 'Education Loan', 'Private Money Lending', 'Other')`;

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
      CHECK (loan_type IN ${allowedTypes})
    `
  );
};

export const up = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔧 Fixing loan_type constraint...');

    const currentDefinition = await getConstraintDefinition(client);

    // Check if constraint already has all valid values
    const hasAllTypes = VALID_LOAN_TYPES.split(',').every(type => 
      currentDefinition?.includes(type.trim().replace(/['()]/g, ''))
    );

    if (hasAllTypes && currentDefinition) {
      console.log('✅ Loan type constraint already correct, skipping migration');
      return;
    }

    await dropConstraintIfExists(client);
    await addConstraint(client, VALID_LOAN_TYPES);

    console.log('✅ Loan type constraint updated successfully');
  } catch (error) {
    console.error('❌ Error fixing loan_type constraint:', error);
    throw error;
  }
};

export const down = async (client: PoolClient): Promise<void> => {
  try {
    console.log('🔄 Reverting loan_type constraint...');

    await dropConstraintIfExists(client);
    await addConstraint(client, VALID_LOAN_TYPES);

    console.log('✅ Loan type constraint reverted');
  } catch (error) {
    console.error('❌ Error reverting loan_type constraint:', error);
    throw error;
  }
};

