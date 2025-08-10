import { auth, db } from '/static/js/firebase-init.js';
import {
  collection,
  query,
  where,
  orderBy,
  getDocs
} from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-firestore.js';
import { onAuthStateChanged } from "https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js";

const grid = document.getElementById('postsGrid');

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
const unsub = onAuthStateChanged(auth, user => {
  if (!user) {
    grid.innerHTML = '<p style="color:#5c2a2a">Please log in to see your posts.</p>';
    return;
  }
  const name = user.displayName || (user.email ? user.email.split("@")[0] : "You");
  document.querySelector(".top-bar .username")?.replaceChildren(document.createTextNode(name));
  loadMyPosts(user.uid);
});
