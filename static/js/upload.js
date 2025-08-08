import { app, auth, db, storage } from '/static/js/firebase-init.js';
import {
  ref as storageRef,
  uploadBytes,
  getDownloadURL
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js';
import {
  collection,
  addDoc,
  serverTimestamp
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';


const qInput         = document.getElementById('cafeQuery');
const searchBtn      = document.getElementById('cafeSearchBtn');
const resultsEl      = document.getElementById('cafeResults');
const chosenWrap     = document.getElementById('cafeChosen');
const chosenNameEl   = document.getElementById('cafeChosenName');
const clearBtn       = document.getElementById('clearCafe');
const placeIdInput   = document.getElementById('placeIdInput');
const cafeNameInput  = document.getElementById('cafeNameInput');

const uploadForm  = document.getElementById('uploadForm');
const imageInput  = document.getElementById('imageInput');
const imagePreview= document.getElementById('imagePreview');
const ratingInput = document.getElementById('ratingInput');
const captionInput = document.getElementById('captionInput');


const postBtn     = uploadForm?.querySelector('button[type="submit"]');

async function searchCafes() {
  const q = (qInput?.value || '').trim();
  resultsEl.innerHTML = '';
  if (!q) return;

  const liLoading = document.createElement('li');
  liLoading.textContent = 'Searching...';
  resultsEl.appendChild(liLoading);

  try {
    const res = await fetch(`/api/cafes/search?q=${encodeURIComponent(q)}`);
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const data = await res.json();

    resultsEl.innerHTML = '';

    const list = (data && Array.isArray(data.results)) ? data.results : [];
    if (!list.length) {
      const li = document.createElement('li');
      li.textContent = 'No cafés found. Try a different query (e.g., add city).';
      resultsEl.appendChild(li);
      return;
    }

    // Render each result as a clickable <li>
    list.forEach(item => {
      const li = document.createElement('li');
      li.style.cursor = 'pointer';
      li.style.padding = '8px 10px';
      li.style.border = '1px solid #ead8c7';
      li.style.borderRadius = '8px';
      li.style.marginTop = '8px';
      li.innerHTML = `
        <div><strong>${item.name || 'Unknown'}</strong></div>
        <div style="font-size:13px; color:#6b5b53;">${item.address || ''}</div>
        ${item.rating ? `<div style="font-size:13px; color:#6b5b53;">⭐ ${item.rating}</div>` : ''}
      `;
      li.addEventListener('click', () => pickCafe(item.place_id, item.name));
      resultsEl.appendChild(li);
    });

  } catch (err) {
    resultsEl.innerHTML = '';
    const li = document.createElement('li');
    li.textContent = `Search failed. ${err.message}`;
    resultsEl.appendChild(li);
  }
}

function pickCafe(placeId, name) {
  placeIdInput.value  = placeId || '';
  cafeNameInput.value = name   || '';
  chosenNameEl.textContent = name || '(unknown café)';

  chosenWrap.style.display = 'block';
  resultsEl.innerHTML = '';
  validateCanPost();
}

function clearChosenCafe() {
  placeIdInput.value  = '';
  cafeNameInput.value = '';
  chosenWrap.style.display = 'none';
  validateCanPost();
}

// Hook up events
searchBtn?.addEventListener('click', searchCafes);
qInput?.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') {
    e.preventDefault();
    searchCafes();
  }
});
clearBtn?.addEventListener('click', clearChosenCafe);


function validateCanPost() {
  const hasPlace  = !!(placeIdInput && placeIdInput.value);
  const hasImage  = !!(imageInput && imageInput.files && imageInput.files[0]);
  const r         = Number((ratingInput?.value || '').trim());
  const ratingOK  = Number.isFinite(r) && r >= 1 && r <= 5;

  if (postBtn) postBtn.disabled = !(hasPlace && hasImage && ratingOK);
}

// Preview image + revalidate when user picks a file
imageInput?.addEventListener('change', () => {
  if (imageInput.files && imageInput.files[0]) {
    const url = URL.createObjectURL(imageInput.files[0]);
    imagePreview.src = url;
    imagePreview.style.display = 'block';
  } else {
    imagePreview.removeAttribute('src');
    imagePreview.style.display = 'none';
  }
  validateCanPost();
});

// Revalidate when rating changes
ratingInput?.addEventListener('input', validateCanPost);

// Safety: block submit if invalid
uploadForm?.addEventListener('submit', (e) => {
  validateCanPost();
  if (postBtn && postBtn.disabled) {
    e.preventDefault();
    alert('Please select a café, choose an image, and enter a rating (1–5).');
  }
});

// Initial state
validateCanPost();


uploadForm?.addEventListener('submit', async (e) => {
  e.preventDefault();
  validateCanPost();
  if (postBtn?.disabled) return;

  // Gather fields
  const file      = imageInput.files[0];
  const caption   = (captionInput?.value || '').trim();
  const ratingNum = Number(ratingInput?.value);
  const placeId   = placeIdInput?.value || '';
  const cafeName  = cafeNameInput?.value || '';
  const uid       = auth.currentUser?.uid || 'anon';

  if (!file || !placeId || !ratingNum) {
    alert('Missing required info.');
    return;
  }

  // Disable button while working
  postBtn.disabled = true;
  postBtn.textContent = 'Posting...';

  try {
    // 1) Upload to Storage
    const path = `uploads/${uid}/${Date.now()}_${file.name}`;
    const fileRef = storageRef(storage, path);
    await uploadBytes(fileRef, file);
    const downloadURL = await getDownloadURL(fileRef);

    // 2) Write Firestore doc
    await addDoc(collection(db, 'uploads'), {
      image_url:  downloadURL,
      caption:    caption,
      rating:     ratingNum,
      place_id:   placeId,
      cafe_name:  cafeName,
      user_id:    uid,
      created_at: serverTimestamp()
    });

    // 3) Redirect 
    // window.location.href = `/cafe/${encodeURIComponent(placeId)}?name=${encodeURIComponent(cafeName)}`;
    window.location.href = '/profile';

  } catch (err) {
    console.error(err);
    alert('Upload failed: ' + err.message);
    postBtn.disabled = false;
    postBtn.textContent = 'Post';
    return;
  }
});