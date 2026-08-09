// אפשר להוסיף בהמשך אנימציות קלות / scroll וכו'
// כרגע רק דואג שהכל נטען תקין
console.log("Ogdan site JS loaded");


// ===== אנימציית סטטיסטיקות =====

document.addEventListener("DOMContentLoaded", function () {
  const statsSection = document.querySelector(".stats-section");
  if (!statsSection) return;

  const numbers = statsSection.querySelectorAll(".stat-number");
  let animated = false;

  function animateNumber(el) {
    const target = parseInt(el.getAttribute("data-target"), 10);
    if (isNaN(target)) return;

    const duration = 1500; // מילי־שניות
    const startTime = performance.now();

    function update(now) {
      const progress = Math.min((now - startTime) / duration, 1);
      const current = Math.floor(progress * target);
      el.textContent = current.toLocaleString("he-IL");
      if (progress < 1) {
        requestAnimationFrame(update);
      } else {
        el.textContent = target.toLocaleString("he-IL");
      }
    }

    requestAnimationFrame(update);
  }

  function handleIntersection(entries, observer) {
    entries.forEach(entry => {
      if (entry.isIntersecting && !animated) {
        animated = true;
        numbers.forEach(animateNumber);
        observer.disconnect();
      }
    });
  }

  const observer = new IntersectionObserver(handleIntersection, {
    threshold: 0.35
  });

  observer.observe(statsSection);
});

document.addEventListener('DOMContentLoaded', function () {
    const form = document.getElementById('service-search-form');
    const input = document.getElementById('service-search-input');
    const resultsLabel = document.getElementById('service-search-results');

    if (!form || !input) return;

    // כל כרטיסי השירותים
    const serviceCards = Array.from(document.querySelectorAll('#services .service-card'));

    function filterServices(term) {
      const normalized = term.trim().toLowerCase();
      let visibleCount = 0;

      serviceCards.forEach(card => {
        const text = card.innerText.toLowerCase();
        const match = normalized === '' || text.includes(normalized);
        card.parentElement.style.display = match ? '' : 'none'; // ה-col של Bootstrap
        if (match) visibleCount++;
      });

      if (normalized === '') {
        resultsLabel.textContent = '';
      } else if (visibleCount === 0) {
        resultsLabel.textContent = 'לא נמצאו שירותים תואמים לחיפוש.';
      } else {
        resultsLabel.textContent = `נמצאו ${visibleCount} שירותים תואמים.`;
      }
    }

    form.addEventListener('submit', function (e) {
      e.preventDefault();
      filterServices(input.value);

      // גלילה לאזור השירותים
      const servicesSection = document.getElementById('services');
      if (servicesSection) {
        servicesSection.scrollIntoView({ behavior: 'smooth' });
      }
    });

    input.addEventListener('input', function () {
      filterServices(input.value);
    });
});
