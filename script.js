let productState = {
  page: 1,
  category: null,
  sortBy: null,
  order: "asc",
};

const PRODUCTS_PER_PAGE = 9;

document.addEventListener("DOMContentLoaded", () => {
  if (document.getElementById("categories-wrapper")) {
    fetchCategoriesForSwiper();
  }
  if (document.getElementById("featured-products-grid")) {
    fetchFeaturedProducts();
  }
  if (document.getElementById("products-grid")) {
    const categoryFilter = document.getElementById("category-filter");
    const sortFilter = document.getElementById("sort-filter");
    populateCategoryFilter();
    categoryFilter.addEventListener("change", handleCategoryChange);
    sortFilter.addEventListener("change", handleSortChange);
    const urlParams = new URLSearchParams(window.location.search);
    const categoryFromUrl = urlParams.get("category");
    if (categoryFromUrl) {
      productState.category = categoryFromUrl;
    }
    fetchAndRenderProducts();
  }
});

async function fetchCategoriesForSwiper() {
  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    const categories = await response.json();
    renderCategoriesAsSlides(categories);
  } catch (error) {
    console.error("Error fetching categories for swiper:", error);
  }
}

function renderCategoriesAsSlides(categories) {
  const wrapper = document.getElementById("categories-wrapper");
  if (!wrapper) return;
  wrapper.innerHTML = "";
  categories.forEach((category) => {
    const iconClass = getCategoryIcon(category.slug);
    const slide = document.createElement("div");
    slide.className = "swiper-slide";
    slide.innerHTML = ` 
        <a href="products.html?category=${category.slug}" class="category-item d-block text-decoration-none text-center p-3">
            <div class="icon-wrapper">
                <i class="bi ${iconClass}"></i>
            </div>
            <h6 class="mt-3 category-name">${category.name}</h6>
        </a>
    `;
    wrapper.appendChild(slide);
  });
  initCategorySwiper();
}

function initCategorySwiper() {
  if (typeof Swiper !== "undefined") {
    new Swiper(".category-swiper", {
      slidesPerView: 2,
      spaceBetween: 10,
      navigation: {
        nextEl: ".swiper-button-next",
        prevEl: ".swiper-button-prev",
      },
      breakpoints: {
        768: { slidesPerView: 4, spaceBetween: 20 },
        992: { slidesPerView: 5, spaceBetween: 30 },
      },
    });
  } else {
    console.error("Swiper library is not loaded.");
  }
}

