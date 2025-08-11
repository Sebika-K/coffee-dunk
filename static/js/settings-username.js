import { auth, db } from '/static/js/firebase-init.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, setDoc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const input = document.getElementById('usernameInput');
const saveBtn = document.getElementById('saveBtn');

let currentUser = null;

onAuthStateChanged(auth, async (u) => {
  if (!u) { location.href = '/login'; return; }
  currentUser = u;

  // Prefill with current name (fallback to email prefix)
  const currentName = u.displayName || (u.email ? u.email.split('@')[0] : '');
  input.value = currentName;
  validate();


  try {
     const snap = await getDoc(doc(db, 'users', u.uid));
     if (snap.exists() && snap.data().username) {
      input.value = snap.data().username;
       validate();
     }
   } catch {}
});

function validate() {
  const name = input.value.trim();
  const ok = /^[\w ]{2,20}$/.test(name); // letters, numbers, underscore, spaces
  saveBtn.disabled = !ok;
}

input.addEventListener('input', validate);
input.addEventListener('keydown', (e) => {
  if (e.key === 'Enter' && !saveBtn.disabled) save();
});

saveBtn.addEventListener('click', save);

async function save() {
  if (!currentUser) return;
  const name = input.value.trim();

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // 1) Update Firebase Auth displayName (what profile page shows)
    await updateProfile(currentUser, { displayName: name });

    // 2) Optional mirror in Firestore for future flexibility
    await setDoc(doc(db, 'users', currentUser.uid), { username: name }, { merge: true });

    // 3) Done → back to profile
    location.href = '/profile';
  } catch (e) {
    alert('Failed to save: ' + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
}