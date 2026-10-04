/* ============================================================
   Guided wizard: walks through the same questions as the
   Retirement Budget + Financial Freedom Number calculators,
   one at a time, chat-style. No AI involved, just a scripted
   flow that feeds the same finance.js functions used elsewhere.
   ============================================================ */

const wizardSteps = [
  {
    key: 'currentAge',
    prompt: "Hi! Let's work out your Financial Freedom Number together. First, how old are you today?",
    suggestions: [20, 25, 30],
    unit: 'years old'
  },
  {
    key: 'retireAge',
    prompt: 'Got it. At what age would you like to retire, or reach financial freedom?',
    suggestions: [60, 65, 67],
    unit: 'years old'
  },
  {
    key: 'lifeExpectancy',
    prompt: 'And what age should we plan for as your life expectancy? This just sets how many years your savings need to last.',
    suggestions: [85, 90, 95],
    unit: 'years old'
  },
  {
    key: 'legacy',
    prompt: 'Would you like to leave money behind for family or a cause at that age? If not, just enter 0.',
    suggestions: [0, 100000, 500000],
    unit: '$'
  },
  {
    key: 'monthlyNeed',
    prompt: "How much will you need to pull out of your own savings each month in retirement, in today's dollars?" +
      '<span class="wizard-hint">Careful here: this is <strong>not</strong> your total cost of living. It is the gap left over after the income you will already be receiving. Add up what you expect to spend each month, subtract what will come in from a pension, 401(k), Social Security, or part-time work, and enter the difference. If you expect to spend $6,000 a month and $3,000 of that is already covered, the number to enter is $3,000. That shortfall is what your investments have to pay for.</span>',
    suggestions: [2000, 3000, 5000],
    unit: '$/month'
  },
  {
    key: 'inflation',
    prompt: "What annual inflation rate should we assume? 3.9% is a reasonable long-run planning assumption if you're not sure.",
    suggestions: [3, 3.9, 4.5],
    unit: '%'
  },
  {
    key: 'retireReturn',
    prompt: 'Once you retire, what return do you expect on the money still invested, <strong>after</strong> inflation?' +
      '<span class="wizard-hint">This one has to be inflation-adjusted, because the monthly amount you just gave me is in today\u2019s dollars and needs to keep its buying power for the rest of your life. So enter the return <em>above</em> inflation, not the headline number. Most people shift toward bonds as retirement gets closer, and a mix of stocks and bonds has historically returned somewhere around 5% a year once inflation is taken out, which makes 5% a sensible starting point.</span>',
    suggestions: [4, 5, 6],
    unit: '%'
  },
  {
    key: 'investReturn',
    prompt: 'And while you\u2019re still working and investing, what return do you expect <strong>before</strong> inflation?' +
      '<span class="wizard-hint">This one is the opposite: do not adjust it. Enter the plain return you would see on a statement. Inflation is already handled separately, because the calculator takes the monthly amount you gave me in today\u2019s dollars and grows it to what that same life will actually cost in the year you retire. Adjusting here too would subtract inflation twice. For reference, the S&amp;P 500 has averaged about 11.89% a year over roughly the past 50 years before adjusting for inflation.</span>',
    suggestions: [8, 10, 11.89],
    unit: '%'
  },
  {
    key: 'initial',
    prompt: 'Last one: do you already have any savings or investments started? Enter the amount, or 0 if you\u2019re starting fresh.',
    suggestions: [0, 1000, 5000],
    unit: '$'
  }
];

let wizardAnswers = {};
let wizardStepIndex = 0;

function showFormMode() {
  document.getElementById('form-mode').style.display = '';
  document.getElementById('wizard-mode').classList.remove('show');
  document.getElementById('toggle-form-btn').classList.add('active');
  document.getElementById('toggle-wizard-btn').classList.remove('active');
}

function showWizardMode() {
  document.getElementById('form-mode').style.display = 'none';
  document.getElementById('wizard-mode').classList.add('show');
  document.getElementById('toggle-form-btn').classList.remove('active');
  document.getElementById('toggle-wizard-btn').classList.add('active');
  if (Object.keys(wizardAnswers).length === 0) {
    startWizard();
  }
}

function startWizard() {
  wizardAnswers = {};
  wizardStepIndex = 0;
  document.getElementById('wizard-messages').innerHTML = '';
  askWizardStep();
}

function restartWizard() {
  startWizard();
}

function addBubble(text, sender) {
  const container = document.getElementById('wizard-messages');
  const bubble = document.createElement('div');
  bubble.className = 'wizard-bubble ' + sender;
  bubble.innerHTML = text;
  container.appendChild(bubble);
  container.scrollTop = container.scrollHeight;
  return bubble;
}

