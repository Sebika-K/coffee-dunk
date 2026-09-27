import { auth } from '/static/js/firebase-init.js';
import { onAuthStateChanged } from 'https://www.gstatic.com/firebasejs/12.0.0/firebase-auth.js';

const navAvatarImg = document.getElementById('navAvatar');
const navPill = document.querySelector('.nav-pill');

onAuthStateChanged(auth, (user) => {
  if (user && navAvatarImg) {
    if (user.photoURL) {
      navAvatarImg.src = user.photoURL;
    } else {
      navAvatarImg.src = '/static/assets/default-avatar.jpg';
    }
  }
});
function shouldHideFor(el) {
  return el && (el.matches('input, textarea') || el.isContentEditable);
}

document.addEventListener('focusin', (e) => {
  if (shouldHideFor(e.target)) navPill?.classList.add('nav-pill--hidden');
});

document.addEventListener('focusout', (e) => {
  if (shouldHideFor(e.target)) navPill?.classList.remove('nav-pill--hidden');
});
