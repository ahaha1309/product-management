/**
 * E-Commerce Features - Client Side JavaScript
 * Handles all interactive features: wishlist, reviews, recommendations, loyalty
 */

// ==================== WISHLIST ====================

function toggleWishlist(productId) {
  const btn = document.getElementById('addToWishlist');
  if (!btn) return;
  
  const isActive = btn.classList.contains('active');
  if (isActive) {
    removeFromWishlist(productId);
  } else {
    addToWishlist(productId);
  }
}

function addToWishlist(productId) {
  fetch('/wishlist/add', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: productId })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00') {
      document.getElementById('addToWishlist').classList.add('active');
      showNotification('✅ Thêm vào danh sách yêu thích', 'success');
    } else {
      showNotification('❌ ' + data.message, 'error');
    }
  })
  .catch(err => showNotification('Lỗi: ' + err.message, 'error'));
}

function removeFromWishlist(productId) {
  fetch(`/wishlist/${productId}`, { method: 'DELETE' })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00') {
      document.getElementById('addToWishlist').classList.remove('active');
      showNotification('❌ Xóa khỏi danh sách yêu thích', 'info');
    }
  })
  .catch(err => showNotification('Lỗi: ' + err.message, 'error'));
}

function checkIfInWishlist(productId) {
  fetch(`/wishlist/check/${productId}`)
  .then(res => res.json())
  .then(data => {
    if (data.inWishlist) {
      const btn = document.getElementById('addToWishlist');
      if (btn) btn.classList.add('active');
    }
  });
}

// ==================== REVIEWS ====================

function submitReview(productId) {
  const form = document.getElementById('reviewForm');
  if (!form) return;

  const rating = document.querySelector('input[name="rating"]:checked');
  if (!rating) {
    showNotification('⚠️ Vui lòng chọn rating', 'error');
    return;
  }

  const formData = new FormData(form);
  
  fetch(`/review/add/${productId}`, {
    method: 'POST',
    body: formData
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00') {
      showNotification('✅ ' + data.message, 'success');
      setTimeout(() => {
        window.location.href = `/review/product/${productId}`;
      }, 1500);
    } else {
      showNotification('❌ ' + data.message, 'error');
    }
  })
  .catch(err => showNotification('Lỗi: ' + err.message, 'error'));
}

function loadProductReviews(productId) {
  fetch(`/review/product/${productId}`)
  .then(res => res.text())
  .then(html => {
    const container = document.getElementById('reviewsContainer');
    if (container) {
      container.innerHTML = html;
    }
  });
}

function markReviewHelpful(reviewId, type) {
  fetch(`/review/${reviewId}/helpful`, {
    method: 'PATCH',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ type: type })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00') {
      showNotification('✅ Cảm ơn bạn!', 'success');
      setTimeout(() => location.reload(), 500);
    }
  });
}

// ==================== RECOMMENDATIONS ====================