function askWizardStep() {
  const inputArea = document.getElementById('wizard-input-area');
  inputArea.innerHTML = '';

  if (wizardStepIndex >= wizardSteps.length) {
    finishWizard();
    return;
  }

  const step = wizardSteps[wizardStepIndex];
  addBubble(step.prompt, 'bot');

  const row = document.createElement('div');
  row.className = 'wizard-input-row';

  const input = document.createElement('input');
  input.type = 'number';
  input.placeholder = 'Type a number' + (step.unit ? ` (${step.unit})` : '');
  row.appendChild(input);

  const sendBtn = document.createElement('button');
  sendBtn.className = 'calc-btn';
  sendBtn.textContent = 'Send';
  sendBtn.onclick = () => submitWizardAnswer(input.value);
  row.appendChild(sendBtn);

  inputArea.appendChild(row);

  if (step.suggestions) {
    const optWrap = document.createElement('div');
    optWrap.className = 'wizard-options';
    step.suggestions.forEach(val => {
      const btn = document.createElement('button');
      btn.className = 'wizard-option-btn';
      btn.textContent = step.unit === '$' || step.unit === '$/month'
        ? fmtUSD(val)
        : val + (step.unit ? ' ' + step.unit.replace('$/month','').trim() : '');
      btn.onclick = () => submitWizardAnswer(val);
      optWrap.appendChild(btn);
    });
    inputArea.appendChild(optWrap);
  }

  input.addEventListener('keydown', e => {
    if (e.key === 'Enter') submitWizardAnswer(input.value);
  });
  input.focus();
}

function submitWizardAnswer(rawValue) {
  const value = parseFloat(rawValue);
  if (isNaN(value)) return;

  const step = wizardSteps[wizardStepIndex];
  wizardAnswers[step.key] = value;

  let displayValue = value;
  if (step.unit === '$' || step.unit === '$/month') displayValue = fmtUSD(value);
  else if (step.unit === '%') displayValue = value + '%';
  else if (step.unit) displayValue = value + ' ' + step.unit;

  addBubble(String(displayValue), 'user');

  wizardStepIndex++;
  askWizardStep();
}

function finishWizard() {
  const a = wizardAnswers;
  const yearsToRetirement = a.retireAge - a.currentAge;
  const yearsInRetirement = a.lifeExpectancy - a.retireAge;

  if (yearsToRetirement <= 0 || yearsInRetirement <= 0) {
    addBubble("Hmm, your retirement age and life expectancy need to be after your current age and retirement age, respectively. Let's start over so I can get this right.", 'bot');
    const retryBtn = document.createElement('button');
    retryBtn.className = 'calc-btn';
    retryBtn.textContent = 'Start over';
    retryBtn.onclick = restartWizard;
    document.getElementById('wizard-input-area').innerHTML = '';
    document.getElementById('wizard-input-area').appendChild(retryBtn);
    return;
  }

  const inflation = a.inflation / 100;
  const retireReturn = a.retireReturn / 100;
  const investReturn = a.investReturn / 100;

  const monthlyNeedAtRetirement = a.monthlyNeed * Math.pow(1 + inflation, yearsToRetirement);
  const target = -pv(retireReturn / 12, yearsInRetirement * 12, monthlyNeedAtRetirement, a.legacy);
  const monthlyInvestNeeded = -pmt(investReturn / 12, yearsToRetirement * 12, -a.initial, target);

  const summary = `
    Here's what I've got: the ${fmtUSD(a.monthlyNeed)}/month shortfall you gave me in today's dollars works out to
    <strong>${fmtUSD(monthlyNeedAtRetirement)}/month</strong> by the time you retire at ${a.retireAge}, once inflation has done its work.
    To cover that for the rest of your life, you'll want a nest egg of about <strong>${fmtUSD(target)}</strong> by then.
    <br><br>
    Starting from ${fmtUSD(a.initial)} today, investing at ${a.investReturn}% a year for ${yearsToRetirement} years,
    that means investing about <strong>${fmtUSD(monthlyInvestNeeded, 2)}/month</strong> to get there.
  `;
  addBubble(summary, 'bot');

  const chartId = 'wizard-chart-' + Date.now();
  const chartBubble = addBubble(`<canvas id="${chartId}" style="width:100%;"></canvas>`, 'bot');
  chartBubble.style.maxWidth = '100%';
  chartBubble.style.width = '100%';

  setTimeout(() => {
    const points = [{ x: a.currentAge, y: a.initial }];
    let balance = a.initial;
    for (let age = a.currentAge + 1; age <= a.retireAge; age++) {
      balance = fv(investReturn / 12, 12, -monthlyInvestNeeded, -balance);
      points.push({ x: age, y: Math.max(balance, 0) });
    }
    for (let age = a.retireAge + 1; age <= a.lifeExpectancy; age++) {
      balance = fv(retireReturn / 12, 12, monthlyNeedAtRetirement, -balance);
      points.push({ x: age, y: Math.max(balance, 0) });
    }
    drawLineChart(chartId, [
      { label: 'Account balance by age', color: '#3F5D4F', points }
    ], { minYZero: true, height: 240 });
  }, 50);

  document.getElementById('wizard-input-area').innerHTML = '';
}
