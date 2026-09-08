function fmtCurrency(n) {
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: 2 });
}

function calcCompoundInterest() {
  const principal = parseFloat(document.getElementById('ci-principal').value) || 0;
  const rate = (parseFloat(document.getElementById('ci-rate').value) || 0) / 100;
  const years = parseFloat(document.getElementById('ci-years').value) || 0;
  const n = parseFloat(document.getElementById('ci-compounds').value) || 1;

  const futureValue = principal * Math.pow(1 + rate / n, n * years);
  const gain = futureValue - principal;

  document.getElementById('ci-output').textContent = fmtCurrency(futureValue);
  document.getElementById('ci-detail').textContent =
    `Growth of ${fmtCurrency(gain)} over ${years} year${years === 1 ? '' : 's'}`;
  document.getElementById('ci-result').classList.add('show');
}

function calcLoanPayment() {
  const principal = parseFloat(document.getElementById('ln-amount').value) || 0;
  const annualRate = (parseFloat(document.getElementById('ln-rate').value) || 0) / 100;
  const years = parseFloat(document.getElementById('ln-years').value) || 0;
  const months = years * 12;
  const monthlyRate = annualRate / 12;

  let payment;
  if (monthlyRate === 0) {
    payment = months > 0 ? principal / months : 0;
  } else {
    payment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
              (Math.pow(1 + monthlyRate, months) - 1);
  }

  const totalPaid = payment * months;
  const totalInterest = totalPaid - principal;

  document.getElementById('ln-output').textContent = fmtCurrency(payment) + ' / month';
  document.getElementById('ln-detail').textContent =
    `Total interest paid over ${years} year${years === 1 ? '' : 's'}: ${fmtCurrency(totalInterest)}`;
  document.getElementById('ln-result').classList.add('show');
}

function standardPMT(monthlyRate, months, principal) {
  if (monthlyRate === 0) return months > 0 ? principal / months : 0;
  return principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
    (Math.pow(1 + monthlyRate, months) - 1);
}

function calcMortgage() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;
  const price = g('mg-price');
  const down = g('mg-down');
  const rate = g('mg-rate') / 100;
  const years = g('mg-years');
  const annualTax = g('mg-tax');
  const annualInsurance = g('mg-insurance');
  const income = g('mg-income');

  const loanAmount = Math.max(price - down, 0);
  const months = years * 12;
  const monthlyRate = rate / 12;
  const piPayment = standardPMT(monthlyRate, months, loanAmount);
  const monthlyTaxInsurance = (annualTax + annualInsurance) / 12;
  const totalPayment = piPayment + monthlyTaxInsurance;
  const pctIncome = income > 0 ? (totalPayment / income) * 100 : 0;

  document.getElementById('mg-total-payment').textContent = fmtCurrency(totalPayment) + ' / month';
  document.getElementById('mg-pi').textContent = fmtCurrency(piPayment);
  document.getElementById('mg-ti').textContent = fmtCurrency(monthlyTaxInsurance);
  document.getElementById('mg-pct-income').textContent = pctIncome.toFixed(1) + '%';

  const note = document.getElementById('mg-affordability-note');
  if (income > 0) {
    if (pctIncome <= 28) {
      note.textContent = 'This is within the commonly cited 28% guideline for housing costs relative to gross income.';
    } else {
      note.textContent = 'This is above the commonly cited 28% guideline for housing costs relative to gross income, lenders may still approve it depending on your other debts.';
    }
  } else {
    note.textContent = '';
  }
  document.getElementById('mg-result').classList.add('show');
}

function calcDebtPayoff() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;
  const balance = g('dc-balance');
  const annualRate = g('dc-rate') / 100;
  const payment = g('dc-payment');
  const monthlyRate = annualRate / 12;

  const warning = document.getElementById('dc-warning');
  const minInterestOnlyPayment = balance * monthlyRate;

  if (payment <= minInterestOnlyPayment) {
    document.getElementById('dc-months').textContent = 'Never, at this payment';
    document.getElementById('dc-interest').textContent = '\u2014';
    document.getElementById('dc-total').textContent = '\u2014';
    warning.textContent = 'This payment doesn\u2019t even cover the interest that accrues each month, so the balance will grow instead of shrinking. Increase the payment above ' + fmtCurrency(minInterestOnlyPayment, 2) + ' to make progress.';
    document.getElementById('dc-result').classList.add('show');
    return;
  }

  let months;
  if (monthlyRate === 0) {
    months = balance / payment;
  } else {
    months = -Math.log(1 - (balance * monthlyRate) / payment) / Math.log(1 + monthlyRate);
  }
  const totalPaid = payment * months;
  const totalInterest = totalPaid - balance;
  const years = Math.floor(months / 12);
  const remMonths = Math.round(months % 12);

  document.getElementById('dc-months').textContent =
    (years > 0 ? `${years} yr ` : '') + `${remMonths} mo`;
  document.getElementById('dc-interest').textContent = fmtCurrency(totalInterest);
  document.getElementById('dc-total').textContent = fmtCurrency(totalPaid);
  warning.textContent = totalInterest > balance
    ? 'At this payment, you\u2019ll pay more in interest than the original balance itself, paying more each month would save a lot here.'
    : '';
  document.getElementById('dc-result').classList.add('show');
}

function calcAutoLoan() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;
  const price = g('al-price');
  const down = g('al-down');
  const tradein = g('al-tradein');
  const taxRate = g('al-tax') / 100;
  const rate = g('al-rate') / 100;
  const years = g('al-years');

  const taxableAmount = Math.max(price - tradein, 0);
  const tax = taxableAmount * taxRate;
  const amountFinanced = Math.max(price + tax - down - tradein, 0);
  const months = years * 12;
  const monthlyRate = rate / 12;
  const payment = standardPMT(monthlyRate, months, amountFinanced);
  const totalPaid = payment * months;
  const totalInterest = totalPaid - amountFinanced;

  document.getElementById('al-payment').textContent = fmtCurrency(payment) + ' / month';
  document.getElementById('al-financed').textContent = fmtCurrency(amountFinanced);
  document.getElementById('al-interest').textContent = fmtCurrency(totalInterest);
  document.getElementById('al-result').classList.add('show');
}
