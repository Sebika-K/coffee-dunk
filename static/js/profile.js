import { auth, db, storage } from '/static/js/firebase-init.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { doc, getDoc } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { onAuthStateChanged, updateProfile } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";
import { ref as storageRef, uploadBytes, getDownloadURL } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-storage.js";

const grid = document.getElementById('postsGrid');
const picEl = document.getElementById('profilePic');
const changeBtn = document.getElementById('changeAvatarBtn');
const fileInput = document.getElementById('avatarInput');
const bioEl = document.getElementById('bioText');


changeBtn?.addEventListener('click', () => {
  if (!auth.currentUser) return alert('Please log in first.');
  fileInput?.click();
});

function renderPosts(docs) {
  grid.innerHTML = ''; // clear

  document.getElementById('postCount')?.replaceChildren(document.createTextNode(String(docs.length)));
  document.getElementById('scoreCount')?.replaceChildren(document.createTextNode(String(docs.length * 2)));
  
  if (!docs.length) {
    grid.innerHTML = '<p style="color:#5c2a2a">No posts yet.</p>';
    return;
  }

  // Create a fragment for performance
  const frag = document.createDocumentFragment();

  docs.forEach(doc => {
    const data = doc.data();
    const a = document.createElement('a');
    a.className = 'post-card';
    a.href = `/post/${doc.id}`; // placeholder for future
    a.innerHTML = `<img src="${data.image_url}" alt="User Post" />`;
    frag.appendChild(a);
  });

  grid.appendChild(frag);
}

async function loadMyPosts(uid) {
  // Query posts for this user, newest first
  const q = query(
    collection(db, 'uploads'),
    where('user_id', '==', uid),
    orderBy('created_at', 'desc')
  );

  try {
    const snap = await getDocs(q);
    renderPosts(snap.docs);
  } catch (err) {
    console.error('Failed to load posts:', err);
    grid.innerHTML = '<p style="color:#a33">Failed to load posts.</p>';
  }
}

// Wait for auth, then load
onAuthStateChanged(auth, user => {
  if (!user) {
    grid.innerHTML = '<p style="color:#5c2a2a">Please log in to see your posts.</p>';
    if (picEl) picEl.src = "/static/assets/default-avatar.jpg";
    return;
  }
  const name = user.displayName || (user.email ? user.email.split("@")[0] : "You");
  document.querySelector(".top-bar .username")?.replaceChildren(document.createTextNode(name));
  if (picEl) picEl.src = user.photoURL || "/static/assets/default-avatar.jpg";

  (async () => {
  try {
    const snap = await getDoc(doc(db, 'users', user.uid));
    const bio = snap.exists() ? (snap.data().bio || '') : '';
    if (bioEl) bioEl.textContent = bio || ' ';
  } catch (e) {
    console.warn('Bio load failed:', e);
  }
})();
  loadMyPosts(user.uid);
});
fileInput?.addEventListener('change', async () => {
  const file = fileInput.files?.[0];
  const user = auth.currentUser;
  if (!file || !user) return;

  try {
    const ref = storageRef(storage, `avatars/${user.uid}.jpg`);
    await uploadBytes(ref, file);
    const url = await getDownloadURL(ref);

    await updateProfile(user, { photoURL: url });
    if (picEl) picEl.src = url;

    alert('Profile photo updated!');
  } catch (err) {
    console.error(err);
    alert('Failed to update photo: ' + err.message);
  } finally {
    fileInput.value = '';
  }
});