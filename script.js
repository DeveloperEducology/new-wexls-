/**
 * script.js — Local Extension Testing Playground
 * Handles: form data collection, Indian student data generation,
 * custom event dispatching, mutation observation, localStorage,
 * developer console UI, and globally exposed test APIs.
 */

/* ===================================================
   INDIAN STUDENT DATA POOLS
   =================================================== */
const DATA = {
  studentFirstNames: [
    'Rahul', 'Arjun', 'Aditya', 'Karthik', 'Sai', 'Venkat', 'Ravi',
    'Suresh', 'Manoj', 'Naveen', 'Deepak', 'Akash', 'Rohit', 'Vijay',
    'Priya', 'Divya', 'Anusha', 'Kavya', 'Pooja', 'Srija', 'Mounika',
    'Swathi', 'Padma', 'Sravani', 'Harsha', 'Tejaswi', 'Bhavana', 'Nandini',
  ],
  lastNames: [
    'Kumar', 'Reddy', 'Sharma', 'Singh', 'Varma', 'Rao', 'Patel',
    'Gupta', 'Naidu', 'Verma', 'Nair', 'Pillai', 'Iyer', 'Chowdary',
    'Prasad', 'Goud', 'Yadav', 'Mishra', 'Dubey', 'Tiwari',
  ],
  fatherFirstNames: [
    'Ramesh', 'Rajesh', 'Suresh', 'Mahesh', 'Naresh', 'Prakash',
    'Venkata', 'Srinivas', 'Hari', 'Gopala', 'Krishna', 'Ranga',
    'Balarama', 'Chandra', 'Murali', 'Anand', 'Ganesh', 'Satish',
  ],
  motherFirstNames: [
    'Sunitha', 'Savitha', 'Lakshmi', 'Padmavathi', 'Sridevi', 'Vasantha',
    'Saraswathi', 'Kamala', 'Meena', 'Geetha', 'Sumathi', 'Vimala',
    'Indira', 'Shantha', 'Rani', 'Aruna', 'Usha', 'Vijaya',
  ],
  occupations: [
    'Farmer', 'Government Employee', 'Business', 'Teacher', 'Auto Driver',
    'Carpenter', 'Daily Wage Laborer', 'Police Officer', 'Bank Employee',
    'Shopkeeper', 'Mechanic', 'Doctor', 'Engineer', 'Weaver',
  ],
  schools: [
    'ZPHS', 'Zilla Parishad High School', 'Government High School',
    'Kendriya Vidyalaya', 'Navodaya Vidyalaya', 'Sainik School',
    'Mandal Parishad Upper Primary School', 'St. Ann\'s High School',
    'Sri Saraswathi Vidya Mandir', 'Sri Chaitanya High School',
  ],
  states: [
    { name: 'Andhra Pradesh', districts: [
      { name: 'Kurnool', cities: ['Kurnool', 'Nandyal', 'Adoni'], streets: ['Main Road', 'Gandhi Nagar', 'Station Road'], pincodes: ['518001', '518001', '518301'] },
      { name: 'Krishna', cities: ['Vijayawada', 'Machilipatnam', 'Gudivada'], streets: ['Bandar Road', 'MG Road', 'Canal Road'], pincodes: ['520001', '521001', '521301'] },
      { name: 'Guntur', cities: ['Guntur', 'Tenali', 'Narasaraopet'], streets: ['Collector Road', 'Brodipet', 'Market Street'], pincodes: ['522001', '522201', '522601'] },
      { name: 'Srikakulam', cities: ['Srikakulam', 'Palasa', 'Narasannapeta'], streets: ['Old Town', 'Bus Stand Road', 'Temple Street'], pincodes: ['532001', '532201', '532421'] },
    ]},
    { name: 'Telangana', districts: [
      { name: 'Hyderabad', cities: ['Hyderabad', 'Secunderabad', 'Kukatpally'], streets: ['Banjara Hills', 'Jubilee Hills', 'Ameerpet'], pincodes: ['500001', '500003', '500072'] },
      { name: 'Warangal', cities: ['Warangal', 'Kazipet', 'Hanamkonda'], streets: ['Station Road', 'Main Bazaar', 'Subedari'], pincodes: ['506001', '506003', '506001'] },
      { name: 'Nalgonda', cities: ['Nalgonda', 'Miryalaguda', 'Suryapet'], streets: ['Gandhi Road', 'Collector Office Road', 'Market Yard'], pincodes: ['508001', '508207', '508213'] },
    ]},
    { name: 'Maharashtra', districts: [
      { name: 'Pune', cities: ['Pune', 'Pimpri', 'Chinchwad'], streets: ['FC Road', 'MG Road', 'Laxmi Road'], pincodes: ['411001', '411017', '411033'] },
      { name: 'Nashik', cities: ['Nashik', 'Malegaon', 'Deolali'], streets: ['Sharanpur Road', 'College Road', 'Old Agra Road'], pincodes: ['422001', '423203', '422401'] },
    ]},
    { name: 'Karnataka', districts: [
      { name: 'Bengaluru', cities: ['Bengaluru', 'Electronic City', 'Whitefield'], streets: ['MG Road', 'Brigade Road', 'Koramangala'], pincodes: ['560001', '560100', '560066'] },
      { name: 'Mysuru', cities: ['Mysuru', 'Mandya', 'Hassan'], streets: ['Sayyaji Rao Road', 'K R Circle', 'VV Road'], pincodes: ['570001', '571401', '573201'] },
    ]},
    { name: 'Tamil Nadu', districts: [
      { name: 'Chennai', cities: ['Chennai', 'Tambaram', 'Avadi'], streets: ['Anna Salai', 'T Nagar', 'Velachery Main Road'], pincodes: ['600001', '600045', '600062'] },
      { name: 'Madurai', cities: ['Madurai', 'Dindigul', 'Sivakasi'], streets: ['Madurai Main Road', 'VVD Road', 'Town Hall Road'], pincodes: ['625001', '624001', '626123'] },
    ]},
  ],
  classes: ['Class 5', 'Class 6', 'Class 7', 'Class 8', 'Class 9', 'Class 10'],
  mediums: ['English', 'Telugu', 'Hindi'],
  examCategories: ['JNVST', 'Sainik School', 'Olympiad', 'NTSE', 'Foundation'],
};

