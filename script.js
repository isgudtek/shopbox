const GOOGLE_URL = 'YOUR_GOOGLE_APPS_SCRIPT_URL'; // TODO: Replace with your deployed Web App URL
const SHEET_URL = 'feed.php'; // Use PHP proxy for better reliability and bypass CORS

let products = [];
let cart = [];

// Initialize
document.addEventListener('DOMContentLoaded', () => {
    initTheme();
    refreshProducts();
    initCart();
    lucide.createIcons();
});

async function refreshProducts() {
    const syncBadge = document.querySelector('.sync-badge i');
    if (syncBadge) syncBadge.classList.add('spin');

    try {
        const response = await fetch(SHEET_URL);

        // If the server returns PHP source code instead of JSON, we fallback to direct URL
        const contentType = response.headers.get('content-type');
        if (!contentType || !contentType.includes('application/json')) {
            if (SHEET_URL !== GOOGLE_URL) {
                console.warn('feed.php failed or returned non-JSON. Falling back to direct Google Sync...');
                products = await fetchDirect(GOOGLE_URL);
                return;
            }
        }

        const data = await response.json();

        console.log('Smart Feed Data:', data);

        if (!Array.isArray(data)) {
            console.error('Data is not an array:', data);
            // If it's an error object from our proxy
            if (data.error) {
                alert('Store Data Error: ' + data.error);
            }
            return;
        }

        // Map JSON items to product structure
        products = data.map(item => ({
            id: String(item.id || ''),
            name: String(item.name || 'Unnamed Product'),
            short_description: String(item.shortdescription || item.description || ''),
            long_description: String(item.longdescription || item.description || ''),
            price: parseFloat(item.price) || 0,
            image: String(item.imageurl || item.image || ''),
            category: String(item.category || 'General'),
            stock: parseInt(item.stock) || 0,
            stripePriceId: String(item.stripepriceid || ''),
            variations: String(item.variations || ''),
            variationprices: String(item.variationprices || '')
        }));

        generateCategoryFilters();
        renderProducts();
    } catch (error) {
        console.error('Error fetching smart feed:', error);
    }

    if (syncBadge) {
        setTimeout(() => syncBadge.classList.remove('spin'), 1000);
    }
}

function generateCategoryFilters() {
    const categories = ['All', ...new Set(products.map(p => p.category).filter(Boolean))];
    const filterBar = document.querySelector('.filter-bar');
    if (!filterBar) return;

    filterBar.innerHTML = categories.map(cat => `
        <button class="filter-btn ${cat === 'All' ? 'active' : ''}" onclick="filterByCategory('${cat}', this)">
            ${cat}
        </button>
    `).join('');
}

let activeCategory = 'All';
function filterByCategory(category, btn) {
    activeCategory = category;

    // Update UI active state
    document.querySelectorAll('.filter-btn').forEach(b => b.classList.remove('active'));
    btn.classList.add('active');

    renderProducts();
}

function initTheme() {
    const toggle = document.getElementById('theme-toggle');
    const savedTheme = localStorage.getItem('theme');

    if (savedTheme === 'light') {
        document.body.classList.add('light-mode');
    }

    toggle.addEventListener('click', () => {
        document.body.classList.toggle('light-mode');
        const isLight = document.body.classList.contains('light-mode');
        localStorage.setItem('theme', isLight ? 'light' : 'dark');
    });
}

