function openModal(card) {
  document.getElementById("modalImage").src = card.dataset.image;
  document.getElementById("modalAvatar").src = card.dataset.avatar;
  document.getElementById("modalUsername").innerText = card.dataset.user;
  document.getElementById("modalCaption").innerText = card.dataset.caption;
  document.getElementById("modalRating").innerText = "Rating: " + card.dataset.rating + " ⭐";

  document.getElementById("postModal").style.display = "block";
}

function closeModal() {
  document.getElementById("postModal").style.display = "none";
}