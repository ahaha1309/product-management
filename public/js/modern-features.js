/**
 * Modern E-Commerce Frontend Integration
 * Enhanced interactions for variants, comparison, search
 */

// ==================== PRODUCT VARIANTS ====================

function loadVariants(productId) {
  fetch(`/product/variants/${productId}`)
    .then(res => res.json())
    .then(data => {
      if (data.code === '00') {
        displayVariantOptions(data.data.grouped);
      }
    });
}

function displayVariantOptions(grouped) {
  // Display size options
  if (grouped.sizes?.length > 0) {
    const sizeContainer = document.getElementById('sizeOptions');
    if (sizeContainer) {
      sizeContainer.innerHTML = grouped.sizes.map(size => `
        <button class="option-value" data-size="${size}" onclick="selectVariant('size', '${size}')">
          ${size}
        </button>
      `).join('');
    }
  }
  
  // Display color options
  if (grouped.colors?.length > 0) {
    const colorContainer = document.getElementById('colorOptions');
    if (colorContainer) {
      colorContainer.innerHTML = grouped.colors.map(color => `
        <button class="option-value" data-color="${color}" onclick="selectVariant('color', '${color}')"
                style="background-color: ${color.toLowerCase()}; color: ${isLightColor(color) ? '#000' : '#fff'}">
          ${color}
        </button>
      `).join('');
    }
  }
}

function selectVariant(type, value) {
  // Mark as selected
  document.querySelectorAll(`[data-${type}]`).forEach(el => {
    el.classList.remove('active');
  });
  document.querySelector(`[data-${type}="${value}"]`).classList.add('active');
  
  // Update price if variant has different pricing
  checkVariantAvailability();
}

function checkVariantAvailability() {
  const size = document.querySelector('[data-size].active')?.dataset.size;
  const color = document.querySelector('[data-color].active')?.dataset.color;
  
  fetch('/product/variant/check-availability', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ sku: `${size}-${color}` })
  })
    .then(res => res.json())
    .then(data => {
      if (data.available) {
        document.getElementById('addToCartBtn').disabled = false;
        updatePriceDisplay(data.data.pricing);
      } else {
        document.getElementById('addToCartBtn').disabled = true;
        showNotification('Sản phẩm hết hàng', 'error');
      }
    });
}

function updatePriceDisplay(pricing) {
  document.getElementById('productPrice').textContent = 
    (pricing.finalPrice || 0).toLocaleString('vi-VN') + 'đ';
  
  if (pricing.finalPrice < pricing.price) {
    const discountPercent = Math.round((1 - pricing.finalPrice / pricing.price) * 100);
    document.getElementById('discountBadge').textContent = `-${discountPercent}%`;
  }
}

function isLightColor(color) {
  const lightColors = ['white', 'yellow', 'beige', 'cream', 'silver', 'gold'];
  return lightColors.some(c => color.toLowerCase().includes(c));
}

// ==================== PRODUCT COMPARISON ====================

function toggleCompare(productId) {
  const btn = document.querySelector(`[data-product-id="${productId}"]`);
  
  if (btn?.classList.contains('active')) {
    removeFromComparison(productId);
  } else {
    addToComparison(productId);
  }
}

function addToComparison(productId) {
  fetch('/product/comparison/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: productId })
  })
    .then(res => res.json())
    .then(data => {
      if (data.code === '00') {
        document.querySelector(`[data-product-id="${productId}"]`).classList.add('active');
        updateComparisonCount();
        showNotification('✓ Đã thêm vào so sánh', 'success');
      } else {
        showNotification('❌ ' + data.message, 'error');
      }
    });
}

function removeFromComparison(productId) {
  fetch(`/product/comparison/${productId}`, { method: 'DELETE' })
    .then(res => res.json())
    .then(data => {
      if (data.code === '00') {
        document.querySelector(`[data-product-id="${productId}"]`).classList.remove('active');
        updateComparisonCount();
        showNotification('Đã xóa khỏi so sánh', 'info');
      }
    });
}

