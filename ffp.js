/* ============================================================
   1. Retirement Budget  →  feeds Savings Plan's monthly need
   ============================================================ */
function calcRetirementBudget() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;

  const income = g('rb-pension') + g('rb-ss') + g('rb-parttime');
  const expenses = g('rb-housing') + g('rb-transport') + g('rb-healthcare') +
    g('rb-food') + g('rb-entertainment') + g('rb-clothing') + g('rb-misc') + g('rb-donation');
  const shortfall = expenses - income;

  document.getElementById('rb-income-total').textContent = fmtUSD(income);
  document.getElementById('rb-expense-total').textContent = fmtUSD(expenses);
  document.getElementById('rb-shortfall').textContent = fmtUSD(shortfall);
  document.getElementById('rb-result').classList.add('show');

  if (shortfall > 0) {
    const spInput = document.getElementById('sp-monthly-need');
    spInput.value = Math.round(shortfall);
    document.getElementById('sp-link-note').classList.add('show');
  }
}

/* ============================================================
   2. Savings Plan (the core "Financial Freedom" target calculator)
      + the two charts that come out of the same inputs:
      Graph 2 (lifetime accumulation → decumulation) and
      Graph 1 (the cost of waiting 20 years to start).
   ============================================================ */
function calcSavingsPlan() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;

  const currentAge = g('sp-current-age');
  const retireAge = g('sp-retire-age');
  const lifeExpectancy = g('sp-life-expectancy');
  const legacy = g('sp-legacy');
  const monthlyNeedToday = g('sp-monthly-need');
  const inflation = g('sp-inflation') / 100;
  const retireReturn = g('sp-retire-return') / 100;
  const investReturn = g('sp-invest-return') / 100;
  const initial = g('sp-initial');

  const yearsToRetirement = retireAge - currentAge;
  const yearsInRetirement = lifeExpectancy - retireAge;

  if (yearsToRetirement <= 0 || yearsInRetirement <= 0) {
    alert('Retirement age must be after your current age, and life expectancy must be after retirement age.');
    return;
  }

  const monthlyNeedAtRetirement = monthlyNeedToday * Math.pow(1 + inflation, yearsToRetirement);
  const target = -pv(retireReturn / 12, yearsInRetirement * 12, monthlyNeedAtRetirement, legacy);
  const monthlyInvestNeeded = -pmt(investReturn / 12, yearsToRetirement * 12, -initial, target);

  document.getElementById('sp-need-at-retirement').textContent = fmtUSD(monthlyNeedAtRetirement);
  document.getElementById('sp-target').textContent = fmtUSD(target);
  document.getElementById('sp-monthly-invest').textContent = fmtUSD(monthlyInvestNeeded, 2) + ' / month';
  document.getElementById('sp-result').classList.add('show');

  drawLifetimeChart(currentAge, retireAge, lifeExpectancy, initial, monthlyInvestNeeded,
    investReturn, retireReturn, monthlyNeedAtRetirement, legacy);
  drawCostOfWaitingChart(currentAge, retireAge, initial, monthlyInvestNeeded, investReturn);

  document.getElementById('sp-charts').classList.add('show');
}

function drawLifetimeChart(currentAge, retireAge, lifeExpectancy, initial, monthlyContribution,
  investReturn, retireReturn, monthlyWithdrawal, legacy) {
  const points = [{ x: currentAge, y: initial }];
  let balance = initial;

  for (let age = currentAge + 1; age <= retireAge; age++) {
    balance = fv(investReturn / 12, 12, -monthlyContribution, -balance);
    points.push({ x: age, y: Math.max(balance, 0) });
  }
  for (let age = retireAge + 1; age <= lifeExpectancy; age++) {
    balance = fv(retireReturn / 12, 12, monthlyWithdrawal, -balance);
    points.push({ x: age, y: Math.max(balance, 0) });
  }

  drawLineChart('lifetime-chart', [
    { label: 'Account balance by age', color: '#3F5D4F', points }
  ], { minYZero: true, height: 280 });
}

