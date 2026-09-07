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
