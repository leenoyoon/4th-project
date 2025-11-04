document.addEventListener("DOMContentLoaded", () => {
  const urlParams = new URLSearchParams(window.location.search);
  const productId = urlParams.get("id");

  if (productId) {
    fetchProductDetails(productId);
  } else {
    displayError("No product ID provided.");
  }
});

async function fetchProductDetails(id) {
  const url = `https://dummyjson.com/products/${id}`;
  try {
    const response = await fetch(url);
    if (!response.ok) {
      throw new Error(`Product not found (status: ${response.status})`);
    }
    const product = await response.json();
    renderProductDetails(product);
  } catch (error) {
    console.error("Error fetching product details:", error);
    displayError("Failed to load product details. Please try again later.");
  }
}

function renderProductDetails(product) {
  const content = document.getElementById("product-content");
  if (!content) return;

  document.title = `${product.title} - Quicky`;

  const discountPrice = (
    product.price *
    (1 - product.discountPercentage / 100)
  ).toFixed(2);

  const ratingStars = getRatingStars(product.rating);

  // Image gallery thumbnails
  let imageThumbnailsHTML = "";
  product.images.forEach((img, index) => {
    imageThumbnailsHTML += `
            <div class="col-3">
                <img src="${img}" class="img-fluid rounded border p-1 cursor-pointer" alt="Thumbnail ${
      index + 1
    }" onclick="changeMainImage('${img}')">
            </div>
        `;
  });

  // Reviews
  let reviewsHTML = '<h4 class="mb-3">Customer Reviews</h4>';
  if (product.reviews && product.reviews.length > 0) {
    product.reviews.forEach((review) => {
      reviewsHTML += `
                <div class="card mb-3">
                    <div class="card-body">
                        <div class="d-flex justify-content-between">
                            <h6 class="card-title">${review.reviewerName}</h6>
                            <div class="text-warning">${getRatingStars(
                              review.rating
                            )}</div>
                        </div>
                        <p class="card-text">${review.comment}</p>
                        <p class="card-text"><small class="text-muted">${new Date(
                          review.date
                        ).toLocaleDateString()}</small></p>
                    </div>
                </div>
            `;
    });
  } else {
    reviewsHTML += '<p class="text-muted">No reviews yet for this product.</p>';
  }

  content.innerHTML = `
        <div class="row">
            <!-- Image Gallery -->
            <div class="col-lg-6">
                <div class="mb-3">
                    <img src="${
                      product.thumbnail
                    }" id="main-product-image" class="img-fluid rounded shadow-sm" alt="${
    product.title
  }">
                </div>
                <div class="row g-2">
                    ${imageThumbnailsHTML}
                </div>
            </div>

            <!-- Product Info -->
            <div class="col-lg-6">
                <span class="badge bg-primary mb-2">${product.category}</span>
                <h2>${product.title}</h2>
                <div class="d-flex align-items-center mb-3">
                    <div class="text-warning me-2">${ratingStars}</div>
                    <span class="text-muted">(${product.rating.toFixed(
                      2
                    )} from ${product.reviews.length} reviews)</span>
                </div>
                <p class="lead">${product.description}</p>
                
                <div class="bg-light p-3 rounded mb-3">
                    <span class="fs-3 fw-bold text-primary">$${discountPrice}</span>
                    <span class="text-muted text-decoration-line-through ms-2">$${product.price.toFixed(
                      2
                    )}</span>
                    <span class="badge bg-danger ms-3">${product.discountPercentage.toFixed(
                      0
                    )}% OFF</span>
                </div>

                <p><strong>Brand:</strong> ${product.brand}</p>
                <p><strong>Availability:</strong> <span class="fw-bold ${
                  product.stock > 0 ? "text-success" : "text-danger"
                }">${product.availabilityStatus}</span> (${product.stock} left in stock)</p>

                <div class="mt-4">
                    <button class="btn btn-primary btn-lg"><i class="bi bi-cart-plus-fill me-2"></i>Add to Cart</button>
                    <button class="btn btn-outline-secondary btn-lg ms-2"><i class="bi bi-heart-fill"></i></button>
                </div>
            </div>
        </div>

        <!-- Reviews Section -->
        <div class="row mt-5">
            <div class="col-12">
                ${reviewsHTML}
            </div>
        </div>
    `;
}

function displayError(message) {
  const content = document.getElementById("product-content");
  if (content) {
    content.innerHTML = `<div class="alert alert-danger text-center">${message}</div>`;
  }
}

function changeMainImage(src) {
  const mainImage = document.getElementById("main-product-image");
  if (mainImage) mainImage.src = src;
}

// Re-using getRatingStars from script.js to avoid duplication.
// In a real project, this would be in a shared utility file.
function getRatingStars(rating) {
  let stars = "";
  for (let i = 1; i <= 5; i++) {
    if (rating >= i) stars += '<i class="bi bi-star-fill"></i>';
    else if (rating >= i - 0.5) stars += '<i class="bi bi-star-half"></i>';
    else stars += '<i class="bi bi-star"></i>';
  }
  return stars;
}