/* ===================================================
   UTILITY FUNCTIONS
   =================================================== */
function pick(arr) {
  return arr[Math.floor(Math.random() * arr.length)];
}

function pickIndex(arr) {
  return Math.floor(Math.random() * arr.length);
}

function randomDOB(minAge = 10, maxAge = 16) {
  const now = new Date();
  const yearRange = maxAge - minAge;
  const birthYear = now.getFullYear() - minAge - Math.floor(Math.random() * yearRange);
  const birthMonth = String(Math.floor(Math.random() * 12) + 1).padStart(2, '0');
  const birthDay = String(Math.floor(Math.random() * 28) + 1).padStart(2, '0');
  return `${birthYear}-${birthMonth}-${birthDay}`;
}

function randomMobile() {
  const starts = ['6', '7', '8', '9'];
  const start = pick(starts);
  let num = start;
  for (let i = 0; i < 9; i++) num += Math.floor(Math.random() * 10);
  return num;
}

function currentTimestamp() {
  return new Date().toLocaleTimeString('en-IN', { hour12: false });
}

function escapeHtml(str) {
  const div = document.createElement('div');
  div.textContent = str;
  return div.innerHTML;
}

/* ===================================================
   DOM REFERENCES
   =================================================== */
const form               = document.getElementById('studentRegistrationForm');
const extensionBadge     = document.getElementById('extensionStatus');
const jsonViewer         = document.getElementById('jsonViewer');
const localStorageViewer = document.getElementById('localStorageViewer');
const eventLogConsole    = document.getElementById('eventLogConsole');
const submissionCounter  = document.getElementById('submissionCount');
const lastUpdatedEl      = document.getElementById('lastUpdated');
const toggleBtn          = document.getElementById('toggleDevTools');
const devToolsContent    = document.getElementById('devToolsContent');

// Buttons
const btnLoadSample = document.getElementById('btnLoadSample');
const btnRandom     = document.getElementById('btnRandom');
const btnClear      = document.getElementById('btnClear');
const btnCopy       = document.getElementById('btnCopy');
const btnDownload   = document.getElementById('btnDownload');