async function fetchFeaturedProducts() {
  const grid = document.getElementById("featured-products-grid");
  if (!grid) return;

  try {
    // نطلب 4 منتجات، ونبدأ من المنتج رقم 10 لنعرض منتجات مختلفة عن بداية صفحة المتجر
    const response = await fetch("https://dummyjson.com/products?limit=4&skip=10"); 
    const data = await response.json();
    
    renderFeaturedProducts(data.products, grid);
  } catch (error) {
    console.error("Error fetching featured products:", error);
    grid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load products.</div>`;
  }
}

// هذه الدالة تبني بطاقات المنتجات وتضعها داخل الشبكة في الصفحة الرئيسية
function renderFeaturedProducts(products, gridElement) {
  if (!gridElement) return;
  gridElement.innerHTML = ""; // إزالة مؤشر التحميل

  products.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col";
    // حساب السعر بعد الخصم
    const discountPrice = (product.price * (1 - product.discountPercentage / 100)).toFixed(2);

    col.innerHTML = `
      <div class="card h-100 product-card shadow-sm border-0">
          <div class="product-image-wrapper" style="height: 200px;">
              <img src="${product.thumbnail}" class="card-img-top" alt="${product.title}" style="object-fit: contain; height: 100%; width: 100%;">
          </div>
          <div class="card-body d-flex flex-column p-3">
              <h6 class="card-title fw-bold text-truncate">${product.title}</h6>
              <p class="text-muted small mb-2">${product.category}</p>
              <div class="mt-auto">
                <div class="d-flex align-items-center justify-content-between">
                  <span class="fw-bold text-primary">$${discountPrice}</span>
                  <small class="text-warning"><i class="bi bi-star-fill"></i> ${product.rating.toFixed(1)}</small>
                </div>
              </div>
          </div>
          <div class="card-footer bg-white border-0 p-3 pt-0">
            <a href="products/product-details.html?id=${product.id}" class="btn btn-primary btn-sm w-100">View Details</a>
          </div>
      </div>
    `;
    gridElement.appendChild(col);
  });
}

async function populateCategoryFilter() {
  const filterDropdown = document.getElementById("category-filter");
  if (!filterDropdown) return;

  try {
    const response = await fetch("https://dummyjson.com/products/categories");
    const categories = await response.json();

    categories.forEach((category) => {
      const option = document.createElement("option");
      option.value = category.slug;
      option.textContent = category.name;
      filterDropdown.appendChild(option);
    });
    if (productState.category) {
      filterDropdown.value = productState.category;
    }
  } catch (error) {
    console.error("Error populating category filter:", error);
  }
}

function handleCategoryChange(event) {
  const selectedCategory = event.target.value;

  productState.category = selectedCategory || null;
  productState.page = 1;
  productState.sortBy = null;
  document.getElementById("sort-filter").value = "default";

  // تحديث الرابط في المتصفح
  updateURL();
  
  fetchAndRenderProducts();
}

function handleSortChange(event) {
  const value = event.target.value;
  productState.category = null;
  productState.page = 1;
  document.getElementById("category-filter").value = "";
  switch (value) {
    case "price-asc":
      productState.sortBy = "price";
      productState.order = "asc";
      break;
    case "price-desc":
      productState.sortBy = "price";
      productState.order = "desc";
      break;
    case "rating-desc":
      productState.sortBy = "rating";
      productState.order = "desc";
      break;
    case "default":
    default:
      productState.sortBy = null;
      break;
  }

  fetchAndRenderProducts();
}

async function fetchAndRenderProducts() {
  const grid = document.getElementById("products-grid");
  const loader = document.getElementById("products-loader");

  if (loader) loader.style.display = "block";
  if (grid) grid.innerHTML = "";

  showFilterStatus();
  let url;
  const skip = (productState.page - 1) * PRODUCTS_PER_PAGE;

  if (productState.category) {
    url = `https://dummyjson.com/products/category/${productState.category}`;
  } else if (productState.sortBy) {
    url = `https://dummyjson.com/products?limit=${PRODUCTS_PER_PAGE}&skip=${skip}&sortBy=${productState.sortBy}&order=${productState.order}`;
  } else {
    url = `https://dummyjson.com/products?limit=${PRODUCTS_PER_PAGE}&skip=${skip}`;
  }

  try {
    const response = await fetch(url);
    const data = await response.json();

    if (loader) loader.style.display = "none";
    renderProducts(data.products);

    if (productState.category) {
      renderPagination(0, 0, 0, true);
    } else {
      renderPagination(data.total, data.skip, data.limit);
    }
  } catch (error) {
    console.error("Error fetching products:", error);
    if (grid)
      grid.innerHTML = `<div class="col-12 text-center text-danger">Failed to load products.</div>`;
  }
}

function showFilterStatus() {
  const container = document.getElementById("filter-status-container");
  if (!container) return;

  if (productState.category) {
    const categoryName = productState.category
      .replace(/-/g, " ")
      .replace(/\b\w/g, (l) => l.toUpperCase());

    container.innerHTML = `
      <div class="alert alert-info d-flex justify-content-between align-items-center" role="alert">
        <span>Filtering by: <strong>${categoryName}</strong></span>
        <button class="btn btn-sm btn-outline-primary" onclick="clearAllFilters()">Show All Products</button>
      </div>
    `;
  } else {
    container.innerHTML = "";
  }
}

function updateURL() {
  const url = new URL(window.location);
  
  if (productState.category) {
    url.searchParams.set('category', productState.category);
  } else {
    url.searchParams.delete('category');
  }
  
  window.history.pushState({}, '', url);
}

function clearAllFilters() {
  productState.category = null;
  productState.sortBy = null;
  productState.page = 1;

  document.getElementById("category-filter").value = "";
  document.getElementById("sort-filter").value = "default";

  // تحديث الرابط في المتصفح
  updateURL();
  
  fetchAndRenderProducts();
}