function loadRelatedProducts(productId) {
  const container = document.getElementById('relatedProductsContainer');
  if (!container) return;

  fetch(`/recommendation/related/${productId}`)
  .then(res => res.json())
  .then(data => {
    if (data.relatedProducts) {
      const html = data.relatedProducts.map(p => `
        <div class="product-card">
          <div class="product-image">
            <img src="${p.thumbnail || '/image/no-product.png'}" alt="${p.title}">
            ${p.discountPercentage ? `<span class="discount">-${p.discountPercentage}%</span>` : ''}
          </div>
          <div class="product-info">
            <h5>${p.title}</h5>
            <p class="price">
              ${p.discountPercentage ? `<del>${(p.price || 0).toLocaleString('vi-VN')}đ</del> ` : ''}
              ${(p.newPrice || 0).toLocaleString('vi-VN')}đ
            </p>
            <div class="rating">⭐ ${p.rating || 0}/5</div>
            <button class="btn btn-primary" onclick="addToCart('${p._id}', 1)">Thêm giỏ</button>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  })
  .catch(err => console.error('Error loading related products:', err));
}

function loadPersonalizedRecommendations() {
  const container = document.getElementById('personalizedRecommendations');
  if (!container) return;

  fetch('/recommendation/personalized')
  .then(res => res.json())
  .then(data => {
    if (data.recommendations) {
      const html = data.recommendations.map(p => `
        <div class="product-card">
          <div class="product-image">
            <img src="${p.thumbnail || '/image/no-product.png'}" alt="${p.title}">
          </div>
          <div class="product-info">
            <h5>${p.title}</h5>
            <p class="price">${(p.newPrice || 0).toLocaleString('vi-VN')}đ</p>
            <button class="btn btn-primary" onclick="addToCart('${p._id}', 1)">Thêm giỏ</button>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  });
}

function loadTrendingProducts() {
  const container = document.getElementById('trendingProductsContainer');
  if (!container) return;

  fetch('/recommendation/trending')
  .then(res => res.json())
  .then(data => {
    if (data.trending) {
      const html = data.trending.map(p => `
        <div class="product-card">
          <div class="product-image">
            <img src="${p.thumbnail}" alt="${p.title}">
            <span class="trending-badge">🔥 Hot</span>
          </div>
          <div class="product-info">
            <h5>${p.title}</h5>
            <p class="price">${(p.newPrice || 0).toLocaleString('vi-VN')}đ</p>
            <button class="btn btn-primary" onclick="addToCart('${p._id}', 1)">Thêm giỏ</button>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  });
}

function loadRecentlyViewed() {
  const container = document.getElementById('recentlyViewedContainer');
  if (!container) return;

  fetch('/recommendation/recently-viewed')
  .then(res => res.json())
  .then(data => {
    if (data.recentlyViewed && data.recentlyViewed.length > 0) {
      const html = data.recentlyViewed.map(p => `
        <div class="product-card">
          <div class="product-image">
            <img src="${p.thumbnail}" alt="${p.title}">
          </div>
          <div class="product-info">
            <h5>${p.title}</h5>
            <p class="price">${(p.newPrice || 0).toLocaleString('vi-VN')}đ</p>
            <button class="btn btn-primary" onclick="addToCart('${p._id}', 1)">Thêm giỏ</button>
          </div>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  });
}

function trackProductView(productId) {
  fetch('/recommendation/track-view', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ productId: productId })
  });
}

// ==================== LOYALTY ====================

function redeemLoyaltyReward(rewardId, points) {
  if (!confirm(`Bạn muốn dùng ${points} điểm để nhận thưởng này?`)) {
    return;
  }

  fetch('/loyalty/redeem', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ rewardId: rewardId, pointsToRedeem: points })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00') {
      showNotification('✅ ' + data.message, 'success');
      setTimeout(() => location.reload(), 1500);
    } else {
      showNotification('❌ ' + data.message, 'error');
    }
  });
}

// ==================== SOCIAL PROOF ====================

function loadLiveOrders() {
  const container = document.getElementById('liveOrdersList');
  if (!container) return;

  fetch('/admin/analytics/api/metrics')
  .then(res => res.json())
  .then(data => {
    if (data.data?.liveOrders) {
      const html = data.data.liveOrders.map(order => `
        <div class="live-order-item">
          <span class="icon">👤</span>
          <span class="message">${order.message}</span>
          <span class="time">${order.timeAgo}</span>
        </div>
      `).join('');
      
      container.innerHTML = html;
    }
  });
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

function addToCart(productId, quantity) {
  fetch(`/cart/add-product/${productId}`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ quantity: quantity || 1 })
  })
  .then(res => res.json())
  .then(data => {
    if (data.code === '00' || data.message?.includes('thành công')) {
      showNotification('✅ Thêm vào giỏ hàng thành công', 'success');
    }
  })
  .catch(err => showNotification('Lỗi: ' + err.message, 'error'));
}

// ==================== PAGE LOAD ====================

document.addEventListener('DOMContentLoaded', function() {
  // Get product ID from URL or data attribute
  const productId = document.querySelector('[data-product-id]')?.dataset.productId ||
                   window.location.pathname.split('/').pop();

  // On product detail page
  if (window.location.pathname.includes('/product/')) {
    trackProductView(productId);
    loadRelatedProducts(productId);
    checkIfInWishlist(productId);
  }

  // On homepage
  if (window.location.pathname === '/') {
    loadPersonalizedRecommendations();
    loadTrendingProducts();
    loadRecentlyViewed();
    loadLiveOrders();

    // Refresh live orders every 30 seconds
    setInterval(loadLiveOrders, 30000);
  }

  // Wishlist button event
  const wishlistBtn = document.getElementById('addToWishlist');
  if (wishlistBtn) {
    wishlistBtn.addEventListener('click', () => {
      const pId = productId || document.querySelector('[data-product-id]')?.dataset.productId;
      if (pId) toggleWishlist(pId);
    });
  }

  // Add to cart buttons
  document.querySelectorAll('[data-add-to-cart]').forEach(btn => {
    btn.addEventListener('click', (e) => {
      const pid = e.target.dataset.productId || e.target.closest('[data-product-id]')?.dataset.productId;
      if (pid) addToCart(pid, 1);
    });
  });
});
