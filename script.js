const deck = document.querySelector('#serviceDeck');
const cards = [...deck.querySelectorAll('.service-card')];
const previousButton = document.querySelector('#previousService');
const nextButton = document.querySelector('#nextService');
const progress = document.querySelector('#deckProgress');
const reduceMotion = window.matchMedia('(prefers-reduced-motion: reduce)');

let activeIndex = 0;
let pointerStart = 0;
let pointerNow = 0;
let dragging = false;

function circularDistance(index, active, total) {
  return (index - active + total) % total;
}

function renderDeck(animate = true) {
  cards.forEach((card, index) => {
    const position = circularDistance(index, activeIndex, cards.length);
    const visiblePosition = Math.min(position, 3);
    const translateX = visiblePosition * 18;
    const translateY = visiblePosition * 12;
    const scale = 1 - visiblePosition * 0.045;
    const opacity = position > 3 ? 0 : 1 - visiblePosition * 0.2;

    card.style.zIndex = String(cards.length - position);
    card.style.opacity = String(opacity);
    card.style.filter = `brightness(${1 - visiblePosition * 0.12})`;
    card.style.pointerEvents = position === 0 ? 'auto' : 'none';
    card.style.transform = `translate3d(${translateX}px, ${translateY}px, ${-visiblePosition * 40}px) scale(${scale})`;
    card.style.transitionDuration = animate && !reduceMotion.matches ? '' : '0ms';
    card.setAttribute('aria-hidden', position === 0 ? 'false' : 'true');
  });

  progress.style.transform = `translateX(${activeIndex * 100}%)`;
  deck.setAttribute('aria-label', `Servicios disponibles. Tarjeta ${activeIndex + 1} de ${cards.length}: ${cards[activeIndex].querySelector('h3').textContent}`);
}

function moveDeck(direction) {
  activeIndex = (activeIndex + direction + cards.length) % cards.length;
  renderDeck();
}

function beginDrag(clientX) {
  dragging = true;
  pointerStart = clientX;
  pointerNow = clientX;
  cards[activeIndex].classList.add('is-dragging');
}

function updateDrag(clientX) {
  if (!dragging) return;
  pointerNow = clientX;
  const delta = pointerNow - pointerStart;
  const rotation = Math.max(-7, Math.min(7, delta / 30));
  cards[activeIndex].style.transform = `translate3d(${delta}px, 0, 0) rotate(${rotation}deg)`;
  cards[activeIndex].style.opacity = String(Math.max(.55, 1 - Math.abs(delta) / 420));
}

function endDrag() {
  if (!dragging) return;
  const delta = pointerNow - pointerStart;
  cards[activeIndex].classList.remove('is-dragging');
  dragging = false;

  if (Math.abs(delta) > 65) {
    moveDeck(delta < 0 ? 1 : -1);
  } else {
    renderDeck();
  }
}

deck.addEventListener('pointerdown', (event) => {
  if (event.button !== 0) return;
  deck.setPointerCapture(event.pointerId);
  beginDrag(event.clientX);
});
deck.addEventListener('pointermove', (event) => updateDrag(event.clientX));
deck.addEventListener('pointerup', endDrag);
deck.addEventListener('pointercancel', endDrag);

deck.addEventListener('keydown', (event) => {
  if (event.key === 'ArrowRight') {
    event.preventDefault();
    moveDeck(1);
  }
  if (event.key === 'ArrowLeft') {
    event.preventDefault();
    moveDeck(-1);
  }
});

previousButton.addEventListener('click', () => moveDeck(-1));
nextButton.addEventListener('click', () => moveDeck(1));

const quoteForm = document.querySelector('#quoteForm');
const formStatus = document.querySelector('#formStatus');

quoteForm.addEventListener('submit', async (event) => {
  event.preventDefault();
  const data = new FormData(quoteForm);
  const rawDate = String(data.get('date'));
  const formattedDate = rawDate
    ? new Intl.DateTimeFormat('es-MX', { dateStyle: 'long', timeZone: 'UTC' }).format(new Date(`${rawDate}T12:00:00Z`))
    : 'Por definir';
  const message = [
    'Hola, me interesa solicitar personal para un evento.',
    `Tipo de evento: ${data.get('eventType')}`,
    `Fecha: ${formattedDate}`,
    `Invitados aproximados: ${data.get('guests')}`,
    `Servicio: ${data.get('service')}`
  ].join('\n');

  try {
    await navigator.clipboard.writeText(message);
    formStatus.textContent = 'Solicitud copiada. Ya puedes pegarla en WhatsApp o en tu canal de contacto.';
  } catch {
    formStatus.textContent = 'No se pudo copiar automáticamente. Selecciona y copia los datos del formulario.';
  }
});

renderDeck(false);
