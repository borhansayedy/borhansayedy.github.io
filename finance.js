/* ============================================================
   Core time-value-of-money helpers, matching Excel's FV/PV/PMT/NPER
   (type = 0, i.e. payments at end of period, which is what the
   Financial Freedom workbook uses throughout).
   ============================================================ */

function fv(rate, nper, pmt, pv) {
  pmt = pmt || 0;
  pv = pv || 0;
  if (rate === 0) return -(pv + pmt * nper);
  const factor = Math.pow(1 + rate, nper);
  return -(pv * factor + pmt * (factor - 1) / rate);
}

function pv(rate, nper, pmt, fvVal) {
  pmt = pmt || 0;
  fvVal = fvVal || 0;
  if (rate === 0) return -(fvVal + pmt * nper);
  const factor = Math.pow(1 + rate, nper);
  return -(fvVal + pmt * (factor - 1) / rate) / factor;
}

function pmt(rate, nper, pvVal, fvVal) {
  pvVal = pvVal || 0;
  fvVal = fvVal || 0;
  if (rate === 0) return -(pvVal + fvVal) / nper;
  const factor = Math.pow(1 + rate, nper);
  return -(pvVal * factor + fvVal) * rate / (factor - 1);
}

function nper(rate, pmtVal, pvVal, fvVal) {
  pvVal = pvVal || 0;
  fvVal = fvVal || 0;
  if (rate === 0) return -(fvVal + pvVal) / pmtVal;
  const numerator = (pmtVal / rate) - fvVal;
  const denominator = pvVal + (pmtVal / rate);
  return Math.log(numerator / denominator) / Math.log(1 + rate);
}

/* Future value of a growing annuity: a periodic contribution that itself
   grows each period (e.g. weekly savings that rise with inflation),
   invested at a return rate that differs from the growth rate. */
function growingAnnuityFV(periodicAmount, ratePerPeriod, growthPerPeriod, periods) {
  if (Math.abs(ratePerPeriod - growthPerPeriod) < 1e-9) {
    return periodicAmount * periods * Math.pow(1 + ratePerPeriod, periods - 1);
  }
  return (periodicAmount / (ratePerPeriod - growthPerPeriod)) *
    (Math.pow(1 + ratePerPeriod, periods) - Math.pow(1 + growthPerPeriod, periods));
}

function fmtUSD(n, decimals) {
  decimals = decimals === undefined ? 0 : decimals;
  return n.toLocaleString('en-US', { style: 'currency', currency: 'USD', maximumFractionDigits: decimals, minimumFractionDigits: decimals });
}

/* ============================================================
   Minimal canvas line chart — no external dependencies.
   series: [{ label, color, points: [{x, y}, ...] }]
   ============================================================ */
function drawLineChart(canvasId, series, opts) {
  opts = opts || {};
  const canvas = document.getElementById(canvasId);
  if (!canvas) return;
  const ctx = canvas.getContext('2d');
  const dpr = window.devicePixelRatio || 1;
  const cssWidth = canvas.clientWidth || canvas.parentElement.clientWidth;
  const cssHeight = opts.height || 260;
  canvas.width = cssWidth * dpr;
  canvas.height = cssHeight * dpr;
  canvas.style.width = cssWidth + 'px';
  canvas.style.height = cssHeight + 'px';
  ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
  ctx.clearRect(0, 0, cssWidth, cssHeight);

  const padding = { top: 16, right: 16, bottom: 28, left: 64 };
  const plotW = cssWidth - padding.left - padding.right;
  const plotH = cssHeight - padding.top - padding.bottom;

  let allX = [], allY = [];
  series.forEach(s => s.points.forEach(p => { allX.push(p.x); allY.push(p.y); }));
  const minX = Math.min(...allX), maxX = Math.max(...allX);
  const minY = opts.minYZero ? 0 : Math.min(...allY);
  const maxY = Math.max(...allY) * 1.08;

  const xScale = x => padding.left + ((x - minX) / (maxX - minX || 1)) * plotW;
  const yScale = y => padding.top + plotH - ((y - minY) / (maxY - minY || 1)) * plotH;

  const styles = getComputedStyle(document.documentElement);
  const lineColor = styles.getPropertyValue('--line').trim() || '#ddd3c4';
  const inkSoft = styles.getPropertyValue('--ink-soft').trim() || '#5b564c';

  // gridlines + y labels
  ctx.strokeStyle = lineColor;
  ctx.lineWidth = 1;
  ctx.fillStyle = inkSoft;
  ctx.font = '11px "Source Sans 3", sans-serif';
  ctx.textAlign = 'right';
  ctx.textBaseline = 'middle';
  const gridLines = 4;
  for (let i = 0; i <= gridLines; i++) {
    const yVal = minY + (maxY - minY) * (i / gridLines);
    const yPix = yScale(yVal);
    ctx.beginPath();
    ctx.moveTo(padding.left, yPix);
    ctx.lineTo(cssWidth - padding.right, yPix);
    ctx.stroke();
    const label = yVal >= 1000000 ? '$' + (yVal / 1000000).toFixed(yVal >= 10000000 ? 0 : 1) + 'M'
      : yVal >= 1000 ? '$' + Math.round(yVal / 1000) + 'k'
      : '$' + Math.round(yVal);
    ctx.fillText(label, padding.left - 8, yPix);
  }

  // x axis labels (first, middle, last)
  ctx.textAlign = 'center';
  ctx.textBaseline = 'top';
  [minX, Math.round((minX + maxX) / 2), maxX].forEach(xv => {
    ctx.fillText(String(xv), xScale(xv), cssHeight - padding.bottom + 8);
  });

  // series lines
  series.forEach(s => {
    ctx.strokeStyle = s.color;
    ctx.lineWidth = 2.5;
    ctx.beginPath();
    s.points.forEach((p, i) => {
      const px = xScale(p.x), py = yScale(p.y);
      if (i === 0) ctx.moveTo(px, py); else ctx.lineTo(px, py);
    });
    ctx.stroke();
  });

  // legend
  if (opts.legend !== false) {
    let lx = padding.left;
    const ly = 6;
    ctx.font = '12px "Source Sans 3", sans-serif';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'middle';
    series.forEach(s => {
      ctx.fillStyle = s.color;
      ctx.fillRect(lx, ly - 4, 10, 10);
      ctx.fillStyle = inkSoft;
      const textWidth = ctx.measureText(s.label).width;
      ctx.fillText(s.label, lx + 14, ly + 1);
      lx += 14 + textWidth + 20;
    });
  }
}
