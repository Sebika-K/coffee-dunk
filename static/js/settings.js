import { auth, db } from '/static/js/firebase-init.js';
import { onAuthStateChanged, signOut } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const avatarEl = document.getElementById('settingsAvatar');
const nameEl   = document.getElementById('currentUsername');
const bioEl    = document.getElementById('currentBio');

document.getElementById('goChangePhoto')?.addEventListener('click', () => {
  location.href = '/settings/photo';
});

document.getElementById('logoutBtn')?.addEventListener('click', async () => {
  try { await signOut(auth); location.href = '/login'; } catch (e) { alert('Logout failed: ' + e.message); }
});

onAuthStateChanged(auth, async (user) => {
  if (!user) { location.href = '/login'; return; }

  avatarEl && (avatarEl.src = user.photoURL || '/static/assets/default-avatar.jpg');
  nameEl && (nameEl.textContent = user.displayName || (user.email ? user.email.split('@')[0] : 'You'));

  // Load bio from Firestore (users/{uid}.bio), if present
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const bio = snap.exists() ? (snap.data().bio || '') : '';
    bioEl && (bioEl.textContent = bio || '—');
  } catch { bioEl && (bioEl.textContent = '—'); }
});
