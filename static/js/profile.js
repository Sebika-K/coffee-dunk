import { auth, db } from '/static/js/firebase-init.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';

const grid = document.getElementById('postsGrid');

function renderPosts(docs) {
  grid.innerHTML = ''; // clear
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
const unsub = auth.onAuthStateChanged(user => {
  if (!user) {
    grid.innerHTML = '<p style="color:#5c2a2a">Please log in to see your posts.</p>';
    return;
  }
  loadMyPosts(user.uid);
});
