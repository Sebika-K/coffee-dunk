import { auth, db } from '/static/js/firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, getDoc, setDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const input  = document.getElementById('bioInput');
const saveBtn= document.getElementById('saveBtn');
const countEl= document.getElementById('bioCount');

let currentUser = null;

function updateCounter() {
  const len = (input.value || '').length;
  countEl.textContent = String(len);
  // enable save if 0<len<=200 after trim
  const trimmed = input.value.trim();
  saveBtn.disabled = !(trimmed.length > 0 && trimmed.length <= 200);
}

input.addEventListener('input', updateCounter);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && (e.metaKey || e.ctrlKey) && !saveBtn.disabled) {
    // Cmd/Ctrl+Enter quick save
    save();
  }
});

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.href = '/login'; return; }
  currentUser = u;

  // Prefill current bio from Firestore users/{uid}
  try {
    const snap = await getDoc(doc(db, 'users', u.uid));
    const bio = snap.exists() ? (snap.data().bio || '') : '';
    input.value = bio;
  } catch {
    input.value = '';
  } finally {
    updateCounter();
  }
});

saveBtn.addEventListener('click', save);

async function save() {
  if (!currentUser) return;
  const bio = input.value.trim();
  if (!bio || bio.length > 200) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    await setDoc(doc(db, 'users', currentUser.uid), { bio }, { merge: true });
    location.href = '/profile';
  } catch (e) {
    alert('Failed to save: ' + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
}