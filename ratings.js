// ratings.js — uses /api/reviews (DB) instead of localStorage
(function () {
  const form = document.getElementById("reviewForm");
  const list = document.getElementById("reviewsList");
  const avgBadge = document.getElementById("avgScore");
  const countSpan = document.getElementById("reviewCount");
  const pagination = document.getElementById("pagination");
  const tableBody = document.getElementById("reviewsTableBody");

  const PAGE_SIZE = 5;
  let allReviews = [];
  let currentPage = 1;

  function computeAvg(items) {
    if (!items.length) return "0.0";
    const sum = items.reduce((s, r) => s + Number(r.rating || 0), 0);
    return (sum / items.length).toFixed(1);
  }

  function renderStars(n) {
    n = Number(n);
    let s = "";
    for (let i = 1; i <= 5; i++) {
      s += `<span class="star">${i <= n ? "&#9733;" : "&#9734;"}</span>`;
    }
    return s;
  }

  function renderPage(page) {
    if (!allReviews) allReviews = [];
    const totalPages = Math.max(1, Math.ceil(allReviews.length / PAGE_SIZE));
    if (page < 1) page = 1;
    if (page > totalPages) page = totalPages;
    currentPage = page;

    const start = (page - 1) * PAGE_SIZE;
    const pageItems = allReviews.slice(start, start + PAGE_SIZE);

    // cards
    list.innerHTML = pageItems
      .map(
        (r) => `
        <div class="col-md-6">
          <div class="card review-card mb-3">
            <div class="card-body">
              <div class="d-flex justify-content-between align-items-center">
                <h5 class="mb-1">${r.name}</h5>
                <div>${renderStars(r.rating)}</div>
              </div>
              <p class="text-muted mb-2"><small>${r.date}</small></p>
              <p class="mb-0">${r.comment}</p>
            </div>
          </div>
        </div>`
      )
      .join("");

    // table
    tableBody.innerHTML = pageItems
      .map(
        (r, idx) => `
        <tr>
          <td>${start + idx + 1}</td>
          <td>${r.name}</td>
          <td>${r.rating}</td>
          <td>${String(r.comment).replace(/</g, "&lt;")}</td>
          <td>${r.date}</td>
        </tr>`
      )
      .join("");

    // stats
    avgBadge.textContent = computeAvg(allReviews);
    countSpan.textContent = allReviews.length;

    // pagination
    let html = `
      <li class="page-item ${page <= 1 ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${page - 1}">Previous</a>
      </li>`;
    for (let p = 1; p <= totalPages; p++) {
      html += `
        <li class="page-item ${p === page ? "active" : ""}">
          <a class="page-link" href="#" data-page="${p}">${p}</a>
        </li>`;
    }
    html += `
      <li class="page-item ${page >= totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" data-page="${page + 1}">Next</a>
      </li>`;
    pagination.innerHTML = html;
  }

  async function loadReviews() {
    try {
      const res = await fetch("/api/reviews", { cache: "no-store" });
      if (!res.ok) throw new Error("Failed");
      const data = await res.json();
      if (Array.isArray(data)) {
        allReviews = data;
      } else {
        allReviews = [];
      }
    } catch (e) {
      console.log("Could not load reviews:", e);
      allReviews = [];
    }
    renderPage(1);
  }

  // Handle pagination clicks
  if (pagination) {
    pagination.addEventListener("click", (e) => {
      const a = e.target.closest("a[data-page]");
      if (!a) return;
      e.preventDefault();
      const p = parseInt(a.getAttribute("data-page"), 10);
      if (!isNaN(p)) renderPage(p);
    });
  }

  // Handle new review submit
  if (form) {
    form.addEventListener("submit", async (e) => {
      e.preventDefault();
      const name = form.name.value.trim() || "Anonymous";
      const rating = form.rating.value || "5";
      const comment = form.comment.value.trim();

      if (!comment) {
        alert("Please add a short comment.");
        return;
      }

      try {
        const res = await fetch("/api/reviews", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ name, rating, comment }),
        });
        const saved = await res.json();
        // Prepend the new review to the list
        allReviews.unshift(saved);
        form.reset();
        renderPage(1);
        document
          .getElementById("tab-reviews")
          .scrollIntoView({ behavior: "smooth" });
      } catch (e) {
        console.log("Failed to save review:", e);
        alert("Sorry, could not save your review.");
      }
    });
  }

  loadReviews();
})();