function renderProducts(products) {
  const grid = document.getElementById("products-grid");
  if (!grid) return;
  grid.innerHTML = "";

  if (products.length === 0) {
    grid.innerHTML = `<div class="col-12 text-center text-muted">No Products To Display</div>`;
    return;
  }

  products.forEach((product) => {
    const col = document.createElement("div");
    col.className = "col";
    const originalPrice = product.price.toFixed(2);
    const discountPrice = (
      product.price *
      (1 - product.discountPercentage / 100)
    ).toFixed(2);
    const ratingStars = getRatingStars(product.rating);

    col.innerHTML = `
      <div class="card h-100 product-card shadow-sm border-0">
          <div class="product-image-wrapper">
              <img src="${product.thumbnail}" class="card-img-top" alt="${
      product.title
    }">
              <span class="badge bg-danger product-discount">${product.discountPercentage.toFixed(
                0
              )}% OFF</span>
          </div>
          <div class="card-body d-flex flex-column">
              <h5 class="card-title">${product.title}</h5>
              <p class="card-text text-muted small flex-grow-1">${product.description.substring(
                0,
                70
              )}...</p>
              
              <div class="d-flex justify-content-between align-items-center mb-2">
                  <div>
                      <span class="card-price-new fw-bold text-primary fs-5">$${discountPrice}</span>
                      <span class="card-price-old text-muted text-decoration-line-through small">$${originalPrice}</span>
                  </div>
                  <div class="product-rating" title="Rating: ${product.rating.toFixed(
                    2
                  )}">
                      ${ratingStars}
                  </div>
              </div>
          </div>
          <div class="card-footer bg-white border-0 text-center pb-3">
              <a href="products/product-details.html?id=${
                product.id
              }" class="btn btn-primary">Show Details</a>
              <a href="#" class="btn btn-primary ms-2">Add To Cart</a>
          </div>
      </div>
    `;
    grid.appendChild(col);
  });
}

function getRatingStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars += '<i class="bi bi-star-fill"></i>';
    else if (rating >= i - 0.5) stars += '<i class="bi bi-star-half"></i>';
    else stars += '<i class="bi bi-star"></i>';
  }
  return stars;
}

function renderPagination(total, skip, limit, hide = false) {
  const pagination = document.getElementById("pagination-container");
  if (!pagination) return;

  if (hide) {
    pagination.innerHTML = "";
    return;
  }

  const totalPages = Math.ceil(total / limit);
  const currentPage = skip / limit + 1;

  let paginationHTML = '<ul class="pagination shadow-sm">';

  const pageLink = (pageNumber) => {
    return `<a class="page-link" href="#" onclick="event.preventDefault(); productState.page=${pageNumber}; fetchAndRenderProducts();">${pageNumber}</a>`;
  };

  paginationHTML += `
    <li class="page-item ${currentPage === 1 ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="event.preventDefault(); productState.page=${
          currentPage - 1
        }; fetchAndRenderProducts();">Prev</a>
    </li>
  `;

  const maxPagesToShow = 5;
  let startPage = Math.max(1, currentPage - Math.floor(maxPagesToShow / 2));
  let endPage = Math.min(totalPages, startPage + maxPagesToShow - 1);
  if (endPage - startPage < maxPagesToShow - 1) {
    startPage = Math.max(1, endPage - maxPagesToShow + 1);
  }
  if (startPage > 1) {
    paginationHTML += `<li class="page-item">${pageLink(1)}</li>`;
    if (startPage > 2)
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
  }
  for (let i = startPage; i <= endPage; i++) {
    paginationHTML += `
      <li class="page-item ${i === currentPage ? "active" : ""}">
          ${pageLink(i)}
      </li>
    `;
  }
  if (endPage < totalPages) {
    if (endPage < totalPages - 1)
      paginationHTML += `<li class="page-item disabled"><span class="page-link">...</span></li>`;
    paginationHTML += `<li class="page-item">${pageLink(totalPages)}</li>`;
  }

  paginationHTML += `
    <li class="page-item ${currentPage === totalPages ? "disabled" : ""}">
        <a class="page-link" href="#" onclick="event.preventDefault(); productState.page=${
          currentPage + 1
        }; fetchAndRenderProducts();">Next</a>
    </li>
  `;

  paginationHTML += "</ul>";
  pagination.innerHTML = paginationHTML;
}

function getCategoryIcon(slug) {
  const iconMap = {
    beauty: "bi-gem",
    fragrances: "bi-stars",
    furniture: "bi-lamp",
    smartphones: "bi-phone",
    laptops: "bi-laptop",
    "womens-dresses": "bi-person-standing-dress",
    "mens-shirts": "bi-person-standing",
    groceries: "bi-basket2-fill",
    "home-decoration": "bi-house-heart-fill",
    sunglasses: "bi-sunglasses",
    automotive: "bi-car-front-fill",
    motorcycle: "bi-bicycle",
    lighting: "bi-lightbulb-fill",
    skincare: "bi-droplet-half",
    tops: "bi-person-fill",
    "womens-shoes": "bi-record-circle",
    "mens-shoes": "bi-circle-square",
    "mens-watches": "bi-watch",
    "womens-watches": "bi-watch",
    "womens-bags": "bi-handbag-fill",
    "womens-jewellery": "bi-diamond-fill",
    "sports-accessories": "bi-joystick",
  };
  return iconMap[slug] || "bi-tag-fill";
}