/* ===================================================
   STATE
   =================================================== */
let submissionCount = 0;
let lastJSON = null;

/* ===================================================
   EXTENSION STATUS CHECKER
   =================================================== */
function checkExtensionStatus() {
  const connected = window.myExtensionInstalled === true;
  if (connected) {
    extensionBadge.textContent = '🟢 Extension Connected';
    extensionBadge.className = 'badge badge-connected';
  } else {
    extensionBadge.textContent = '🔴 Extension Not Detected';
    extensionBadge.className = 'badge badge-disconnected';
  }
}

// Poll every 500ms so the badge updates automatically when extension injects
setInterval(checkExtensionStatus, 500);
checkExtensionStatus();

/* ===================================================
   TOAST NOTIFICATION
   =================================================== */
const toastContainer = document.createElement('div');
toastContainer.id = 'toastContainer';
document.body.appendChild(toastContainer);

function showToast(message, type = 'info', duration = 3000) {
  const toast = document.createElement('div');
  toast.className = `toast ${type}`;
  toast.style.setProperty('--duration', `${duration - 250}ms`);
  toast.textContent = message;
  toastContainer.appendChild(toast);
  setTimeout(() => toast.remove(), duration);
}

/* ===================================================
   CONSOLE LOG PANEL
   =================================================== */
function logToConsole(message, type = 'info') {
  const line = document.createElement('div');
  line.className = `console-line ${type}-log`;
  line.innerHTML = `<span class="log-time">[${currentTimestamp()}]</span> ${escapeHtml(message)}`;
  eventLogConsole.appendChild(line);
  eventLogConsole.scrollTop = eventLogConsole.scrollHeight;

  // Keep log to last 200 entries
  while (eventLogConsole.children.length > 200) {
    eventLogConsole.removeChild(eventLogConsole.firstChild);
  }
}

/* ===================================================
   FORM DATA COLLECTION
   =================================================== */
function collectFormData() {
  const fd = new FormData(form);
  const data = {};
  for (const [key, value] of fd.entries()) {
    data[key] = value;
  }
  // Capture radio groups that may be unchecked (FormData skips them)
  ['gender', 'medium'].forEach(name => {
    const checked = form.querySelector(`input[name="${name}"]:checked`);
    data[name] = checked ? checked.value : '';
  });
  return data;
}

function updateJSONViewer(data) {
  const json = JSON.stringify(data, null, 2);
  jsonViewer.textContent = json;
}

function updateLocalStorageViewer() {
  const raw = localStorage.getItem('studentFormData');
  if (raw) {
    try {
      const parsed = JSON.parse(raw);
      localStorageViewer.textContent = JSON.stringify(parsed, null, 2);
    } catch {
      localStorageViewer.textContent = raw;
    }
  } else {
    localStorageViewer.textContent = 'No data stored';
  }
}

function updateLastUpdated() {
  lastUpdatedEl.textContent = new Date().toLocaleTimeString('en-IN', { hour12: true });
}

/* ===================================================
   FORM SUBMIT HANDLER (Req. 3)
   =================================================== */
