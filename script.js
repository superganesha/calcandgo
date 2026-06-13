'use strict';

(function () {
  // ---------- Navigation ----------
  var navButtons = document.querySelectorAll('.nav-btn');
  var panels = document.querySelectorAll('.calc-panel');

  navButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-calc');

      navButtons.forEach(function (b) { b.classList.remove('active'); });
      panels.forEach(function (p) { p.classList.remove('active'); });

      btn.classList.add('active');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });

  // ---------- Helpers ----------
  function getNum(id) {
    var el = document.getElementById(id);
    if (!el) return NaN;
    var val = parseFloat(el.value);
    return val;
  }

  function showError(resultEl, message) {
    resultEl.innerHTML = '<span class="error">' + message + '</span>';
  }

  function formatCurrency(num) {
    if (!isFinite(num)) return '$0.00';
    return '$' + num.toLocaleString('en-US', { minimumFractionDigits: 2, maximumFractionDigits: 2 });
  }

  function formatNumber(num, decimals) {
    if (!isFinite(num)) return '0';
    return num.toLocaleString('en-US', { minimumFractionDigits: decimals, maximumFractionDigits: decimals });
  }

  // ---------- State Property Tax Rates (avg. effective rates, est. 2025-2026) ----------
  // Source: Tax Foundation / Census ACS-based effective property tax rates.
  // These are STATE AVERAGES for estimation only - actual rates vary by county/city.
  var STATE_PROPERTY_TAX_RATES = {
    AL: { name: 'Alabama', rate: 0.41 },
    AK: { name: 'Alaska', rate: 1.04 },
    AZ: { name: 'Arizona', rate: 0.51 },
    AR: { name: 'Arkansas', rate: 0.61 },
    CA: { name: 'California', rate: 0.71 },
    CO: { name: 'Colorado', rate: 0.51 },
    CT: { name: 'Connecticut', rate: 1.79 },
    DE: { name: 'Delaware', rate: 0.43 },
    DC: { name: 'District of Columbia', rate: 0.56 },
    FL: { name: 'Florida', rate: 0.80 },
    GA: { name: 'Georgia', rate: 0.81 },
    HI: { name: 'Hawaii', rate: 0.29 },
    ID: { name: 'Idaho', rate: 0.49 },
    IL: { name: 'Illinois', rate: 1.95 },
    IN: { name: 'Indiana', rate: 0.75 },
    IA: { name: 'Iowa', rate: 1.43 },
    KS: { name: 'Kansas', rate: 1.25 },
    KY: { name: 'Kentucky', rate: 0.78 },
    LA: { name: 'Louisiana', rate: 0.51 },
    ME: { name: 'Maine', rate: 1.16 },
    MD: { name: 'Maryland', rate: 0.96 },
    MA: { name: 'Massachusetts', rate: 1.04 },
    MI: { name: 'Michigan', rate: 1.24 },
    MN: { name: 'Minnesota', rate: 0.93 },
    MS: { name: 'Mississippi', rate: 0.58 },
    MO: { name: 'Missouri', rate: 0.83 },
    MT: { name: 'Montana', rate: 0.66 },
    NE: { name: 'Nebraska', rate: 1.46 },
    NV: { name: 'Nevada', rate: 0.50 },
    NH: { name: 'New Hampshire', rate: 1.61 },
    NJ: { name: 'New Jersey', rate: 2.23 },
    NM: { name: 'New Mexico', rate: 0.62 },
    NY: { name: 'New York', rate: 1.30 },
    NC: { name: 'North Carolina', rate: 0.70 },
    ND: { name: 'North Dakota', rate: 0.95 },
    OH: { name: 'Ohio', rate: 1.30 },
    OK: { name: 'Oklahoma', rate: 0.83 },
    OR: { name: 'Oregon', rate: 0.82 },
    PA: { name: 'Pennsylvania', rate: 1.35 },
    RI: { name: 'Rhode Island', rate: 1.00 },
    SC: { name: 'South Carolina', rate: 0.50 },
    SD: { name: 'South Dakota', rate: 1.07 },
    TN: { name: 'Tennessee', rate: 0.48 },
    TX: { name: 'Texas', rate: 1.47 },
    UT: { name: 'Utah', rate: 0.47 },
    VT: { name: 'Vermont', rate: 1.61 },
    VA: { name: 'Virginia', rate: 0.74 },
    WA: { name: 'Washington', rate: 0.76 },
    WV: { name: 'West Virginia', rate: 0.51 },
    WI: { name: 'Wisconsin', rate: 1.32 },
    WY: { name: 'Wyoming', rate: 0.55 }
  };

  var mStateEl = document.getElementById('m-state');
  var mAmountEl = document.getElementById('m-amount');
  var mTaxEl = document.getElementById('m-tax');

  function populateStateDropdown() {
    if (!mStateEl) return;
    var keys = Object.keys(STATE_PROPERTY_TAX_RATES).sort(function (a, b) {
      return STATE_PROPERTY_TAX_RATES[a].name.localeCompare(STATE_PROPERTY_TAX_RATES[b].name);
    });
    keys.forEach(function (key) {
      var opt = document.createElement('option');
      opt.value = key;
      opt.textContent = STATE_PROPERTY_TAX_RATES[key].name + ' (avg ' + STATE_PROPERTY_TAX_RATES[key].rate.toFixed(2) + '%)';
      mStateEl.appendChild(opt);
    });
  }

  function applyStateTaxEstimate() {
    if (!mStateEl || !mAmountEl || !mTaxEl) return;
    var stateKey = mStateEl.value;
    if (!stateKey) return;

    var homePrice = parseFloat(mAmountEl.value);
    if (isNaN(homePrice) || homePrice <= 0) return;

    var rate = STATE_PROPERTY_TAX_RATES[stateKey].rate;
    var estimatedAnnualTax = homePrice * (rate / 100);
    mTaxEl.value = estimatedAnnualTax.toFixed(2);
  }

  if (mStateEl) {
    populateStateDropdown();
    mStateEl.addEventListener('change', applyStateTaxEstimate);
    // Also update the estimate if the user changes home price after selecting a state
    mAmountEl.addEventListener('change', applyStateTaxEstimate);
  }

  // ---------- Mortgage Calculator ----------
  function calcMortgage() {
    var resultEl = document.getElementById('m-result');
    var homePrice = getNum('m-amount');
    var downPayment = getNum('m-down');
    var annualRate = getNum('m-rate');
    var years = getNum('m-years');
    var annualTax = getNum('m-tax');
    var annualInsurance = getNum('m-insurance');
    var annualPmi = getNum('m-pmi');
    var monthlyHoa = getNum('m-hoa');

    // Optional fields default to 0 if left blank
    if (isNaN(downPayment)) downPayment = 0;
    if (isNaN(annualTax)) annualTax = 0;
    if (isNaN(annualInsurance)) annualInsurance = 0;
    if (isNaN(annualPmi)) annualPmi = 0;
    if (isNaN(monthlyHoa)) monthlyHoa = 0;

    if (isNaN(homePrice) || isNaN(annualRate) || isNaN(years) ||
        homePrice <= 0 || years <= 0 || annualRate < 0 ||
        downPayment < 0 || annualTax < 0 || annualInsurance < 0 || annualPmi < 0 || monthlyHoa < 0) {
      showError(resultEl, 'Please enter valid positive numbers. Home price, rate, and term are required.');
      return;
    }

    if (downPayment >= homePrice) {
      showError(resultEl, 'Down payment must be less than the home price.');
      return;
    }

    var principal = homePrice - downPayment;
    var monthlyRate = annualRate / 100 / 12;
    var numPayments = years * 12;
    var principalAndInterest;

    if (monthlyRate === 0) {
      principalAndInterest = principal / numPayments;
    } else {
      principalAndInterest = principal * (monthlyRate * Math.pow(1 + monthlyRate, numPayments)) /
        (Math.pow(1 + monthlyRate, numPayments) - 1);
    }

    var monthlyTax = annualTax / 12;
    var monthlyInsurance = annualInsurance / 12;
    var monthlyPmi = annualPmi / 12;
    var totalMonthlyPayment = principalAndInterest + monthlyTax + monthlyInsurance + monthlyPmi + monthlyHoa;

    var totalPI = principalAndInterest * numPayments;
    var totalInterest = totalPI - principal;
    var downPaymentPercent = (downPayment / homePrice) * 100;

    resultEl.innerHTML =
      '<strong>Total Monthly Payment: ' + formatCurrency(totalMonthlyPayment) + '</strong>' +
      '<table>' +
      '<tr><td>Principal &amp; Interest</td><td>' + formatCurrency(principalAndInterest) + '</td></tr>' +
      '<tr><td>Property Tax (monthly)</td><td>' + formatCurrency(monthlyTax) + '</td></tr>' +
      '<tr><td>Home Insurance (monthly)</td><td>' + formatCurrency(monthlyInsurance) + '</td></tr>' +
      '<tr><td>PMI (monthly)</td><td>' + formatCurrency(monthlyPmi) + '</td></tr>' +
      '<tr><td>HOA Fees (monthly)</td><td>' + formatCurrency(monthlyHoa) + '</td></tr>' +
      '<tr><td>Loan Amount</td><td>' + formatCurrency(principal) + '</td></tr>' +
      '<tr><td>Down Payment</td><td>' + formatCurrency(downPayment) + ' (' + formatNumber(downPaymentPercent, 1) + '%)</td></tr>' +
      '<tr><td>Total Interest Over Loan</td><td>' + formatCurrency(totalInterest) + '</td></tr>' +
      '<tr><td>Total Cost (P&amp;I only)</td><td>' + formatCurrency(totalPI) + '</td></tr>' +
      '</table>';

    // If a state was selected, note that the tax figure is an estimate
    var stateKey = mStateEl ? mStateEl.value : '';
    if (stateKey && STATE_PROPERTY_TAX_RATES[stateKey]) {
      var stateInfo = STATE_PROPERTY_TAX_RATES[stateKey];
      resultEl.innerHTML += '<p class="hint">Property tax estimated using ' + stateInfo.name +
        '\'s average effective rate of ' + stateInfo.rate.toFixed(2) +
        '%. Actual rates vary by county and city - check your listing or county assessor for the exact figure.</p>';
    }
  }

  // ---------- Loan Calculator ----------
  function calcLoan() {
    var resultEl = document.getElementById('l-result');
    var principal = getNum('l-amount');
    var annualRate = getNum('l-rate');
    var months = getNum('l-months');
    var fee = getNum('l-fee');
    var extra = getNum('l-extra');

    if (isNaN(fee)) fee = 0;
    if (isNaN(extra)) extra = 0;

    if (isNaN(principal) || isNaN(annualRate) || isNaN(months) ||
        principal <= 0 || months <= 0 || annualRate < 0 || fee < 0 || extra < 0) {
      showError(resultEl, 'Please enter valid positive numbers for all fields.');
      return;
    }

    var monthlyRate = annualRate / 100 / 12;
    var basePayment;

    if (monthlyRate === 0) {
      basePayment = principal / months;
    } else {
      basePayment = principal * (monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1);
    }

    var totalPaidBase = basePayment * months;
    var totalInterestBase = totalPaidBase - principal;

    var resultHtml =
      '<strong>Monthly Payment: ' + formatCurrency(basePayment) + '</strong>' +
      '<table>' +
      '<tr><td>Total Payments</td><td>' + months + '</td></tr>' +
      '<tr><td>Total Interest</td><td>' + formatCurrency(totalInterestBase) + '</td></tr>' +
      '<tr><td>Total Repayment</td><td>' + formatCurrency(totalPaidBase) + '</td></tr>' +
      '<tr><td>Origination Fee</td><td>' + formatCurrency(fee) + '</td></tr>' +
      '<tr><td>Total Cost (incl. fee)</td><td>' + formatCurrency(totalPaidBase + fee) + '</td></tr>';

    // If extra payments are made, simulate amortization to find new payoff time
    if (extra > 0 && monthlyRate >= 0) {
      var balance = principal;
      var monthCount = 0;
      var totalInterestExtra = 0;
      var totalPaymentWithExtra = basePayment + extra;
      var maxIterations = 1200; // safety cap (100 years)

      while (balance > 0 && monthCount < maxIterations) {
        var interestPayment = balance * monthlyRate;
        var principalPayment = totalPaymentWithExtra - interestPayment;

        if (principalPayment <= 0) {
          // Payment doesn't cover interest; can't pay off
          monthCount = -1;
          break;
        }

        if (principalPayment > balance) {
          principalPayment = balance;
          totalInterestExtra += balance * monthlyRate;
        } else {
          totalInterestExtra += interestPayment;
        }

        balance -= principalPayment;
        monthCount++;
      }

      if (monthCount === -1) {
        resultHtml += '<tr><td>With Extra Payment</td><td><span class="error">Extra payment too small to reduce balance</span></td></tr>';
      } else {
        var monthsSaved = months - monthCount;
        var interestSaved = totalInterestBase - totalInterestExtra;
        resultHtml +=
          '<tr><td>New Payoff Time (with extra)</td><td>' + monthCount + ' months</td></tr>' +
          '<tr><td>Time Saved</td><td>' + Math.max(0, monthsSaved) + ' months</td></tr>' +
          '<tr><td>Interest Saved</td><td>' + formatCurrency(Math.max(0, interestSaved)) + '</td></tr>';
      }
    }

    resultHtml += '</table>';
    resultEl.innerHTML = resultHtml;
  }

  // ---------- BMI & Calorie Calculator ----------
  function calcBmi() {
    var resultEl = document.getElementById('b-result');
    var weight = getNum('b-weight');
    var height = getNum('b-height');
    var age = getNum('b-age');
    var gender = document.getElementById('b-gender').value;
    var activity = parseFloat(document.getElementById('b-activity').value);

    if (isNaN(weight) || isNaN(height) || weight <= 0 || height <= 0) {
      showError(resultEl, 'Please enter valid positive numbers for weight and height.');
      return;
    }

    var heightM = height / 100;
    var bmi = weight / (heightM * heightM);

    var category;
    if (bmi < 18.5) category = 'Underweight';
    else if (bmi < 25) category = 'Normal weight';
    else if (bmi < 30) category = 'Overweight';
    else category = 'Obese';

    var resultHtml =
      '<strong>BMI: ' + formatNumber(bmi, 1) + ' (' + category + ')</strong>' +
      '<table><tr><td>Category</td><td>' + category + '</td></tr>';

    // Optional calorie estimate if age is provided (Mifflin-St Jeor equation)
    if (!isNaN(age) && age > 0) {
      var bmr;
      if (gender === 'male') {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) + 5;
      } else {
        bmr = (10 * weight) + (6.25 * height) - (5 * age) - 161;
      }

      var tdee = bmr * activity;
      var loseWeight = tdee - 500;
      var gainWeight = tdee + 500;

      resultHtml +=
        '<tr><td>BMR (calories at rest)</td><td>' + formatNumber(bmr, 0) + ' kcal/day</td></tr>' +
        '<tr><td>Maintenance Calories (TDEE)</td><td>' + formatNumber(tdee, 0) + ' kcal/day</td></tr>' +
        '<tr><td>To Lose ~1 lb/week</td><td>' + formatNumber(Math.max(0, loseWeight), 0) + ' kcal/day</td></tr>' +
        '<tr><td>To Gain ~1 lb/week</td><td>' + formatNumber(gainWeight, 0) + ' kcal/day</td></tr>';
    }

    resultHtml += '</table>';
    resultEl.innerHTML = resultHtml;
  }

  // ---------- Tip Splitter ----------
  function calcTip() {
    var resultEl = document.getElementById('t-result');
    var bill = getNum('t-bill');
    var taxPercent = getNum('t-tax');
    var tipPercent = getNum('t-percent');
    var tipBase = document.getElementById('t-tipbase').value;
    var people = getNum('t-people');
    var roundMode = document.getElementById('t-round').value;

    if (isNaN(taxPercent)) taxPercent = 0;

    if (isNaN(bill) || isNaN(tipPercent) || isNaN(people) ||
        bill < 0 || tipPercent < 0 || taxPercent < 0 || people < 1) {
      showError(resultEl, 'Please enter valid numbers (people must be at least 1).');
      return;
    }

    var taxAmount = bill * (taxPercent / 100);
    var billAfterTax = bill + taxAmount;

    var tipCalcBase = (tipBase === 'posttax') ? billAfterTax : bill;
    var tipAmount = tipCalcBase * (tipPercent / 100);

    var total = billAfterTax + tipAmount;
    var perPersonRaw = total / people;
    var tipPerPerson = tipAmount / people;

    var perPersonFinal = perPersonRaw;
    var roundingAdjustment = 0;

    if (roundMode === 'dollar') {
      perPersonFinal = Math.ceil(perPersonRaw);
      roundingAdjustment = (perPersonFinal - perPersonRaw) * people;
    } else if (roundMode === 'five') {
      perPersonFinal = Math.ceil(perPersonRaw / 5) * 5;
      roundingAdjustment = (perPersonFinal - perPersonRaw) * people;
    }

    var resultHtml =
      '<strong>Total per Person: ' + formatCurrency(perPersonFinal) + '</strong>' +
      '<table>' +
      '<tr><td>Bill Amount</td><td>' + formatCurrency(bill) + '</td></tr>' +
      '<tr><td>Sales Tax</td><td>' + formatCurrency(taxAmount) + '</td></tr>' +
      '<tr><td>Bill After Tax</td><td>' + formatCurrency(billAfterTax) + '</td></tr>' +
      '<tr><td>Tip Amount</td><td>' + formatCurrency(tipAmount) + '</td></tr>' +
      '<tr><td>Total (Bill + Tax + Tip)</td><td>' + formatCurrency(total) + '</td></tr>' +
      '<tr><td>Tip per Person</td><td>' + formatCurrency(tipPerPerson) + '</td></tr>';

    if (roundingAdjustment !== 0) {
      resultHtml += '<tr><td>Rounding Adjustment (extra)</td><td>' + formatCurrency(roundingAdjustment) + '</td></tr>';
    }

    resultHtml += '</table>';
    resultEl.innerHTML = resultHtml;
  }

  // ---------- Percentage Calculator ----------
  var pModeEl = document.getElementById('p-mode');
  var pXLabel = document.getElementById('p-x-label');
  var pYLabel = document.getElementById('p-y-label');

  function updatePercentageLabels() {
    var mode = pModeEl.value;
    var labels = {
      'of': { x: 'X (Percentage %)', y: 'Y (Value)' },
      'is-what-percent': { x: 'X (Part)', y: 'Y (Whole)' },
      'change': { x: 'X (Percent change %, use negative to decrease)', y: 'Y (Starting Value)' },
      'percent-change': { x: 'X (Original Value)', y: 'Y (New Value)' }
    };
    var l = labels[mode] || labels['of'];
    // Update only the text node, keep the nested input
    pXLabel.childNodes[0].textContent = l.x;
    pYLabel.childNodes[0].textContent = l.y;

    var resultEl = document.getElementById('p-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (pModeEl) {
    pModeEl.addEventListener('change', updatePercentageLabels);
    updatePercentageLabels();
  }

  function calcPercentage() {
    var resultEl = document.getElementById('p-result');
    var mode = pModeEl.value;
    var x = getNum('p-x');
    var y = getNum('p-y');

    if (isNaN(x) || isNaN(y)) {
      showError(resultEl, 'Please enter valid numbers for both fields.');
      return;
    }

    var resultHtml = '';

    switch (mode) {
      case 'of': {
        var result = (x / 100) * y;
        resultHtml = '<strong>' + formatNumber(x, 2) + '% of ' + formatNumber(y, 2) + ' = ' + formatNumber(result, 2) + '</strong>';
        break;
      }
      case 'is-what-percent': {
        if (y === 0) {
          showError(resultEl, 'Y (Whole) cannot be zero.');
          return;
        }
        var pct = (x / y) * 100;
        resultHtml = '<strong>' + formatNumber(x, 2) + ' is ' + formatNumber(pct, 2) + '% of ' + formatNumber(y, 2) + '</strong>';
        break;
      }
      case 'change': {
        var changed = y + (y * (x / 100));
        var diff = changed - y;
        var direction = x >= 0 ? 'increase' : 'decrease';
        resultHtml =
          '<strong>' + formatNumber(y, 2) + (x >= 0 ? ' increased ' : ' decreased ') + 'by ' + formatNumber(Math.abs(x), 2) + '% = ' + formatNumber(changed, 2) + '</strong>' +
          '<table><tr><td>Change Amount</td><td>' + formatNumber(diff, 2) + ' (' + direction + ')</td></tr></table>';
        break;
      }
      case 'percent-change': {
        if (x === 0) {
          showError(resultEl, 'X (Original Value) cannot be zero.');
          return;
        }
        var pctChange = ((y - x) / Math.abs(x)) * 100;
        var changeDirection = pctChange >= 0 ? 'increase' : 'decrease';
        resultHtml =
          '<strong>Change from ' + formatNumber(x, 2) + ' to ' + formatNumber(y, 2) + ' = ' + formatNumber(Math.abs(pctChange), 2) + '% ' + changeDirection + '</strong>';
        break;
      }
      default:
        showError(resultEl, 'Unknown calculation type.');
        return;
    }

    resultEl.innerHTML = resultHtml;
  }

  // ---------- Unit Converter (Multi-category) ----------
  var UNIT_DATA = {
    length: {
      label: 'Length',
      base: 'm',
      units: {
        mm: { label: 'Millimeters', toBase: 0.001 },
        cm: { label: 'Centimeters', toBase: 0.01 },
        m: { label: 'Meters', toBase: 1 },
        km: { label: 'Kilometers', toBase: 1000 },
        in: { label: 'Inches', toBase: 0.0254 },
        ft: { label: 'Feet', toBase: 0.3048 },
        yd: { label: 'Yards', toBase: 0.9144 },
        mi: { label: 'Miles', toBase: 1609.344 },
        nmi: { label: 'Nautical Miles', toBase: 1852 }
      }
    },
    weight: {
      label: 'Weight / Mass',
      base: 'g',
      units: {
        mg: { label: 'Milligrams', toBase: 0.001 },
        g: { label: 'Grams', toBase: 1 },
        kg: { label: 'Kilograms', toBase: 1000 },
        oz: { label: 'Ounces', toBase: 28.349523125 },
        lb: { label: 'Pounds', toBase: 453.59237 },
        st: { label: 'Stone', toBase: 6350.29318 },
        ton_us: { label: 'US Tons (short)', toBase: 907184.74 },
        tonne: { label: 'Metric Tonnes', toBase: 1000000 }
      }
    },
    volume: {
      label: 'Volume',
      base: 'ml',
      units: {
        ml: { label: 'Milliliters', toBase: 1 },
        l: { label: 'Liters', toBase: 1000 },
        tsp: { label: 'Teaspoons (US)', toBase: 4.92892159375 },
        tbsp: { label: 'Tablespoons (US)', toBase: 14.78676478125 },
        fl_oz: { label: 'Fluid Ounces (US)', toBase: 29.5735295625 },
        cup: { label: 'Cups (US)', toBase: 236.5882365 },
        pt: { label: 'Pints (US)', toBase: 473.176473 },
        qt: { label: 'Quarts (US)', toBase: 946.352946 },
        gal: { label: 'Gallons (US)', toBase: 3785.411784 },
        m3: { label: 'Cubic Meters', toBase: 1000000 }
      }
    },
    temperature: {
      label: 'Temperature',
      base: 'c',
      units: {
        c: { label: 'Celsius' },
        f: { label: 'Fahrenheit' },
        k: { label: 'Kelvin' }
      }
    },
    area: {
      label: 'Area',
      base: 'm2',
      units: {
        mm2: { label: 'Square Millimeters', toBase: 0.000001 },
        cm2: { label: 'Square Centimeters', toBase: 0.0001 },
        m2: { label: 'Square Meters', toBase: 1 },
        ha: { label: 'Hectares', toBase: 10000 },
        km2: { label: 'Square Kilometers', toBase: 1000000 },
        in2: { label: 'Square Inches', toBase: 0.00064516 },
        ft2: { label: 'Square Feet', toBase: 0.09290304 },
        yd2: { label: 'Square Yards', toBase: 0.83612736 },
        acre: { label: 'Acres', toBase: 4046.8564224 },
        mi2: { label: 'Square Miles', toBase: 2589988.110336 }
      }
    },
    speed: {
      label: 'Speed',
      base: 'mps',
      units: {
        mps: { label: 'Meters/second', toBase: 1 },
        kph: { label: 'Kilometers/hour', toBase: 0.277777778 },
        mph: { label: 'Miles/hour', toBase: 0.44704 },
        fps: { label: 'Feet/second', toBase: 0.3048 },
        knot: { label: 'Knots', toBase: 0.514444444 }
      }
    },
    time: {
      label: 'Time',
      base: 's',
      units: {
        ms: { label: 'Milliseconds', toBase: 0.001 },
        s: { label: 'Seconds', toBase: 1 },
        min: { label: 'Minutes', toBase: 60 },
        hr: { label: 'Hours', toBase: 3600 },
        day: { label: 'Days', toBase: 86400 },
        week: { label: 'Weeks', toBase: 604800 },
        month: { label: 'Months (30 days)', toBase: 2592000 },
        year: { label: 'Years (365 days)', toBase: 31536000 }
      }
    },
    data: {
      label: 'Digital Storage',
      base: 'mb',
      units: {
        bit: { label: 'Bits', toBase: 1.1920928955078125e-7 },
        byte: { label: 'Bytes', toBase: 9.5367431640625e-7 },
        kb: { label: 'Kilobytes (KB)', toBase: 0.0009765625 },
        mb: { label: 'Megabytes (MB)', toBase: 1 },
        gb: { label: 'Gigabytes (GB)', toBase: 1024 },
        tb: { label: 'Terabytes (TB)', toBase: 1048576 },
        pb: { label: 'Petabytes (PB)', toBase: 1073741824 }
      }
    }
  };

  var uCategoryEl = document.getElementById('u-category');
  var uFromEl = document.getElementById('u-from');
  var uToEl = document.getElementById('u-to');

  function populateUnitSelects() {
    var category = UNIT_DATA[uCategoryEl.value];
    var units = category.units;
    var keys = Object.keys(units);

    uFromEl.innerHTML = '';
    uToEl.innerHTML = '';

    keys.forEach(function (key) {
      var opt1 = document.createElement('option');
      opt1.value = key;
      opt1.textContent = units[key].label;
      uFromEl.appendChild(opt1);

      var opt2 = document.createElement('option');
      opt2.value = key;
      opt2.textContent = units[key].label;
      uToEl.appendChild(opt2);
    });

    // Default "to" to the second unit if available, for a more useful default
    if (keys.length > 1) {
      uToEl.value = keys[1];
    }

    // Clear previous result when category changes
    var resultEl = document.getElementById('u-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (uCategoryEl) {
    uCategoryEl.addEventListener('change', populateUnitSelects);
    populateUnitSelects(); // initialize on load
  }

  function convertTemperature(value, from, to) {
    // Convert input to Celsius first
    var celsius;
    switch (from) {
      case 'c': celsius = value; break;
      case 'f': celsius = (value - 32) * 5 / 9; break;
      case 'k': celsius = value - 273.15; break;
    }

    // Convert Celsius to target unit
    switch (to) {
      case 'c': return celsius;
      case 'f': return celsius * 9 / 5 + 32;
      case 'k': return celsius + 273.15;
    }
  }

  function calcUnit() {
    var resultEl = document.getElementById('u-result');
    var value = getNum('u-value');
    var categoryKey = uCategoryEl.value;
    var category = UNIT_DATA[categoryKey];
    var from = uFromEl.value;
    var to = uToEl.value;

    if (isNaN(value)) {
      showError(resultEl, 'Please enter a valid number.');
      return;
    }

    var converted;
    if (categoryKey === 'temperature') {
      converted = convertTemperature(value, from, to);
    } else {
      var baseValue = value * category.units[from].toBase;
      converted = baseValue / category.units[to].toBase;
    }

    resultEl.innerHTML =
      '<strong>' + formatNumber(value, 4) + ' ' + category.units[from].label + ' = ' +
      formatNumber(converted, 4) + ' ' + category.units[to].label + '</strong>';
  }


  // ============================================================
  // ADVANCED MATH SOLVER
  // ============================================================

  // ---------- Subtab Navigation ----------
  var subtabButtons = document.querySelectorAll('.subtab-btn');
  var subtabPanels = document.querySelectorAll('.subtab-panel');

  subtabButtons.forEach(function (btn) {
    btn.addEventListener('click', function () {
      var target = btn.getAttribute('data-subtab');

      subtabButtons.forEach(function (b) { b.classList.remove('active'); });
      subtabPanels.forEach(function (p) { p.classList.remove('active'); });

      btn.classList.add('active');
      var panel = document.getElementById(target);
      if (panel) panel.classList.add('active');
    });
  });

  // ---------- Math.js readiness check ----------
  function mathReady() {
    return typeof math !== 'undefined';
  }

  function checkMathLoaded() {
    var note = document.getElementById('am-loading-note');
    if (!note) return;
    if (mathReady()) {
      note.style.display = 'none';
    } else {
      note.textContent = 'Math engine failed to load. Please check your internet connection and refresh the page.';
      note.querySelector && (note.style.color = '#b91c1c');
    }
  }
  // Check shortly after page load (mathjs is loaded with `defer`)
  window.addEventListener('load', function () {
    setTimeout(checkMathLoaded, 300);
  });

  function showMathError(resultEl, message) {
    resultEl.innerHTML = '<span class="error">' + message + '</span>';
  }

  function escapeHtml(str) {
    return String(str)
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  // ---------- Algebra Mode Switching ----------
  var amAlgMode = document.getElementById('am-alg-mode');
  var amAlgInputLabel = document.getElementById('am-alg-input-label');
  var amAlgVarsWrap = document.getElementById('am-alg-vars-wrap');

  function updateAlgebraUI() {
    var mode = amAlgMode.value;
    var inputTextNode = amAlgInputLabel.childNodes[0];

    switch (mode) {
      case 'simplify':
        inputTextNode.textContent = 'Expression';
        document.getElementById('am-alg-input').placeholder = '2x + 3x - 5';
        amAlgVarsWrap.style.display = 'none';
        break;
      case 'evaluate':
        inputTextNode.textContent = 'Expression';
        document.getElementById('am-alg-input').placeholder = 'x^2 + 2x + 1';
        amAlgVarsWrap.style.display = '';
        break;
      case 'linear':
        inputTextNode.textContent = 'Equation (one variable)';
        document.getElementById('am-alg-input').placeholder = '2x + 3 = 11';
        amAlgVarsWrap.style.display = 'none';
        break;
      case 'quadratic':
        inputTextNode.textContent = 'Equation (form ax^2 + bx + c = 0)';
        document.getElementById('am-alg-input').placeholder = 'x^2 - 5x + 6 = 0';
        amAlgVarsWrap.style.display = 'none';
        break;
    }

    var resultEl = document.getElementById('am-alg-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (amAlgMode) {
    amAlgMode.addEventListener('change', updateAlgebraUI);
  }

  // ---------- Algebra: Simplify ----------
  function algSimplify(input) {
    var simplified = math.simplify(input);
    return '<strong>Simplified: <span class="math-expr">' + escapeHtml(simplified.toString()) + '</span></strong>' +
      '<ol class="steps">' +
      '<li>Original expression: <span class="math-expr">' + escapeHtml(input) + '</span></li>' +
      '<li>Combine like terms and apply algebraic identities.</li>' +
      '<li>Result: <span class="math-expr">' + escapeHtml(simplified.toString()) + '</span></li>' +
      '</ol>';
  }

  // ---------- Algebra: Evaluate ----------
  function algEvaluate(input, varsInput) {
    var scope = {};
    if (varsInput && varsInput.trim()) {
      var pairs = varsInput.split(',');
      for (var i = 0; i < pairs.length; i++) {
        var parts = pairs[i].split('=');
        if (parts.length !== 2) {
          throw new Error('Variable assignments must be in the form x=2, y=3');
        }
        var varName = parts[0].trim();
        var varVal = parseFloat(parts[1].trim());
        if (!varName || isNaN(varVal)) {
          throw new Error('Invalid variable assignment: "' + pairs[i].trim() + '"');
        }
        scope[varName] = varVal;
      }
    }

    var result = math.evaluate(input, scope);
    var resultStr = (typeof result === 'object' && result.toString) ? result.toString() : String(result);

    var html = '<strong>Result: <span class="math-expr">' + escapeHtml(resultStr) + '</span></strong><ol class="steps">';
    html += '<li>Expression: <span class="math-expr">' + escapeHtml(input) + '</span></li>';
    if (Object.keys(scope).length > 0) {
      var substituted = input;
      html += '<li>Substitute: ' + Object.keys(scope).map(function (k) { return k + ' = ' + scope[k]; }).join(', ') + '</li>';
    }
    html += '<li>Evaluate: <span class="math-expr">' + escapeHtml(resultStr) + '</span></li>';
    html += '</ol>';
    return html;
  }

  // ---------- Algebra: Linear Equation Solver (ax + b = c) ----------
  function algLinear(input) {
    var sides = input.split('=');
    if (sides.length !== 2) {
      throw new Error('Equation must contain exactly one "=" sign, e.g. 2x + 3 = 11');
    }

    var lhs = sides[0].trim();
    var rhs = sides[1].trim();

    // Move everything to one side: lhs - rhs = 0, then simplify
    var combined = '(' + lhs + ') - (' + rhs + ')';
    var simplified = math.simplify(combined);

    // Detect the variable used
    var varMatch = input.match(/[a-zA-Z]+/);
    if (!varMatch) {
      throw new Error('No variable found in the equation.');
    }
    var varName = varMatch[0];

    // Evaluate coefficient of variable (derivative trick: coefficient = value at slope)
    // For a linear expression a*x + b, derivative w.r.t x gives a, and evaluating at x=0 gives b
    var a, b;
    try {
      var deriv = math.derivative(simplified, varName);
      a = deriv.evaluate();
      var scope0 = {};
      scope0[varName] = 0;
      b = simplified.evaluate(scope0);
    } catch (e) {
      throw new Error('Could not parse as a linear equation. Make sure it is linear in "' + varName + '".');
    }

    if (a === 0) {
      if (b === 0) {
        return '<strong>Infinite solutions</strong><p>This equation is true for all values of ' + varName + ' (it simplifies to 0 = 0).</p>';
      } else {
        return '<strong>No solution</strong><p>This equation has no solution (it simplifies to a false statement like ' + formatNumber(b, 4) + ' = 0).</p>';
      }
    }

    var solution = -b / a;

    var html = '<strong>' + varName + ' = ' + formatNumber(solution, 6).replace(/\.?0+$/, '') + '</strong><ol class="steps">';
    html += '<li>Start: <span class="math-expr">' + escapeHtml(lhs) + ' = ' + escapeHtml(rhs) + '</span></li>';
    html += '<li>Move all terms to one side: <span class="math-expr">' + escapeHtml(simplified.toString()) + ' = 0</span></li>';
    html += '<li>This is in the form ' + formatNumber(a, 4) + varName + ' + (' + formatNumber(b, 4) + ') = 0</li>';
    html += '<li>Subtract the constant: ' + formatNumber(a, 4) + varName + ' = ' + formatNumber(-b, 4) + '</li>';
    html += '<li>Divide both sides by ' + formatNumber(a, 4) + ': ' + varName + ' = ' + formatNumber(solution, 6).replace(/\.?0+$/, '') + '</li>';
    html += '</ol>';
    return html;
  }

  // ---------- Algebra: Quadratic Equation Solver (ax^2 + bx + c = 0) ----------
  function algQuadratic(input) {
    var sides = input.split('=');
    if (sides.length !== 2) {
      throw new Error('Equation must contain exactly one "=" sign, e.g. x^2 - 5x + 6 = 0');
    }

    var lhs = sides[0].trim();
    var rhs = sides[1].trim();
    var combined = '(' + lhs + ') - (' + rhs + ')';
    var simplified = math.simplify(combined);

    var varMatch = input.match(/[a-zA-Z]+/);
    if (!varMatch) {
      throw new Error('No variable found in the equation.');
    }
    var varName = varMatch[0];

    // Extract coefficients a, b, c using derivatives
    // f(x) = a*x^2 + b*x + c
    // f''(x) = 2a -> a = f''(0) / 2
    // f'(0) = b
    // f(0) = c
    var a, b, c;
    try {
      var firstDeriv = math.derivative(simplified, varName);
      var secondDeriv = math.derivative(firstDeriv, varName);

      var scope0 = {};
      scope0[varName] = 0;

      a = secondDeriv.evaluate(scope0) / 2;
      b = firstDeriv.evaluate(scope0);
      c = simplified.evaluate(scope0);
    } catch (e) {
      throw new Error('Could not parse as a quadratic equation. Make sure it is in the form a' + varName + '^2 + b' + varName + ' + c.');
    }

    if (Math.abs(a) < 1e-12) {
      // Not actually quadratic - fall back to linear
      return algLinear(input);
    }

    var discriminant = b * b - 4 * a * c;
    var html = '<ol class="steps">';
    html += '<li>Start: <span class="math-expr">' + escapeHtml(lhs) + ' = ' + escapeHtml(rhs) + '</span></li>';
    html += '<li>Rewrite in standard form: <span class="math-expr">' + escapeHtml(simplified.toString()) + ' = 0</span></li>';
    html += '<li>Identify coefficients: a = ' + formatNumber(a, 4) + ', b = ' + formatNumber(b, 4) + ', c = ' + formatNumber(c, 4) + '</li>';
    html += '<li>Compute discriminant: b&sup2; - 4ac = ' + formatNumber(b, 4) + '&sup2; - 4(' + formatNumber(a, 4) + ')(' + formatNumber(c, 4) + ') = ' + formatNumber(discriminant, 4) + '</li>';

    var resultHeader;
    if (discriminant > 0) {
      var sqrtD = Math.sqrt(discriminant);
      var x1 = (-b + sqrtD) / (2 * a);
      var x2 = (-b - sqrtD) / (2 * a);
      html += '<li>Discriminant is positive: two real solutions exist.</li>';
      html += '<li>Apply the quadratic formula: ' + varName + ' = (-b &plusmn; &radic;(b&sup2;-4ac)) / 2a</li>';
      html += '<li>' + varName + ' = (' + formatNumber(-b, 4) + ' &plusmn; ' + formatNumber(sqrtD, 4) + ') / ' + formatNumber(2 * a, 4) + '</li>';
      resultHeader = '<strong>' + varName + ' = ' + formatNumber(x1, 6).replace(/\.?0+$/, '') +
        ' or ' + varName + ' = ' + formatNumber(x2, 6).replace(/\.?0+$/, '') + '</strong>';
    } else if (discriminant === 0) {
      var x = -b / (2 * a);
      html += '<li>Discriminant is zero: one repeated real solution.</li>';
      html += '<li>' + varName + ' = -b / 2a = ' + formatNumber(-b, 4) + ' / ' + formatNumber(2 * a, 4) + '</li>';
      resultHeader = '<strong>' + varName + ' = ' + formatNumber(x, 6).replace(/\.?0+$/, '') + ' (double root)</strong>';
    } else {
      var realPart = -b / (2 * a);
      var imagPart = Math.sqrt(-discriminant) / (2 * a);
      html += '<li>Discriminant is negative: two complex solutions.</li>';
      html += '<li>' + varName + ' = (-b &plusmn; i&radic;|disc|) / 2a</li>';
      resultHeader = '<strong>' + varName + ' = ' + formatNumber(realPart, 4) + ' &plusmn; ' + formatNumber(imagPart, 4) + 'i</strong>';
    }

    html += '</ol>';
    return resultHeader + html;
  }

  function calcAlgebra() {
    var resultEl = document.getElementById('am-alg-result');
    var mode = amAlgMode.value;
    var input = document.getElementById('am-alg-input').value.trim();

    if (!mathReady()) {
      showMathError(resultEl, 'Math engine is still loading. Please wait a moment and try again.');
      return;
    }

    if (!input) {
      showMathError(resultEl, 'Please enter an expression or equation.');
      return;
    }

    try {
      var html;
      switch (mode) {
        case 'simplify':
          html = algSimplify(input);
          break;
        case 'evaluate':
          html = algEvaluate(input, document.getElementById('am-alg-vars').value.trim());
          break;
        case 'linear':
          html = algLinear(input);
          break;
        case 'quadratic':
          html = algQuadratic(input);
          break;
        default:
          throw new Error('Unknown mode.');
      }
      resultEl.innerHTML = html;
    } catch (err) {
      showMathError(resultEl, 'Error: ' + err.message);
    }
  }

  // ---------- Calculus Mode Switching ----------
  var amCalcMode = document.getElementById('am-calc-mode');
  var amCalcPointLabel = document.getElementById('am-calc-point-label');

  function updateCalculusUI() {
    var mode = amCalcMode.value;
    amCalcPointLabel.style.display = (mode === 'limit') ? '' : 'none';

    var resultEl = document.getElementById('am-calc-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (amCalcMode) {
    amCalcMode.addEventListener('change', updateCalculusUI);
  }

  // ---------- Calculus: Derivative (with step breakdown) ----------
  function calcDerivative(fx, varName) {
    var deriv = math.derivative(fx, varName);
    var simplifiedDeriv = math.simplify(deriv);

    var html = '<strong>d/d' + varName + ' [' + escapeHtml(fx) + '] = <span class="math-expr">' +
      escapeHtml(simplifiedDeriv.toString()) + '</span></strong>';

    html += '<ol class="steps">';
    html += '<li>Function: f(' + varName + ') = <span class="math-expr">' + escapeHtml(fx) + '</span></li>';
    html += '<li>Apply standard differentiation rules (power rule, sum rule, product/chain rule as needed).</li>';
    html += '<li>Raw derivative: <span class="math-expr">' + escapeHtml(deriv.toString()) + '</span></li>';
    html += '<li>Simplified: <span class="math-expr">' + escapeHtml(simplifiedDeriv.toString()) + '</span></li>';
    html += '</ol>';

    html += '<p class="hint">Common rules used: power rule (x^n &rarr; n&middot;x^(n-1)), sum rule (derivative of a sum is the sum of derivatives), ' +
      'product rule ((fg)\' = f\'g + fg\'), and chain rule for compositions like sin(2x).</p>';

    return html;
  }

  // ---------- Calculus: Basic Indefinite Integral (pattern-based) ----------
  // Handles polynomial terms (power rule for integration), and recognizes
  // common patterns: sin, cos, e^x, 1/x. Falls back gracefully otherwise.
  function calcIntegral(fx, varName) {
    var node;
    try {
      node = math.simplify(fx);
    } catch (e) {
      throw new Error('Could not parse the expression.');
    }

    // Split into additive terms for term-by-term integration (handles sums/differences)
    var terms = splitIntoTerms(node);
    var integratedTerms = [];
    var stepLines = [];
    var unsupported = false;

    terms.forEach(function (term) {
      var result = integrateTerm(term.expr, varName);
      if (result === null) {
        unsupported = true;
        stepLines.push('Could not find a basic-pattern antiderivative for: <span class="math-expr">' + escapeHtml(term.sign === -1 ? '-' + term.expr : term.expr) + '</span>');
        return;
      }
      var signedResult = (term.sign === -1) ? '-(' + result.expr + ')' : result.expr;
      integratedTerms.push(signedResult);
      stepLines.push(result.step);
    });

    if (integratedTerms.length === 0) {
      throw new Error('This expression uses patterns beyond basic power/trig/exponential rules. Try breaking it into simpler terms.');
    }

    var combined = integratedTerms.join(' + ').replace(/\+ -\(/g, '- (');
    var simplifiedCombined;
    try {
      simplifiedCombined = math.simplify(combined).toString();
    } catch (e) {
      simplifiedCombined = combined;
    }

    var html = '<strong>&int; ' + escapeHtml(fx) + ' d' + varName + ' = <span class="math-expr">' +
      escapeHtml(simplifiedCombined) + ' + C</span></strong>';

    html += '<ol class="steps">';
    html += '<li>Original: &int; <span class="math-expr">' + escapeHtml(fx) + '</span> d' + varName + '</li>';
    stepLines.forEach(function (line) { html += '<li>' + line + '</li>'; });
    html += '<li>Combine results and add the constant of integration: <span class="math-expr">' + escapeHtml(simplifiedCombined) + ' + C</span></li>';
    html += '</ol>';

    if (unsupported) {
      html += '<p class="hint">Note: some terms could not be integrated using basic power, trig, exponential, or 1/x rules. This solver covers common patterns from high school and early college calculus, not full symbolic integration (e.g. integration by parts, substitution with composite functions, partial fractions).</p>';
    } else {
      html += '<p class="hint">Patterns used: power rule (&int;x^n dx = x^(n+1)/(n+1) + C, for n &ne; -1), &int;1/x dx = ln|x|, and standard trig/exponential antiderivatives.</p>';
    }

    return html;
  }

  // Split an expression node into additive terms with sign info
  function splitIntoTerms(node) {
    var terms = [];

    function walk(n, sign) {
      if (n.type === 'OperatorNode' && n.op === '+' && n.args.length === 2) {
        walk(n.args[0], sign);
        walk(n.args[1], sign);
      } else if (n.type === 'OperatorNode' && n.op === '-' && n.args.length === 2) {
        walk(n.args[0], sign);
        walk(n.args[1], sign * -1);
      } else if (n.type === 'OperatorNode' && n.op === '-' && n.args.length === 1) {
        walk(n.args[0], sign * -1);
      } else {
        terms.push({ expr: n.toString(), sign: sign });
      }
    }

    walk(node, 1);
    return terms;
  }

  // Integrate a single term using basic pattern matching
  // Returns { expr: string, step: string } or null if unsupported
  function integrateTerm(termStr, varName) {
    var t = termStr.trim();

    // Pattern: pure number (constant) -> constant * x
    if (/^-?\d*\.?\d+$/.test(t)) {
      var k = parseFloat(t);
      if (k === 0) return { expr: '0', step: 'Integral of 0 is 0.' };
      var expr = (k === 1) ? varName : k + '*' + varName;
      return { expr: expr, step: '&int; ' + k + ' d' + varName + ' = ' + k + varName };
    }

    // Pattern: x (just the variable)
    if (t === varName) {
      return { expr: '(' + varName + '^2)/2', step: '&int; ' + varName + ' d' + varName + ' = ' + varName + '^2/2 (power rule, n=1)' };
    }

    // Pattern: 1/x or c/x (division form, not yet converted to x^-1)
    var divMatch = t.match(/^(-?\d*\.?\d*)\s*\/\s*\(?\s*([a-zA-Z]+)\s*\)?$/);
    if (divMatch && divMatch[2] === varName) {
      var coeff2 = divMatch[1] === '' || divMatch[1] === '-' ? (divMatch[1] === '-' ? -1 : 1) : parseFloat(divMatch[1]);
      var lnExpr2 = (coeff2 === 1) ? 'log(abs(' + varName + '))' : coeff2 + '*log(abs(' + varName + '))';
      return { expr: lnExpr2, step: '&int; ' + (coeff2 === 1 ? '' : coeff2 + '&middot;') + '1/' + varName + ' d' + varName + ' = ' + (coeff2 === 1 ? '' : coeff2 + '&middot;') + 'ln|' + varName + '|' };
    }

    // Pattern: x^n or coefficient*x^n  (e.g. "3 * x ^ 2", "x ^ 4")
    var powMatch = t.match(/^(-?\d*\.?\d*)\s*\*?\s*\(?\s*([a-zA-Z]+)\s*\)?\s*\^\s*(-?\d*\.?\d+)$/);
    if (powMatch && powMatch[2] === varName) {
      var coeff = powMatch[1] === '' || powMatch[1] === '-' ? (powMatch[1] === '-' ? -1 : 1) : parseFloat(powMatch[1]);
      var n = parseFloat(powMatch[3]);

      if (n === -1) {
        var lnExpr = (coeff === 1) ? 'log(abs(' + varName + '))' : coeff + '*log(abs(' + varName + '))';
        return { expr: lnExpr, step: '&int; ' + (coeff === 1 ? '' : coeff + '&middot;') + '1/' + varName + ' d' + varName + ' = ' + (coeff === 1 ? '' : coeff + '&middot;') + 'ln|' + varName + '|' };
      }

      var newPower = n + 1;
      var newCoeff = coeff / newPower;
      var coeffStr = (Math.abs(newCoeff - 1) < 1e-12) ? '' : formatCoeff(newCoeff) + '*';
      var expr2 = coeffStr + '(' + varName + '^' + formatNumber(newPower, 4).replace(/\.?0+$/, '') + ')';
      return {
        expr: expr2,
        step: '&int; ' + (coeff === 1 ? '' : coeff + '&middot;') + varName + '^' + formatNumber(n, 4).replace(/\.?0+$/, '') +
          ' d' + varName + ' = ' + (coeffStr || '') + varName + '^' + formatNumber(newPower, 4).replace(/\.?0+$/, '') +
          ' (power rule: n &rarr; n+1, divide by new exponent)'
      };
    }

    // Pattern: coefficient*x (e.g. "5 * x")
    var linMatch = t.match(/^(-?\d*\.?\d+)\s*\*?\s*([a-zA-Z]+)$/);
    if (linMatch && linMatch[2] === varName) {
      var c2 = parseFloat(linMatch[1]);
      return { expr: '(' + c2 + '*' + varName + '^2)/2', step: '&int; ' + c2 + varName + ' d' + varName + ' = ' + c2 + varName + '^2/2' };
    }

    // Pattern: sin(x), cos(x), exp(x), e^x
    var sinMatch = t.match(/^sin\(\s*([a-zA-Z]+)\s*\)$/);
    if (sinMatch && sinMatch[1] === varName) {
      return { expr: '-cos(' + varName + ')', step: '&int; sin(' + varName + ') d' + varName + ' = -cos(' + varName + ')' };
    }

    var cosMatch = t.match(/^cos\(\s*([a-zA-Z]+)\s*\)$/);
    if (cosMatch && cosMatch[1] === varName) {
      return { expr: 'sin(' + varName + ')', step: '&int; cos(' + varName + ') d' + varName + ' = sin(' + varName + ')' };
    }

    var expMatch = t.match(/^exp\(\s*([a-zA-Z]+)\s*\)$/);
    if (expMatch && expMatch[1] === varName) {
      return { expr: 'exp(' + varName + ')', step: '&int; e^' + varName + ' d' + varName + ' = e^' + varName };
    }

    return null;
  }

  function formatCoeff(num) {
    if (Math.abs(num - Math.round(num)) < 1e-9) return String(Math.round(num));
    return String(Math.round(num * 10000) / 10000);
  }

  // ---------- Calculus: Numerical Limit Estimate ----------
  function calcLimit(fx, varName, point) {
    var epsilon = 0.0001;
    var scopeLeft = {}, scopeRight = {};
    scopeLeft[varName] = point - epsilon;
    scopeRight[varName] = point + epsilon;

    var leftVal, rightVal, atVal;
    try {
      leftVal = math.evaluate(fx, scopeLeft);
      rightVal = math.evaluate(fx, scopeRight);
    } catch (e) {
      throw new Error('Could not evaluate the function near ' + varName + ' = ' + point + '.');
    }

    try {
      var scopeAt = {};
      scopeAt[varName] = point;
      atVal = math.evaluate(fx, scopeAt);
    } catch (e) {
      atVal = null; // function may be undefined exactly at the point
    }

    var html = '<ol class="steps">';
    html += '<li>Function: f(' + varName + ') = <span class="math-expr">' + escapeHtml(fx) + '</span></li>';
    html += '<li>Evaluate just left of ' + point + ' (' + varName + ' = ' + (point - epsilon) + '): f &asymp; ' + formatNumber(leftVal, 6) + '</li>';
    html += '<li>Evaluate just right of ' + point + ' (' + varName + ' = ' + (point + epsilon) + '): f &asymp; ' + formatNumber(rightVal, 6) + '</li>';

    var resultHeader;
    if (!isFinite(leftVal) || !isFinite(rightVal)) {
      resultHeader = '<strong>Limit appears to diverge (infinite or undefined) near ' + varName + ' = ' + point + '</strong>';
      html += '<li>One or both side evaluations are infinite or undefined - the limit likely does not exist or diverges.</li>';
    } else if (Math.abs(leftVal - rightVal) < 1e-3) {
      var estimate = (leftVal + rightVal) / 2;
      resultHeader = '<strong>Estimated limit &approx; ' + formatNumber(estimate, 6) + '</strong>';
      html += '<li>Left and right estimates agree closely, suggesting the limit exists and is approximately ' + formatNumber(estimate, 6) + '.</li>';
    } else {
      resultHeader = '<strong>Limit may not exist (left and right estimates differ)</strong>';
      html += '<li>Left estimate (' + formatNumber(leftVal, 6) + ') and right estimate (' + formatNumber(rightVal, 6) + ') differ significantly - the two-sided limit may not exist.</li>';
    }

    html += '</ol>';
    html += '<p class="hint">This is a numerical approximation using values very close to the target point (&epsilon; = ' + epsilon + '), not a symbolic limit evaluation. It works well for most continuous functions but may be inaccurate near discontinuities or for indeterminate forms requiring L\'Hopital\'s rule.</p>';

    return resultHeader + html;
  }

  function calcCalculus() {
    var resultEl = document.getElementById('am-calc-result');
    var mode = amCalcMode.value;
    var fx = document.getElementById('am-calc-input').value.trim();
    var varName = document.getElementById('am-calc-var').value.trim() || 'x';

    if (!mathReady()) {
      showMathError(resultEl, 'Math engine is still loading. Please wait a moment and try again.');
      return;
    }

    if (!fx) {
      showMathError(resultEl, 'Please enter a function.');
      return;
    }

    if (!varName || !/^[a-zA-Z]+$/.test(varName)) {
      showMathError(resultEl, 'Please enter a valid variable name (letters only).');
      return;
    }

    try {
      var html;
      switch (mode) {
        case 'derivative':
          html = calcDerivative(fx, varName);
          break;
        case 'integral':
          html = calcIntegral(fx, varName);
          break;
        case 'limit':
          var point = getNum('am-calc-point');
          if (isNaN(point)) {
            showMathError(resultEl, 'Please enter a numeric point to evaluate the limit near.');
            return;
          }
          html = calcLimit(fx, varName, point);
          break;
        default:
          throw new Error('Unknown mode.');
      }
      resultEl.innerHTML = html;
    } catch (err) {
      showMathError(resultEl, 'Error: ' + err.message);
    }
  }

  // ---------- Linear Algebra Mode Switching ----------
  var amLaMode = document.getElementById('am-la-mode');
  var amLaBLabel = document.getElementById('am-la-b-label');
  var amLaALabel = document.getElementById('am-la-a-label');

  function updateLinAlgUI() {
    var mode = amLaMode.value;
    var needsB = (mode === 'add' || mode === 'subtract' || mode === 'multiply');
    amLaBLabel.style.display = needsB ? '' : 'none';

    var aTextNode = amLaALabel.childNodes[0];
    if (mode === 'system') {
      aTextNode.textContent = 'Augmented Matrix [A|b] (rows separated by ; , values by ,)';
      document.getElementById('am-la-a').placeholder = '2,1,5;1,3,10';
    } else {
      aTextNode.textContent = 'Matrix A (rows separated by ; , values by ,)';
      document.getElementById('am-la-a').placeholder = '1,2;3,4';
    }

    var resultEl = document.getElementById('am-la-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (amLaMode) {
    amLaMode.addEventListener('change', updateLinAlgUI);
  }

  // Parse a matrix string like "1,2;3,4" into a 2D array
  function parseMatrix(str) {
    str = str.trim();
    if (!str) throw new Error('Matrix input is empty.');

    var rows = str.split(';').map(function (row) { return row.trim(); }).filter(function (r) { return r.length > 0; });
    var matrix = rows.map(function (row) {
      return row.split(',').map(function (val) {
        var num = parseFloat(val.trim());
        if (isNaN(num)) throw new Error('Invalid number in matrix: "' + val.trim() + '"');
        return num;
      });
    });

    var cols = matrix[0].length;
    for (var i = 0; i < matrix.length; i++) {
      if (matrix[i].length !== cols) {
        throw new Error('All rows must have the same number of columns.');
      }
    }

    return matrix;
  }

  function matrixToHtml(matrix) {
    var html = '<table class="matrix-table"><tbody>';
    matrix.forEach(function (row) {
      html += '<tr>';
      row.forEach(function (val) {
        html += '<td style="padding:2px 8px; border:1px solid #bae6fd; text-align:center;">' + formatNumber(val, 4).replace(/\.?0+$/, '') + '</td>';
      });
      html += '</tr>';
    });
    html += '</tbody></table>';
    return html;
  }

  // ---------- Linear Algebra: Gaussian Elimination with steps ----------
  function gaussianElimination(augmented) {
    var n = augmented.length;
    var m = augmented[0].length;
    var steps = [];
    var matrix = augmented.map(function (row) { return row.slice(); });

    steps.push({ label: 'Starting augmented matrix', matrix: matrix.map(function (r) { return r.slice(); }) });

    // Forward elimination
    for (var col = 0; col < Math.min(n, m - 1); col++) {
      // Find pivot
      var pivotRow = col;
      for (var r = col; r < n; r++) {
        if (Math.abs(matrix[r][col]) > Math.abs(matrix[pivotRow][col])) {
          pivotRow = r;
        }
      }

      if (Math.abs(matrix[pivotRow][col]) < 1e-12) {
        continue; // No pivot in this column; skip
      }

      if (pivotRow !== col) {
        var tmp = matrix[col];
        matrix[col] = matrix[pivotRow];
        matrix[pivotRow] = tmp;
        steps.push({ label: 'Swap row ' + (col + 1) + ' and row ' + (pivotRow + 1) + ' for a better pivot', matrix: matrix.map(function (r) { return r.slice(); }) });
      }

      var pivotVal = matrix[col][col];
      if (Math.abs(pivotVal - 1) > 1e-12) {
        for (var c = 0; c < m; c++) matrix[col][c] /= pivotVal;
        steps.push({ label: 'Normalize row ' + (col + 1) + ' by dividing by ' + formatNumber(pivotVal, 4).replace(/\.?0+$/, ''), matrix: matrix.map(function (r) { return r.slice(); }) });
      }

      for (var row2 = 0; row2 < n; row2++) {
        if (row2 === col) continue;
        var factor = matrix[row2][col];
        if (Math.abs(factor) < 1e-12) continue;
        for (var c2 = 0; c2 < m; c2++) {
          matrix[row2][c2] -= factor * matrix[col][c2];
        }
        steps.push({ label: 'Eliminate column ' + (col + 1) + ' from row ' + (row2 + 1) + ' (R' + (row2 + 1) + ' - ' + formatNumber(factor, 4).replace(/\.?0+$/, '') + '&middot;R' + (col + 1) + ')', matrix: matrix.map(function (r) { return r.slice(); }) });
      }
    }

    return { matrix: matrix, steps: steps };
  }

  function calcLinAlg() {
    var resultEl = document.getElementById('am-la-result');
    var mode = amLaMode.value;

    if (!mathReady()) {
      showMathError(resultEl, 'Math engine is still loading. Please wait a moment and try again.');
      return;
    }

    var aInput = document.getElementById('am-la-a').value.trim();
    var bInput = document.getElementById('am-la-b').value.trim();

    if (!aInput) {
      showMathError(resultEl, 'Please enter Matrix A.');
      return;
    }

    try {
      var A = parseMatrix(aInput);
      var html;

      switch (mode) {
        case 'add':
        case 'subtract': {
          if (!bInput) throw new Error('Please enter Matrix B.');
          var B = parseMatrix(bInput);
          if (A.length !== B.length || A[0].length !== B[0].length) {
            throw new Error('Matrices must have the same dimensions to add or subtract.');
          }
          var opResult = (mode === 'add') ? math.add(A, B) : math.subtract(A, B);
          html = '<strong>Result:</strong>' + matrixToHtml(opResult) +
            '<p class="hint">Matrices are ' + (mode === 'add' ? 'added' : 'subtracted') + ' element-by-element. Both matrices must have the same dimensions.</p>';
          break;
        }
        case 'multiply': {
          if (!bInput) throw new Error('Please enter Matrix B.');
          var B2 = parseMatrix(bInput);
          if (A[0].length !== B2.length) {
            throw new Error('For A &times; B, the number of columns in A (' + A[0].length + ') must equal the number of rows in B (' + B2.length + ').');
          }
          var product = math.multiply(A, B2);
          html = '<strong>Result (A &times; B):</strong>' + matrixToHtml(product) +
            '<p class="hint">Each entry is the dot product of the corresponding row of A and column of B.</p>';
          break;
        }
        case 'det': {
          if (A.length !== A[0].length) {
            throw new Error('Determinant requires a square matrix (equal rows and columns).');
          }
          var det = math.det(A);
          html = '<strong>det(A) = ' + formatNumber(det, 4).replace(/\.?0+$/, '') + '</strong>' +
            '<p class="hint">The determinant indicates whether the matrix is invertible (non-zero) and represents the scaling factor of the linear transformation.</p>';
          break;
        }
        case 'inverse': {
          if (A.length !== A[0].length) {
            throw new Error('Inverse requires a square matrix.');
          }
          var detCheck = math.det(A);
          if (Math.abs(detCheck) < 1e-12) {
            throw new Error('This matrix is singular (determinant = 0) and has no inverse.');
          }
          var inv = math.inv(A);
          html = '<strong>A&#8315;&sup1;:</strong>' + matrixToHtml(inv) +
            '<p class="hint">det(A) = ' + formatNumber(detCheck, 4).replace(/\.?0+$/, '') + ' (non-zero, so the inverse exists).</p>';
          break;
        }
        case 'transpose': {
          var trans = math.transpose(A);
          html = '<strong>A&#7488;:</strong>' + matrixToHtml(trans) +
            '<p class="hint">The transpose flips the matrix over its diagonal, turning rows into columns.</p>';
          break;
        }
        case 'system': {
          if (A[0].length < 2) {
            throw new Error('Augmented matrix must have at least 2 columns (variables + result column).');
          }
          var elim = gaussianElimination(A);
          var finalMatrix = elim.matrix;
          var n = finalMatrix.length;
          var m = finalMatrix[0].length;
          var numVars = m - 1;

          html = '<strong>Solution via Gaussian Elimination:</strong>';
          html += '<ol class="steps">';
          elim.steps.forEach(function (step) {
            html += '<li>' + step.label + matrixToHtml(step.matrix) + '</li>';
          });
          html += '</ol>';

          // Read off solution if reduced to identity-like form
          var solutionLines = [];
          var consistent = true;
          for (var i = 0; i < n; i++) {
            var rowAllZeroExceptLast = finalMatrix[i].slice(0, numVars).every(function (v) { return Math.abs(v) < 1e-9; });
            if (rowAllZeroExceptLast && Math.abs(finalMatrix[i][numVars]) > 1e-9) {
              consistent = false;
            }
          }

          if (!consistent) {
            html += '<p class="hint"><strong>No solution exists</strong> - the system is inconsistent (a row reduces to 0 = nonzero).</p>';
          } else if (n < numVars) {
            html += '<p class="hint">The system has fewer equations than unknowns - it likely has infinitely many solutions (underdetermined).</p>';
          } else {
            for (var v = 0; v < Math.min(n, numVars); v++) {
              solutionLines.push('x' + (v + 1) + ' = ' + formatNumber(finalMatrix[v][numVars], 6).replace(/\.?0+$/, ''));
            }
            if (solutionLines.length > 0) {
              html = '<strong>' + solutionLines.join(', ') + '</strong>' + html;
            }
          }
          break;
        }
        default:
          throw new Error('Unknown mode.');
      }

      resultEl.innerHTML = html;
    } catch (err) {
      showMathError(resultEl, 'Error: ' + err.message);
    }
  }

  // ---------- CS Tools Mode Switching ----------
  var amCsMode = document.getElementById('am-cs-mode');
  var amCsInputLabel = document.getElementById('am-cs-input-label');
  var amCsFromLabel = document.getElementById('am-cs-from-label');
  var amCsToLabel = document.getElementById('am-cs-to-label');

  function updateCsUI() {
    var mode = amCsMode.value;
    var inputTextNode = amCsInputLabel.childNodes[0];

    switch (mode) {
      case 'base':
        inputTextNode.textContent = 'Value';
        document.getElementById('am-cs-input').placeholder = '255';
        amCsFromLabel.style.display = '';
        amCsToLabel.style.display = '';
        break;
      case 'boolean':
        inputTextNode.textContent = 'Boolean Expression (use AND, OR, NOT, XOR, true/false or 1/0)';
        document.getElementById('am-cs-input').placeholder = '(1 AND 0) OR NOT 1';
        amCsFromLabel.style.display = 'none';
        amCsToLabel.style.display = 'none';
        break;
      case 'bigo':
        inputTextNode.textContent = 'Not needed for this mode';
        amCsFromLabel.style.display = 'none';
        amCsToLabel.style.display = 'none';
        break;
    }

    var resultEl = document.getElementById('am-cs-result');
    if (resultEl) resultEl.innerHTML = '';
  }

  if (amCsMode) {
    amCsMode.addEventListener('change', updateCsUI);
  }

  // ---------- CS: Number Base Conversion ----------
  function csBaseConvert(value, fromBase, toBase) {
    value = value.trim();
    var fb = parseInt(fromBase, 10);
    var tb = parseInt(toBase, 10);

    if (!value) throw new Error('Please enter a value to convert.');

    // Validate the input contains only valid digits for the from-base
    var validChars = '0123456789abcdefghijklmnopqrstuvwxyz'.slice(0, fb);
    var lowerValue = value.toLowerCase().replace(/^-/, '');
    for (var i = 0; i < lowerValue.length; i++) {
      if (validChars.indexOf(lowerValue[i]) === -1) {
        throw new Error('"' + value + '" contains invalid digits for base ' + fb + '. Valid digits: ' + validChars);
      }
    }

    var decimalValue = parseInt(value, fb);
    if (isNaN(decimalValue)) {
      throw new Error('Could not parse "' + value + '" as a base-' + fb + ' number.');
    }

    var result = decimalValue.toString(tb).toUpperCase();

    var baseNames = { '2': 'Binary', '8': 'Octal', '10': 'Decimal', '16': 'Hexadecimal' };

    var html = '<strong>Result: <span class="math-expr">' + escapeHtml(result) + '</span> (base ' + tb + ')</strong>';
    html += '<ol class="steps">';
    html += '<li>Input: <span class="math-expr">' + escapeHtml(value) + '</span> (' + (baseNames[fromBase] || 'base ' + fb) + ')</li>';
    html += '<li>Convert to decimal (base 10): ' + decimalValue + '</li>';
    html += '<li>Convert decimal to ' + (baseNames[toBase] || 'base ' + tb) + ': <span class="math-expr">' + escapeHtml(result) + '</span></li>';
    html += '</ol>';

    // Show all common bases for convenience
    html += '<table><tbody>';
    ['2', '8', '10', '16'].forEach(function (b) {
      html += '<tr><td>' + (baseNames[b]) + ' (base ' + b + ')</td><td><span class="math-expr">' + decimalValue.toString(parseInt(b, 10)).toUpperCase() + '</span></td></tr>';
    });
    html += '</tbody></table>';

    return html;
  }

  // ---------- CS: Boolean Logic Evaluator ----------
  function csBooleanEval(expr) {
    var jsExpr = expr
      .replace(/\bAND\b/gi, '&&')
      .replace(/\bOR\b/gi, '||')
      .replace(/\bXOR\b/gi, '!==') // handled specially below via custom replace
      .replace(/\bNOT\b/gi, '!')
      .replace(/\btrue\b/gi, '1')
      .replace(/\bfalse\b/gi, '0');

    // XOR needs boolean coercion; convert "a !== b" pattern back with Boolean()
    // Simplify: replace remaining 1/0 with true/false equivalents for clarity is complex;
    // instead use a safe evaluator with explicit boolean conversion.

    // Re-derive using a small custom tokenizer-based evaluator for safety & correctness
    var result = evalBooleanExpr(expr);

    var html = '<strong>Result: ' + (result ? 'TRUE (1)' : 'FALSE (0)') + '</strong>';
    html += '<ol class="steps">';
    html += '<li>Expression: <span class="math-expr">' + escapeHtml(expr) + '</span></li>';
    html += '<li>Operator precedence (highest to lowest): NOT, AND, XOR, OR</li>';
    html += '<li>Result: <span class="math-expr">' + (result ? '1 (TRUE)' : '0 (FALSE)') + '</span></li>';
    html += '</ol>';
    return html;
  }

  // Small recursive-descent boolean expression evaluator
  // Grammar: OR -> XOR (OR XOR)* ; XOR -> AND (XOR AND)* ; AND -> NOT (AND NOT)* ; NOT -> NOT? PRIMARY ; PRIMARY -> (EXPR) | 1 | 0 | true | false
  function evalBooleanExpr(expr) {
    var tokens = tokenizeBoolean(expr);
    var pos = 0;

    function peek() { return tokens[pos]; }
    function consume() { return tokens[pos++]; }

    function parseOr() {
      var left = parseXor();
      while (peek() === 'OR') {
        consume();
        var right = parseXor();
        left = left || right;
      }
      return left;
    }

    function parseXor() {
      var left = parseAnd();
      while (peek() === 'XOR') {
        consume();
        var right = parseAnd();
        left = (left || right) && !(left && right);
      }
      return left;
    }

    function parseAnd() {
      var left = parseNot();
      while (peek() === 'AND') {
        consume();
        var right = parseNot();
        left = left && right;
      }
      return left;
    }

    function parseNot() {
      if (peek() === 'NOT') {
        consume();
        return !parseNot();
      }
      return parsePrimary();
    }

    function parsePrimary() {
      var tok = consume();
      if (tok === '(') {
        var val = parseOr();
        if (consume() !== ')') throw new Error('Mismatched parentheses.');
        return val;
      }
      if (tok === '1' || tok === 'TRUE') return true;
      if (tok === '0' || tok === 'FALSE') return false;
      throw new Error('Unexpected token: "' + tok + '". Use 1, 0, true, false, AND, OR, NOT, XOR, and parentheses.');
    }

    if (tokens.length === 0) throw new Error('Empty expression.');
    var result = parseOr();
    if (pos < tokens.length) throw new Error('Unexpected extra tokens starting at: "' + tokens[pos] + '"');
    return result;
  }

  function tokenizeBoolean(expr) {
    var upper = expr.toUpperCase();
    var tokens = [];
    var i = 0;
    while (i < upper.length) {
      var ch = upper[i];
      if (/\s/.test(ch)) { i++; continue; }
      if (ch === '(' || ch === ')') { tokens.push(ch); i++; continue; }
      if (ch === '0' || ch === '1') { tokens.push(ch); i++; continue; }

      var matched = false;
      ['AND', 'OR', 'NOT', 'XOR', 'TRUE', 'FALSE'].forEach(function (kw) {
        if (!matched && upper.slice(i, i + kw.length) === kw) {
          tokens.push(kw);
          i += kw.length;
          matched = true;
        }
      });

      if (!matched) {
        throw new Error('Unexpected character or keyword at position ' + i + ': "' + expr[i] + '"');
      }
    }
    return tokens;
  }

  // ---------- CS: Big-O Complexity Reference ----------
  var BIG_O_REFERENCE = [
    { notation: 'O(1)', name: 'Constant', desc: 'Array index access, hash table lookup, push/pop on a stack.' },
    { notation: 'O(log n)', name: 'Logarithmic', desc: 'Binary search, balanced binary search tree operations.' },
    { notation: 'O(n)', name: 'Linear', desc: 'Single loop through an array, linear search, traversing a linked list.' },
    { notation: 'O(n log n)', name: 'Linearithmic', desc: 'Efficient sorting algorithms: merge sort, heap sort, quicksort (average case).' },
    { notation: 'O(n&sup2;)', name: 'Quadratic', desc: 'Nested loops over the same data, bubble sort, insertion sort, selection sort.' },
    { notation: 'O(n&sup3;)', name: 'Cubic', desc: 'Triple nested loops, naive matrix multiplication.' },
    { notation: 'O(2&#8319;)', name: 'Exponential', desc: 'Recursive solutions without memoization (e.g. naive Fibonacci), generating all subsets.' },
    { notation: 'O(n!)', name: 'Factorial', desc: 'Generating all permutations, brute-force traveling salesman.' }
  ];

  function csBigOReference() {
    var html = '<strong>Common Time Complexity Classes (fastest to slowest)</strong>';
    html += '<table class="bigo-table"><tbody>';
    BIG_O_REFERENCE.forEach(function (item) {
      html += '<tr><td>' + item.notation + ' &mdash; ' + item.name + '</td><td>' + item.desc + '</td></tr>';
    });
    html += '</tbody></table>';
    html += '<p class="hint">Big-O describes how an algorithm\'s runtime or memory usage grows as the input size (n) grows, focusing on the dominant term and ignoring constants.</p>';
    return html;
  }

  function calcCs() {
    var resultEl = document.getElementById('am-cs-result');
    var mode = amCsMode.value;

    try {
      var html;
      switch (mode) {
        case 'base': {
          var value = document.getElementById('am-cs-input').value;
          var fromBase = document.getElementById('am-cs-from').value;
          var toBase = document.getElementById('am-cs-to').value;
          html = csBaseConvert(value, fromBase, toBase);
          break;
        }
        case 'boolean': {
          var expr = document.getElementById('am-cs-input').value.trim();
          if (!expr) throw new Error('Please enter a boolean expression.');
          html = csBooleanEval(expr);
          break;
        }
        case 'bigo':
          html = csBigOReference();
          break;
        default:
          throw new Error('Unknown mode.');
      }
      resultEl.innerHTML = html;
    } catch (err) {
      showMathError(resultEl, 'Error: ' + err.message);
    }
  }

  // Initialize UI states on load
  if (amAlgMode) updateAlgebraUI();
  if (amCalcMode) updateCalculusUI();
  if (amLaMode) updateLinAlgUI();
  if (amCsMode) updateCsUI();

  // ============================================================
  // END ADVANCED MATH SOLVER
  // ============================================================

  // ---------- Event Binding (event delegation) ----------
  document.addEventListener('click', function (e) {
    var action = e.target.getAttribute('data-action');
    if (!action) return;

    switch (action) {
      case 'calc-mortgage': calcMortgage(); break;
      case 'calc-loan': calcLoan(); break;
      case 'calc-bmi': calcBmi(); break;
      case 'calc-tip': calcTip(); break;
      case 'calc-percentage': calcPercentage(); break;
      case 'calc-unit': calcUnit(); break;
      case 'calc-algebra': calcAlgebra(); break;
      case 'calc-calculus': calcCalculus(); break;
      case 'calc-linalg': calcLinAlg(); break;
      case 'calc-cs': calcCs(); break;
    }
  });

  // Allow Enter key to trigger calculation within a panel
  document.addEventListener('keydown', function (e) {
    if (e.key !== 'Enter') return;
    var panel = e.target.closest('.calc-panel');
    if (!panel) return;
    var btn = panel.querySelector('.calc-btn');
    if (btn) {
      e.preventDefault();
      btn.click();
    }
  });
})();
