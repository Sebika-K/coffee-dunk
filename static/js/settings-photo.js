import { auth, storage } from '/static/js/firebase-init.js';
import { onAuthStateChanged, updateProfile } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';
import { ref as storageRef, uploadBytes, getDownloadURL } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';

const fileInput = document.getElementById('fileInput');
const pickBtn   = document.getElementById('pickBtn');
const saveBtn   = document.getElementById('saveBtn');
const previewEl = document.getElementById('preview');

let currentUser = null;
let pickedFile = null;

// Guard page & prefill current avatar
onAuthStateChanged(auth, (u) => {
  if (!u) { location.href = '/login'; return; }
  currentUser = u;
  previewEl.src = u.photoURL || '/static/assets/default-avatar.jpg';
});

pickBtn?.addEventListener('click', () => fileInput?.click());

fileInput?.addEventListener('change', () => {
  pickedFile = fileInput.files?.[0] || null;
  if (!pickedFile) { saveBtn.disabled = true; return; }
  // preview
  const url = URL.createObjectURL(pickedFile);
  previewEl.src = url;
  saveBtn.disabled = false;
});

saveBtn?.addEventListener('click', async () => {
  if (!currentUser || !pickedFile) return;

  saveBtn.disabled = true;
  saveBtn.textContent = 'Saving...';

  try {
    // Store at a stable path; overwrite old
    const path = `avatars/${currentUser.uid}.jpg`;
    const ref = storageRef(storage, path);
    await uploadBytes(ref, pickedFile);
    const downloadURL = await getDownloadURL(ref);

    await updateProfile(currentUser, { photoURL: downloadURL });

    // Redirect back to profile; cache-bust is optional
    location.href = '/profile';
  } catch (e) {
    alert('Failed to save: ' + e.message);
    saveBtn.disabled = false;
    saveBtn.textContent = 'Save';
  }
});