form.addEventListener('submit', (e) => {
  e.preventDefault();

  // Validate
  if (!validateForm()) {
    showToast('Please fill all required fields correctly.', 'error');
    logToConsole('Submission blocked — validation failed.', 'error');
    return;
  }

  const formData = collectFormData();
  lastJSON = formData;
  submissionCount++;

  // Update JSON viewer
  updateJSONViewer(formData);

  // Store in localStorage
  localStorage.setItem('studentFormData', JSON.stringify(formData));
  updateLocalStorageViewer();

  // Print to browser console
  console.group('[Extension Playground] studentFormSubmitted');
  console.log(formData);
  console.groupEnd();

  // Dispatch custom event
  const event = new CustomEvent('studentFormSubmitted', {
    detail: formData,
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);

  // Update UI
  submissionCounter.textContent = submissionCount;
  updateLastUpdated();
  logToConsole(`studentFormSubmitted dispatched — Student: ${formData.studentName}, Class: ${formData.class}, Category: ${formData.examCategory}`, 'submit');
  showToast('Form submitted! Custom event dispatched ✓', 'success');
});

/* ===================================================
   MUTATION TESTING — formFieldChanged (Req. 10)
   =================================================== */
function dispatchFieldChanged(field, value) {
  const event = new CustomEvent('formFieldChanged', {
    detail: { field, value },
    bubbles: true,
    composed: true,
  });
  window.dispatchEvent(event);
  document.dispatchEvent(event);

  // Live-update JSON viewer on every change
  const current = collectFormData();
  updateJSONViewer(current);
  updateLastUpdated();
  logToConsole(`formFieldChanged — field: "${field}", value: "${String(value).substring(0, 40)}"`, 'field');
}

// Attach input listeners to every form control
form.querySelectorAll('input, select, textarea').forEach((el) => {
  const eventType = (el.type === 'checkbox' || el.type === 'radio') ? 'change' : 'input';
  el.addEventListener(eventType, () => {
    clearFieldError(el);
    dispatchFieldChanged(el.name || el.id, el.type === 'checkbox' ? el.checked : el.value);
  });
});

/* ===================================================
   FORM VALIDATION
   =================================================== */
function validateForm() {
  let valid = true;

  const rules = [
    { id: 'studentName',    groupId: 'studentName',    check: v => v.trim().length >= 2 },
    { id: 'fatherName',     groupId: 'fatherName',     check: v => v.trim().length >= 2 },
    { id: 'motherName',     groupId: 'motherName',     check: v => v.trim().length >= 2 },
    { id: 'dob',            groupId: 'dob',            check: v => v !== '' },
    { id: 'mobile',         groupId: 'mobile',         check: v => /^[6-9][0-9]{9}$/.test(v) },
    { id: 'email',          groupId: 'email',          check: v => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v) },
    { id: 'houseNumber',    groupId: 'houseNumber',    check: v => v.trim().length >= 1 },
    { id: 'street',         groupId: 'street',         check: v => v.trim().length >= 2 },
    { id: 'city',           groupId: 'city',           check: v => v.trim().length >= 2 },
    { id: 'district',       groupId: 'district',       check: v => v.trim().length >= 2 },
    { id: 'state',          groupId: 'state',          check: v => v.trim().length >= 2 },
    { id: 'pincode',        groupId: 'pincode',        check: v => /^[1-9][0-9]{5}$/.test(v) },
    { id: 'class',          groupId: 'class',          check: v => v !== '' },
    { id: 'examCategory',   groupId: 'examCategory',   check: v => v !== '' },
    { id: 'schoolName',     groupId: 'schoolName',     check: v => v.trim().length >= 2 },
    { id: 'parentName',     groupId: 'parentName',     check: v => v.trim().length >= 2 },
    { id: 'parentMobile',   groupId: 'parentMobile',   check: v => /^[6-9][0-9]{9}$/.test(v) },
    { id: 'parentOccupation', groupId: 'parentOccupation', check: v => v.trim().length >= 2 },
  ];

  rules.forEach(({ id, groupId, check }) => {
    const el = document.getElementById(id);
    if (!el) return;
    const ok = check(el.value);
    if (!ok) {
      showFieldError(el, groupId);
      valid = false;
    } else {
      clearFieldError(el);
    }
  });

  // Validate radio groups
  const genderChecked = form.querySelector('input[name="gender"]:checked');
  if (!genderChecked) {
    document.getElementById('genderError').parentElement.classList.add('show-error');
    valid = false;
  } else {
    document.getElementById('genderError').parentElement.classList.remove('show-error');
  }

  const mediumChecked = form.querySelector('input[name="medium"]:checked');
  if (!mediumChecked) {
    document.getElementById('mediumError').parentElement.classList.add('show-error');
    valid = false;
  } else {
    document.getElementById('mediumError').parentElement.classList.remove('show-error');
  }

  return valid;
}

function showFieldError(el, groupId) {
  el.classList.add('invalid');
  el.classList.remove('valid');
  const group = el.closest('.form-group');
  if (group) group.classList.add('show-error');
}

function clearFieldError(el) {
  el.classList.remove('invalid');
  if (el.value && el.value.trim() !== '') el.classList.add('valid');
  else el.classList.remove('valid');
  const group = el.closest('.form-group');
  if (group) group.classList.remove('show-error');
}