function drawCostOfWaitingChart(currentAge, retireAge, initial, monthlyContribution, investReturn) {
  const fullYears = retireAge - currentAge;
  const delayedYears = fullYears - 20;

  if (delayedYears <= 0) {
    document.getElementById('cost-of-waiting-card').style.display = 'none';
    return;
  }
  document.getElementById('cost-of-waiting-card').style.display = '';

  function buildSeries(years, label, color) {
    const pts = [{ x: 0, y: initial }];
    let balance = initial;
    for (let y = 1; y <= years; y++) {
      balance = fv(investReturn / 12, 12, -monthlyContribution, -balance);
      pts.push({ x: y, y: Math.max(balance, 0) });
    }
    return { label, color, points: pts, final: balance };
  }

  const early = buildSeries(fullYears, `Start at age ${currentAge} (${fullYears} yrs)`, '#3F5D4F');
  const late = buildSeries(delayedYears, `Start at age ${currentAge + 20} (${delayedYears} yrs)`, '#C98A4B');

  drawLineChart('cost-of-waiting-chart', [early, late], { minYZero: true, height: 260 });

  document.getElementById('cow-early-final').textContent = fmtUSD(early.final);
  document.getElementById('cow-late-final').textContent = fmtUSD(late.final);
  document.getElementById('cow-summary').classList.add('show');
}

/* ============================================================
   3. Saving Rate — Person A (high rate) vs Person B (high return)
   ============================================================ */
function calcSavingRate() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;

  function years(salary, ratePct, returnPct, goal) {
    const rate = returnPct / 100;
    const annualContribution = (ratePct / 100) * salary;
    return nper(rate, -annualContribution, 0, goal);
  }

  const yearsA = years(g('sr-a-salary'), g('sr-a-rate'), g('sr-a-return'), g('sr-a-goal'));
  const yearsB = years(g('sr-b-salary'), g('sr-b-rate'), g('sr-b-return'), g('sr-b-goal'));

  document.getElementById('sr-a-years').textContent = yearsA.toFixed(1) + ' years';
  document.getElementById('sr-b-years').textContent = yearsB.toFixed(1) + ' years';
  document.getElementById('sr-result').classList.add('show');
}

/* ============================================================
   4. Power of Compound Interest
   ============================================================ */
function calcCompoundPower() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;
  const frequency = document.getElementById('cp-frequency').value;
  const amount = g('cp-amount');
  const years = g('cp-years');
  const rate = g('cp-rate') / 100;
  const initial = g('cp-initial');

  const periodsPerYear = frequency === 'daily' ? 365 : 12;
  const periods = years * periodsPerYear;
  const ratePerPeriod = rate / periodsPerYear;

  const futureValue = fv(ratePerPeriod, periods, -amount, -initial);
  const principal = amount * periods + initial;
  const interest = futureValue - principal;

  document.getElementById('cp-future-value').textContent = fmtUSD(futureValue);
  document.getElementById('cp-principal').textContent = fmtUSD(principal);
  document.getElementById('cp-interest').textContent = fmtUSD(interest);
  const pct = futureValue > 0 ? Math.round((interest / futureValue) * 100) : 0;
  document.getElementById('cp-pct-note').textContent =
    `${pct}% of the final balance came from growth, not from money you put in.`;
  document.getElementById('cp-result').classList.add('show');
}

/* ============================================================
   5. Saving on Eating Out (growing annuity)
   ============================================================ */
function calcEatingOut() {
  const g = id => parseFloat(document.getElementById(id).value) || 0;
  const weekly = g('eo-weekly');
  const returnRate = g('eo-return') / 100;
  const inflationRate = g('eo-inflation') / 100;
  const years = g('eo-years');

  const futureValue = growingAnnuityFV(weekly, returnRate / 52, inflationRate / 52, years * 52);
  const totalSaved = weekly * 52 * years;

  document.getElementById('eo-future-value').textContent = fmtUSD(futureValue);
  document.getElementById('eo-total-saved').textContent = fmtUSD(totalSaved);
  document.getElementById('eo-result').classList.add('show');
}
