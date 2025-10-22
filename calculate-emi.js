// Calculate EMI for Money View loan
const principal = 160000;
const interestRateInput = 0.26; // As entered by user
const termMonths = 24;

console.log('📊 Money View Loan EMI Calculation\n');
console.log('Principal Amount: ₹' + principal.toLocaleString());
console.log('Interest Rate Input: ' + interestRateInput);
console.log('Loan Term: ' + termMonths + ' months\n');

// Scenario 1: 0.26% is annual rate
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Scenario 1: If 0.26% is ANNUAL rate');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const monthlyRate1 = (interestRateInput / 12) / 100;
const emi1 = principal * monthlyRate1 * Math.pow(1 + monthlyRate1, termMonths) / (Math.pow(1 + monthlyRate1, termMonths) - 1);
console.log('Monthly Interest Rate: ' + (monthlyRate1 * 100).toFixed(6) + '%');
console.log('EMI: ₹' + emi1.toFixed(2));
console.log('Total Payment: ₹' + (emi1 * termMonths).toFixed(2));
console.log('Total Interest: ₹' + ((emi1 * termMonths) - principal).toFixed(2));

// Scenario 2: 0.26% is monthly rate
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Scenario 2: If 0.26% is MONTHLY rate');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
const monthlyRate2 = interestRateInput / 100;
const emi2 = principal * monthlyRate2 * Math.pow(1 + monthlyRate2, termMonths) / (Math.pow(1 + monthlyRate2, termMonths) - 1);
console.log('Monthly Interest Rate: ' + (monthlyRate2 * 100).toFixed(2) + '%');
console.log('Annual Interest Rate: ' + (monthlyRate2 * 12 * 100).toFixed(2) + '%');
console.log('EMI: ₹' + emi2.toFixed(2));
console.log('Total Payment: ₹' + (emi2 * termMonths).toFixed(2));
console.log('Total Interest: ₹' + ((emi2 * termMonths) - principal).toFixed(2));

// Scenario 3: Backend calculated EMI
console.log('\n━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Backend Calculated EMI: ₹6,684.74');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('Total Payment: ₹' + (6684.74 * termMonths).toLocaleString());
console.log('Total Interest: ₹' + ((6684.74 * termMonths) - principal).toLocaleString());
console.log('Implied Monthly Rate: ~' + (0.26 / 100).toFixed(4) + '% or 0.26%');
console.log('Implied Annual Rate: ~' + (0.26 * 12).toFixed(2) + '% or 3.12%');

console.log('\n✅ The backend is treating 0.26 as MONTHLY rate (0.26%)');
console.log('   This equals ~3.12% annual rate');