/* ===================================================
   FILL FORM HELPER
   =================================================== */
function fillFormWithData(data) {
  Object.entries(data).forEach(([key, value]) => {
    const el = document.getElementById(key);
    if (!el) {
      // Handle radio groups
      const radio = form.querySelector(`input[name="${key}"][value="${value}"]`);
      if (radio) {
        radio.checked = true;
        radio.dispatchEvent(new Event('change', { bubbles: true }));
      }
      return;
    }
    if (el.tagName === 'SELECT') {
      el.value = value;
    } else {
      el.value = value;
    }
    el.dispatchEvent(new Event('input', { bubbles: true }));
  });
}

/* ===================================================
   SAMPLE DATA (Req. 6 - fixed sample)
   =================================================== */
const SAMPLE_STUDENT = {
  studentName:      'Rahul Kumar',
  fatherName:       'Ramesh Kumar',
  motherName:       'Sunitha',
  dob:              '2012-06-15',
  gender:           'Male',
  mobile:           '9876543210',
  email:            'rahul.kumar@example.com',
  houseNumber:      '12-34',
  street:           'Gandhi Nagar',
  city:             'Kurnool',
  district:         'Kurnool',
  state:            'Andhra Pradesh',
  pincode:          '518001',
  class:            'Class 6',
  medium:           'Telugu',
  examCategory:     'JNVST',
  schoolName:       'ZPHS Kurnool',
  parentName:       'Ramesh Kumar',
  parentMobile:     '9876500000',
  parentOccupation: 'Farmer',
  additionalInfo:   'Interested in science olympiad. Needs transport accommodation.',
};

/* ===================================================
   GENERATE RANDOM STUDENT (Req. 6)
   =================================================== */
function generateRandomStudent() {
  const firstName   = pick(DATA.studentFirstNames);
  const lastName    = pick(DATA.lastNames);
  const fatherFirst = pick(DATA.fatherFirstNames);
  const motherFirst = pick(DATA.motherFirstNames);

  const stateObj   = pick(DATA.states);
  const distObj    = pick(stateObj.districts);
  const cityIdx    = pickIndex(distObj.cities);
  const city       = distObj.cities[cityIdx];
  const street     = distObj.streets[cityIdx] || pick(distObj.streets);
  const pincode    = distObj.pincodes[cityIdx] || pick(distObj.pincodes);
  const schoolBase = pick(DATA.schools);
  const schoolName = `${schoolBase} ${distObj.name}`;

  const gender       = Math.random() > 0.5 ? 'Male' : 'Female';
  const examCategory = pick(DATA.examCategories);
  const medium       = pick(DATA.mediums);
  const studentClass = pick(DATA.classes);

  return {
    studentName:      `${firstName} ${lastName}`,
    fatherName:       `${fatherFirst} ${lastName}`,
    motherName:       `${motherFirst} ${lastName}`,
    dob:              randomDOB(10, 16),
    gender,
    mobile:           randomMobile(),
    email:            `${firstName.toLowerCase()}.${lastName.toLowerCase()}${Math.floor(Math.random() * 99) + 1}@gmail.com`,
    houseNumber:      `${Math.floor(Math.random() * 999) + 1}-${Math.floor(Math.random() * 50) + 1}`,
    street,
    city,
    district:         distObj.name,
    state:            stateObj.name,
    pincode,
    class:            studentClass,
    medium,
    examCategory,
    schoolName,
    parentName:       `${fatherFirst} ${lastName}`,
    parentMobile:     randomMobile(),
    parentOccupation: pick(DATA.occupations),
    additionalInfo:   '',
  };
}

/* ===================================================
   BUTTON HANDLERS
   =================================================== */
btnLoadSample.addEventListener('click', () => {
  fillFormWithData(SAMPLE_STUDENT);
  logToConsole('Sample data loaded into form.', 'info');
  showToast('Sample data loaded ✓', 'success');
});

btnRandom.addEventListener('click', () => {
  const student = generateRandomStudent();
  fillFormWithData(student);
  logToConsole(`Random student generated: ${student.studentName} | ${student.class} | ${student.examCategory} | ${student.state}`, 'info');
  showToast(`Random student: ${student.studentName}`, 'info');
});