function renderProducts() {
    const grid = document.getElementById('product-grid');
    const filtered = activeCategory === 'All'
        ? products
        : products.filter(p => p.category === activeCategory);

    if (filtered.length === 0) {
        grid.innerHTML = '<div style="grid-column: 1/-1; text-align: center; padding: 4rem; color: var(--muted-foreground)">No products found in this category.</div>';
        return;
    }

    grid.innerHTML = filtered.map((product, index) => {
        // SMART IMAGE DISCOVERY ENGINE
        let imageUrl = product.image ? String(product.image).trim() : '';

        // 1. Convert Google Drive Links to High-Speed Thumbnails (Works better than /uc/)
        if (imageUrl.includes('drive.google.com')) {
            const fileId = imageUrl.split('/d/')[1]?.split('/')[0] ||
                imageUrl.split('id=')[1]?.split('&')[0] ||
                imageUrl.split('id=')[1];
            if (fileId) {
                // sz=w800 ensures a high-quality 800px image
                imageUrl = `https://drive.google.com/thumbnail?id=${fileId}&sz=w800`;
            }
        }
        // 2. Clear out common "placeholder" text from Google Sheets
        else if (imageUrl.toLowerCase().includes('object') || imageUrl === '') {
            imageUrl = ''; // Set to empty to trigger magic discovery
        }

        // 3. MAGIC DISCOVERY: If empty or not a URL, use premium semantic matching
        if (!imageUrl || !imageUrl.startsWith('http')) {
            // Find a stunning professional shot based on the Name
            imageUrl = `https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800`; // Default

            // If they have a name, get a specific matching photo
            if (product.name && product.name !== 'Unnamed Product') {
                imageUrl = `https://source.unsplash.com/featured/800x800?${encodeURIComponent(product.name)}`;
            }
        }

        const variations = product.variations ? String(product.variations).split(',').map(v => v.trim()) : [];
        const varPrices = product.variationprices ? String(product.variationprices).split(',').map(p => parseFloat(p.trim()) || 0) : [];
        const hasVariations = variations.length > 0;

        // NEW SMART PRICING: Find cheapest index for the grid as well
        let cheapestIdx = 0;
        if (hasVariations) {
            cheapestIdx = varPrices.indexOf(Math.min(...varPrices));
        }
        const initialPrice = hasVariations ? varPrices[cheapestIdx] : product.price;

        return `
            <div class="product-card" style="animation-delay: ${index * 0.1}s" onclick="openProductDetail('${product.id}', '${imageUrl}')">
                <div class="card-image-wrap">
                    <img src="${imageUrl}" alt="${product.name}" loading="lazy" onerror="this.src='https://images.unsplash.com/photo-1581091226825-a6a2a5aee158?auto=format&fit=crop&q=80&w=800'">
                    <div class="card-category">${product.category || 'Product'}</div>
                </div>
                <div class="card-content">
                    <h3>${product.name}</h3>
                    <p class="card-description">${product.short_description}</p>
                    
                    ${hasVariations ? `
                    <div class="variation-pills" style="display: flex; flex-wrap: wrap; gap: 0.4rem; margin-bottom: 1rem;" onclick="event.stopPropagation()">
                        ${variations.map((v, i) => `
                            <button class="var-pill ${i === cheapestIdx ? 'active' : ''}" 
                                    onclick="selectVariation(this, ${varPrices[i]})" 
                                    data-index="${i}"
                                    style="padding: 0.3rem 0.6rem; border-radius: 20px; font-size: 0.7rem; border: 1px solid var(--glass-border); background: var(--glass); color: var(--foreground); cursor: pointer;">
                                ${v}
                            </button>
                        `).join('')}
                    </div>
                    ` : ''}

                    <div class="card-footer">
                        <span class="card-price" data-base-price="${product.price}">€${(parseFloat(initialPrice) || 0).toLocaleString(undefined, { minimumFractionDigits: 2 })}</span>
                        <button class="add-btn" onclick="event.stopPropagation(); addToCartWithVariation('${product.id}', this.closest('.product-card'), '${imageUrl}')">
                            <i data-lucide="plus"></i>
                        </button>
                    </div>
                </div>
            </div>
        `;
    }).join('');
    lucide.createIcons();
}