function updateComparisonCount() {
  fetch('/product/comparison')
    .then(res => res.json())
    .then(data => {
      const badge = document.getElementById('comparisonBadge');
      if (badge) {
        badge.textContent = data.data.totalItems;
        badge.style.display = data.data.totalItems > 0 ? 'block' : 'none';
      }
    });
}

function viewComparison() {
  window.location.href = '/product/comparison';
}

// ==================== ADVANCED SEARCH ====================

function performAdvancedSearch() {
  const keyword = document.getElementById('searchKeyword')?.value;
  const category = document.getElementById('filterCategory')?.value;
  const minPrice = document.getElementById('filterMinPrice')?.value;
  const maxPrice = document.getElementById('filterMaxPrice')?.value;
  const rating = document.getElementById('filterRating')?.value;
  const sortBy = document.getElementById('sortBy')?.value || 'newest';
  
  const params = new URLSearchParams({
    keyword: keyword || '',
    category: category || '',
    minPrice: minPrice || '',
    maxPrice: maxPrice || '',
    rating: rating || '',
    sortBy: sortBy
  });
  
  window.location.href = `/search/advanced?${params}`;
}

function filterByPrice(min, max) {
  const params = new URLSearchParams({
    minPrice: min,
    maxPrice: max
  });
  window.location.href = `/search/advanced?${params}`;
}

function filterByRating(stars) {
  const params = new URLSearchParams({ rating: stars });
  window.location.href = `/search/advanced?${params}`;
}

// Search autocomplete
function setupSearchAutocomplete() {
  const searchInput = document.getElementById('searchKeyword');
  const suggestionsContainer = document.getElementById('searchSuggestions');
  
  if (!searchInput) return;
  
  searchInput.addEventListener('input', function(e) {
    const query = e.target.value;
    
    if (query.length < 2) {
      suggestionsContainer.innerHTML = '';
      return;
    }
    
    fetch(`/product/search/autocomplete?q=${query}`)
      .then(res => res.json())
      .then(data => {
        const html = data.data.map(product => `
          <div class="suggestion-item" onclick="goToProduct('${product.slug}')">
            <img src="${product.thumbnail}" alt="${product.title}" style="width: 30px; height: 30px; border-radius: 4px;">
            <span>${product.title}</span>
          </div>
        `).join('');
        
        suggestionsContainer.innerHTML = html;
      });
  });
}

function goToProduct(slug) {
  window.location.href = `/product/${slug}`;
}

// Load trending searches
function loadTrendingSearches() {
  fetch('/product/search/trending')
    .then(res => res.json())
    .then(data => {
      const container = document.getElementById('trendingSearches');
      if (container) {
        container.innerHTML = data.data.map(search => `
          <a href="/search/advanced?keyword=${search}" class="trending-tag">
            🔥 ${search}
          </a>
        `).join('');
      }
    });
}

// Filter by attributes
function filterByAttribute(attrType, value) {
  const params = new URLSearchParams();
  params.set(attrType, value);
  
  window.location.href = `/search/attributes?${params}`;
}

// ==================== UTILITIES ====================

function showNotification(message, type = 'info') {
  const div = document.createElement('div');
  div.className = `notification notification-${type}`;
  div.innerHTML = `
    <div class="notification-content">
      <span>${message}</span>
      <button class="btn-close" onclick="this.parentElement.parentElement.remove()">×</button>
    </div>
  `;
  
  const container = document.querySelector('.notifications-container') || 
                   (() => {
                     const c = document.createElement('div');
                     c.className = 'notifications-container';
                     document.body.appendChild(c);
                     return c;
                   })();
  
  container.appendChild(div);
  setTimeout(() => div.remove(), 3500);
}

// Initialize on page load
document.addEventListener('DOMContentLoaded', function() {
  const productId = document.querySelector('[data-product-id]')?.dataset.productId;
  
  if (productId) {
    loadVariants(productId);
  }
  
  setupSearchAutocomplete();
  loadTrendingSearches();
  updateComparisonCount();
});
