const qInput         = document.getElementById('cafeQuery');
const searchBtn      = document.getElementById('cafeSearchBtn');
const resultsEl      = document.getElementById('cafeResults');
const chosenWrap     = document.getElementById('cafeChosen');
const chosenNameEl   = document.getElementById('cafeChosenName');
const clearBtn       = document.getElementById('clearCafe');
const placeIdInput   = document.getElementById('placeIdInput');
const cafeNameInput  = document.getElementById('cafeNameInput');

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

  // Plan to disable the Post button until cafe is selected
  // validateCanPost();
}

function clearChosenCafe() {
  placeIdInput.value  = '';
  cafeNameInput.value = '';
  chosenWrap.style.display = 'none';
  // validateCanPost();
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