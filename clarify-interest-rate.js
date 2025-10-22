// EMI Calculation for Money View Loan
const principal = 160000;
const termMonths = 24;

console.log('📊 Money View Loan - Interest Rate Comparison\n');
console.log('Principal: ₹' + principal.toLocaleString());
console.log('Term: ' + termMonths + ' months (2 years)\n');

console.log('═══════════════════════════════════════════════════════');
console.log('WHAT YOU SHOULD ENTER: 26 (for 26% per annum)');
console.log('═══════════════════════════════════════════════════════\n');

// Correct calculation: 26% per annum
const annualRate = 26; // Enter as 26, not 0.26
const monthlyRate = annualRate / 12 / 100; // 26% ÷ 12 months ÷ 100
const emi = principal * monthlyRate * Math.pow(1 + monthlyRate, termMonths) / (Math.pow(1 + monthlyRate, termMonths) - 1);

console.log('✅ CORRECT CALCULATION (26% per annum):');
console.log('   Annual Interest Rate: 26%');
console.log('   Monthly Interest Rate: ' + (monthlyRate * 100).toFixed(4) + '% (2.1667%)');
console.log('   EMI: ₹' + emi.toFixed(2));
console.log('   Total Payment: ₹' + (emi * termMonths).toFixed(2));
console.log('   Total Interest: ₹' + ((emi * termMonths) - principal).toFixed(2));

console.log('\n═══════════════════════════════════════════════════════');
console.log('WHAT YOU ENTERED: 0.26 (which means 0.26% per annum)');
console.log('═══════════════════════════════════════════════════════\n');

// What you actually entered: 0.26% per annum
const wrongAnnualRate = 0.26;
const wrongMonthlyRate = wrongAnnualRate / 12 / 100;
const wrongEmi = principal * wrongMonthlyRate * Math.pow(1 + wrongMonthlyRate, termMonths) / (Math.pow(1 + wrongMonthlyRate, termMonths) - 1);

console.log('❌ CURRENT CALCULATION (0.26% per annum):');
console.log('   Annual Interest Rate: 0.26%');
console.log('   Monthly Interest Rate: ' + (wrongMonthlyRate * 100).toFixed(6) + '%');
console.log('   EMI: ₹' + wrongEmi.toFixed(2));
console.log('   Total Payment: ₹' + (wrongEmi * termMonths).toFixed(2));
console.log('   Total Interest: ₹' + ((wrongEmi * termMonths) - principal).toFixed(2));

console.log('\n🎯 SUMMARY:');
console.log('━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━');
console.log('To get 26% per annum interest rate:');
console.log('  ➜ Enter: 26 (not 0.26)');
console.log('  ➜ Expected EMI: ₹' + emi.toFixed(2));
console.log('\nYour current entry (0.26):');
console.log('  ➜ Calculates as: 0.26% per annum');
console.log('  ➜ Current EMI: ₹' + wrongEmi.toFixed(2));
console.log('\n💡 Difference: ₹' + (emi - wrongEmi).toFixed(2) + ' per month');


