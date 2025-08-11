import { auth } from '/static/js/firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';

const navAvatarImg = document.getElementById('navAvatar');

onAuthStateChanged(auth, (user) => {
  if (user && navAvatarImg) {
    if (user.photoURL) {
      navAvatarImg.src = user.photoURL;
    } else {
      navAvatarImg.src = '/static/assets/default-avatar.jpg';
    }
  }
});