function selectVariation(pill, price) {
    const card = pill.closest('.product-card');

    // Reset all pills in this card
    card.querySelectorAll('.var-pill').forEach(btn => {
        btn.classList.remove('active');
        btn.style.background = 'var(--glass)';
        btn.style.borderColor = 'var(--glass-border)';
        btn.style.color = 'var(--foreground)';
    });

    // Set active pill
    pill.classList.add('active');
    pill.style.background = 'var(--primary)';
    pill.style.borderColor = 'var(--primary)';
    pill.style.color = 'white';

    // Update displayed price
    const priceDisplay = card.querySelector('.card-price');
    priceDisplay.textContent = `€${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

function addToCartWithVariation(id, container, imageUrl) {
    // container could be a .product-card or .detail-info
    const activePill = container.querySelector('.var-pill.active');
    const product = products.find(p => p.id == id);

    let finalName = product.name;
    let finalPrice = parseFloat(product.price) || 0;

    if (activePill) {
        const variations = String(product.variations).split(',').map(v => v.trim());
        const varPrices = String(product.variationprices).split(',').map(p => parseFloat(p.trim()) || 0);
        const idx = activePill.dataset.index;

        // CRITICAL: Ensure variations are separate rows in the cart
        const varLabel = variations[idx] || 'Default';
        finalName = `${product.name} (${varLabel})`;
        finalPrice = varPrices[idx];
    } else if (product.variations) {
        // Fallback: Use the cheapest variation if no active pill is found
        const variations = String(product.variations).split(',').map(v => v.trim());
        const varPrices = String(product.variationprices).split(',').map(p => parseFloat(p.trim()) || 0);
        const cheapestIdx = varPrices.indexOf(Math.min(...varPrices));

        finalName = `${product.name} (${variations[cheapestIdx]})`;
        finalPrice = varPrices[cheapestIdx];
    }

    const cartItem = {
        ...product,
        id: `${id}-${finalName}`,
        name: finalName,
        price: finalPrice,
        displayImage: imageUrl
    };

    const existing = cart.find(item => item.id === cartItem.id);
    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...cartItem, quantity: 1 });
    }

    updateCartUI();
    toggleCart(true);
}

function openProductDetail(id, imageUrl) {
    const product = products.find(p => p.id == id);
    const modal = document.getElementById('product-modal');
    const body = document.getElementById('modal-product-body');

    const variations = product.variations ? String(product.variations).split(',').map(v => v.trim()) : [];
    const varPrices = product.variationprices ? String(product.variationprices).split(',').map(p => parseFloat(p.trim()) || 0) : [];
    const hasVariations = variations.length > 0;

    // SMART SELECTION: Find the index of the cheapest variation
    let cheapestIdx = 0;
    if (hasVariations) {
        cheapestIdx = varPrices.indexOf(Math.min(...varPrices));
    }

    const initialPrice = hasVariations ? varPrices[cheapestIdx] : product.price;

    body.innerHTML = `
        <div class="product-detail-grid">
            <div class="detail-image-wrap">
                <img src="${imageUrl}" alt="${product.name}">
            </div>
            <div class="detail-info">
                <div class="card-category" style="width: fit-content">${product.category}</div>
                <h1>${product.name}</h1>
                <div class="detail-price">€${initialPrice.toLocaleString(undefined, { minimumFractionDigits: 2 })}</div>
                <p class="short-desc">${product.short_description}</p>
                
                ${hasVariations ? `
                <div style="margin-top: 1rem;">
                    <div style="font-size: 0.8rem; font-weight: 600; margin-bottom: 0.8rem; opacity: 0.6;">SELECT VARIATION</div>
                    <div class="variation-pills" style="display: flex; flex-wrap: wrap; gap: 0.8rem;">
                        ${variations.map((v, i) => `
                            <button class="var-pill ${i === cheapestIdx ? 'active' : ''}" 
                                    onclick="selectDetailVariation(this, ${varPrices[i]})" 
                                    data-index="${i}"
                                    style="padding: 0.6rem 1.2rem; border-radius: 30px; border: 1px solid var(--glass-border); background: var(--glass); color: var(--foreground); cursor: pointer; font-weight: 600;">
                                ${v}
                            </button>
                        `).join('')}
                    </div>
                </div>
                ` : ''}

                <div class="detail-actions">
                    <button class="submit-btn" style="height: 60px; font-size: 1.1rem;" onclick="addToCartWithVariation('${product.id}', this.closest('.detail-info'), '${imageUrl}')">
                        Add to Secure Cart
                    </button>
                </div>

                <div class="long-desc">
                    <h3>Product Specifications</h3>
                    <div class="long-desc-content">${product.long_description}</div>
                </div>
            </div>
        </div>
    `;

    modal.style.display = 'flex';
    document.body.style.overflow = 'hidden';
    lucide.createIcons();

    // Update hash for "Single Page" feel
    window.location.hash = `product/${id}`;
}

function closeProductDetail() {
    document.getElementById('product-modal').style.display = 'none';
    document.body.style.overflow = 'auto';
    window.location.hash = '';
}

function selectDetailVariation(pill, price) {
    const container = pill.closest('.variation-pills');
    const priceDisplay = pill.closest('.detail-info').querySelector('.detail-price');

    container.querySelectorAll('.var-pill').forEach(btn => btn.classList.remove('active'));
    pill.classList.add('active');

    priceDisplay.textContent = `€${price.toLocaleString(undefined, { minimumFractionDigits: 2 })}`;
}

// Handle browser back button for product details
window.onhashchange = function () {
    if (!window.location.hash) closeProductDetail();
};

function initCart() {
    const cartToggle = document.getElementById('cart-toggle');
    const cartOverlay = document.getElementById('cart-overlay');
    const closeCart = document.getElementById('close-cart');

    cartToggle.addEventListener('click', () => toggleCart(true));
    closeCart.addEventListener('click', () => toggleCart(false));
    cartOverlay.addEventListener('click', (e) => {
        if (e.target === cartOverlay) toggleCart(false);
    });
}

function toggleCart(open) {
    document.getElementById('cart-overlay').classList.toggle('open', open);
    document.getElementById('cart-panel').classList.toggle('open', open);
}

function addToCart(id) {
    const product = products.find(p => p.id === id);
    const existing = cart.find(item => item.id === id);

    if (existing) {
        existing.quantity += 1;
    } else {
        cart.push({ ...product, quantity: 1 });
    }

    updateCartUI();
    toggleCart(true);
}

function removeFromCart(id) {
    cart = cart.filter(item => item.id !== id);
    updateCartUI();
}

function updateQuantity(id, delta) {
    const item = cart.find(item => item.id === id);
    if (item) {
        item.quantity = Math.max(1, item.quantity + delta);
    }
    updateCartUI();
}

// Smart PHP Checkout (Dynamic Prices from Sheet)
async function handleCheckout() {
    if (cart.length === 0) return;

    const btn = document.querySelector('.checkout-btn');
    const originalText = btn.innerHTML;
    btn.innerHTML = '<i data-lucide="refresh-cw" class="spin" size="20"></i> Syncing...';
    lucide.createIcons();
    btn.disabled = true;

    try {
        const response = await fetch('checkout.php', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ items: cart }),
        });

        const contentType = response.headers.get('content-type');
        const text = await response.text();

        // Safety Check: If the browser sees the PHP tags, the server isn't running PHP
        if (text.trim().startsWith('<?php') || text.includes('// 100% Portable')) {
            throw new Error('Server detected without PHP support. Checkout requires a PHP-enabled host.');
        }

        const session = JSON.parse(text);
        if (session.error) throw new Error(session.error.message || 'Payment error');
        if (session.url) window.location.href = session.url;
    } catch (error) {
        console.error('Checkout error:', error);
        alert('Checkout failed: ' + error.message);
        btn.innerHTML = originalText;
        btn.disabled = false;
        lucide.createIcons();
    }
}

function updateCartUI() {
    const count = cart.reduce((acc, item) => acc + item.quantity, 0);
    const subtotal = cart.reduce((acc, item) => acc + item.price * item.quantity, 0);

    document.querySelectorAll('.cart-count').forEach(el => el.textContent = count > 0 ? count : '');

    const container = document.getElementById('cart-items-container');
    if (cart.length === 0) {
        container.innerHTML = '<div style="text-align: center; margin-top: 4rem; color: var(--muted-foreground)"><p>Your cart is empty.</p></div>';
        document.getElementById('cart-footer').style.display = 'none';
        return;
    }

    document.getElementById('cart-footer').style.display = 'block';
    document.getElementById('subtotal-amount').textContent = `€${subtotal.toFixed(2)}`;

    // Add listener to checkout button
    const checkoutBtn = document.querySelector('.checkout-btn');
    checkoutBtn.onclick = handleCheckout;

    container.innerHTML = cart.map(item => `
        <div class="cart-item">
            <img src="${item.displayImage || item.image}" alt="${item.name}" class="cart-item-img">
            <div class="cart-item-info">
                <h4>${item.name}</h4>
                <p style="color: var(--primary)">€${item.price.toFixed(2)}</p>
                <div class="cart-item-actions">
                    <div class="qty-control">
                        <button onclick="updateQuantity('${item.id}', -1)">-</button>
                        <span>${item.quantity}</span>
                        <button onclick="updateQuantity('${item.id}', 1)">+</button>
                    </div>
                    <button onclick="removeFromCart('${item.id}')" style="color: var(--accent)">
                        <i data-lucide="trash-2" size="16"></i>
                    </button>
                </div>
            </div>
        </div>
    `).join('');
    lucide.createIcons();
}

// Fallback mechanism when local proxy fails
async function fetchDirect(url) {
    try {
        const response = await fetch(url);
        const data = await response.json();
        if (Array.isArray(data)) {
            products = data.map(item => ({
                id: String(item.id || ''),
                name: String(item.name || 'Unnamed Product'),
                short_description: String(item.shortdescription || item.description || ''),
                long_description: String(item.longdescription || item.description || ''),
                price: parseFloat(item.price) || 0,
                image: String(item.imageurl || item.image || ''),
                category: String(item.category || 'General'),
                stock: parseInt(item.stock) || 0,
                stripePriceId: String(item.stripepriceid || ''),
                variations: String(item.variations || ''),
                variationprices: String(item.variationprices || '')
            }));
            generateCategoryFilters();
            renderProducts();
            return products;
        }
    } catch (e) {
        console.error('Direct fetch failed:', e);
        alert('Could not load shop data. Please check your Google Apps Script Deployment.');
    }
}

// Initialize static elements like footer icons
lucide.createIcons();

// Simulated Sync Logic
setInterval(() => {
    const icon = document.querySelector('.sync-badge i');
    if (icon) {
        icon.classList.add('spin');
        setTimeout(() => icon.classList.remove('spin'), 1500);
    }
}, 30000);
