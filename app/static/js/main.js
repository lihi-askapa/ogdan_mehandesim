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


// ===== סרטוני פרויקטים: נטענים ומתנגנים רק כשהם על המסך =====
// (preload="none" ב-HTML, כך שהדף הראשי לא מוריד את כל הסרטונים מראש)

document.addEventListener("DOMContentLoaded", function () {
  const videos = document.querySelectorAll("video.project-video");
  if (!videos.length) return;

  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;  // נשאר תמונת poster

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      const video = entry.target;
      if (entry.isIntersecting) {
        const playPromise = video.play();
        if (playPromise) playPromise.catch(function () {});
      } else {
        video.pause();
      }
    });
  }, { threshold: 0.25 });

  videos.forEach(function (video) { observer.observe(video); });
});


// ===== תפריט עליון: שקוף מעל הסרטון, לבן אחרי גלילה =====

document.addEventListener("DOMContentLoaded", function () {
  const header = document.querySelector(".site-header");
  if (!header || !document.body.classList.contains("has-hero")) return;

  function update() {
    header.classList.toggle("is-scrolled", window.scrollY > 40);
  }

  update();
  window.addEventListener("scroll", update, { passive: true });

  // כשהתפריט נפתח במובייל - רקע לבן כדי שהקישורים יהיו קריאים
  if (window.jQuery) {
    jQuery("#mainNav")
      .on("show.bs.collapse", function () { header.classList.add("menu-open"); })
      .on("hidden.bs.collapse", function () { header.classList.remove("menu-open"); });
  }
});


// ===== הופעה עדינה של אזורים בזמן גלילה =====

document.addEventListener("DOMContentLoaded", function () {
  const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
  if (reduceMotion || !("IntersectionObserver" in window)) return;

  const items = document.querySelectorAll(
    ".service-card, .project-card, .process-step, .stat-item, .cta-inner"
  );

  const observer = new IntersectionObserver(function (entries) {
    entries.forEach(function (entry) {
      if (entry.isIntersecting) {
        entry.target.classList.add("is-visible");
        observer.unobserve(entry.target);
      }
    });
  }, { threshold: 0, rootMargin: "0px 0px -8% 0px" });

  items.forEach(function (el) {
    el.classList.add("reveal");
    observer.observe(el);
  });
});
