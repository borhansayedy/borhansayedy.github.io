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
    prompt: "Roughly how much would you like to have available each month in retirement, in today's dollars? Think about housing, food, healthcare, and the life you want to live.",
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
    prompt: 'What return would you expect on your investments once you retire? People usually invest more conservatively at this stage, so a lower number than your working years is typical.',
    suggestions: [4, 5, 6],
    unit: '%'
  },
  {
    key: 'investReturn',
    prompt: 'And what return do you expect while you\u2019re actively investing before retirement?',
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
    Here's what I've got: to have <strong>${fmtUSD(monthlyNeedAtRetirement)}/month</strong> available when you retire at ${a.retireAge}
    (adjusted for inflation), you'll want a nest egg of about <strong>${fmtUSD(target)}</strong> by then.
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