btnClear.addEventListener('click', () => {
  window.clearForm();
  logToConsole('Form cleared by user.', 'info');
  showToast('Form cleared', 'info');
});

btnCopy.addEventListener('click', () => {
  const data = collectFormData();
  const json = JSON.stringify(data, null, 2);
  navigator.clipboard.writeText(json)
    .then(() => {
      showToast('JSON copied to clipboard ✓', 'success');
      logToConsole('Form JSON copied to clipboard.', 'info');
    })
    .catch(() => {
      // Fallback for non-secure contexts
      const ta = document.createElement('textarea');
      ta.value = json;
      ta.style.position = 'fixed';
      ta.style.opacity = '0';
      document.body.appendChild(ta);
      ta.select();
      document.execCommand('copy');
      ta.remove();
      showToast('JSON copied to clipboard ✓', 'success');
    });
});

btnDownload.addEventListener('click', () => {
  const data = collectFormData();
  const json = JSON.stringify(data, null, 2);
  const blob = new Blob([json], { type: 'application/json' });
  const url  = URL.createObjectURL(blob);
  const a    = document.createElement('a');
  const name = (data.studentName || 'student').replace(/\s+/g, '_').toLowerCase();
  a.href     = url;
  a.download = `${name}_form_data.json`;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
  logToConsole(`JSON downloaded as "${a.download}".`, 'info');
  showToast('JSON downloaded ✓', 'success');
});

/* ===================================================
   DEVELOPER TOOLS PANEL TOGGLE
   =================================================== */
toggleBtn.addEventListener('click', () => {
  const isExpanded = toggleBtn.getAttribute('aria-expanded') === 'true';
  toggleBtn.setAttribute('aria-expanded', String(!isExpanded));
  devToolsContent.classList.toggle('collapsed', isExpanded);
});

/* ===================================================
   GLOBAL TEST APIs (Req. 9)
   =================================================== */

/**
 * Returns the current form data as a plain object.
 * Usage: window.getFormData()
 */
window.getFormData = function () {
  return collectFormData();
};

/**
 * Fills the form with the fixed sample student data.
 * Usage: window.fillSample()
 */
window.fillSample = function () {
  fillFormWithData(SAMPLE_STUDENT);
  logToConsole('[API] window.fillSample() called.', 'info');
};

/**
 * Clears all form fields and resets validation states.
 * Usage: window.clearForm()
 */
window.clearForm = function () {
  form.reset();
  form.querySelectorAll('input, select, textarea').forEach((el) => {
    el.classList.remove('valid', 'invalid');
    const group = el.closest('.form-group');
    if (group) group.classList.remove('show-error');
  });
  updateJSONViewer({});
  logToConsole('[API] window.clearForm() called.', 'info');
};

/**
 * Programmatically triggers form submission.
 * Usage: window.submitForm()
 */
window.submitForm = function () {
  logToConsole('[API] window.submitForm() called.', 'info');
  form.dispatchEvent(new Event('submit', { bubbles: true, cancelable: true }));
};

/* ===================================================
   LISTEN TO OWN EVENTS (for Dev Panel logging)
   =================================================== */
window.addEventListener('studentFormSubmitted', (e) => {
  console.log('[Playground] Received studentFormSubmitted event:', e.detail);
});

window.addEventListener('formFieldChanged', (e) => {
  // Intentionally kept light — per-field logging is done in dispatchFieldChanged
});

/* ===================================================
   INITIALIZE ON LOAD
   =================================================== */
document.addEventListener('DOMContentLoaded', () => {
  updateJSONViewer({});
  updateLocalStorageViewer();
  logToConsole('Playground initialized. All APIs ready on window object.', 'system');
  logToConsole('Try: window.fillSample(), window.getFormData(), window.clearForm(), window.submitForm()', 'system');
  console.info(
    '%c[Extension Playground] Ready%c\nAPIs: window.getFormData() | window.fillSample() | window.clearForm() | window.submitForm()',
    'color: #6366f1; font-weight: bold; font-size: 14px;',
    'color: #6b7280;'
  );
});
