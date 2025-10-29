// js/main.js
document.addEventListener('DOMContentLoaded', () => {
  // hamburger menu toggle (global)
  const hamburgers = document.querySelectorAll('.hamburger');
  hamburgers.forEach(btn => {
    btn.addEventListener('click', () => {
      const nav = document.querySelector('.main-nav ul');
      if (nav) nav.classList.toggle('open');
      btn.classList.toggle('open');
    });
  });
  // close menu on link click
  document.querySelectorAll('.main-nav a').forEach(a => {
    a.addEventListener('click', () => {
      const nav = document.querySelector('.main-nav ul');
      if (nav) nav.classList.remove('open');
      hamburgers.forEach(h => h.classList.remove('open'));
    });
  });

  // CART: load from localStorage or init
  const CART_KEY = 'nero_cart_v1';
  let cart = JSON.parse(localStorage.getItem(CART_KEY) || '[]');

  // create cart drawer element (if not present)
  let cartDrawer = document.querySelector('.cart-drawer');
  if(!cartDrawer){
    cartDrawer = document.createElement('aside');
    cartDrawer.className = 'cart-drawer';
    cartDrawer.innerHTML = `
      <div class="cart-header">
        <strong>Your Cart</strong>
        <button id="closeCart" class="btn small">Close</button>
      </div>
      <div class="cart-items" id="cartItems"></div>
      <div class="cart-footer">
        <div id="cartSummary" style="margin-bottom:12px"></div>
        <div style="display:flex;gap:8px;">
          <button id="clearCart" class="btn small outline">Clear</button>
          <button id="orderCart" class="btn small">Order on WhatsApp</button>
        </div>
      </div>
    `;
    document.body.appendChild(cartDrawer);
  }

  const cartItemsEl = document.getElementById('cartItems');
  const cartSummaryEl = document.getElementById('cartSummary');
  const orderCartBtn = document.getElementById('orderCart');
  const clearCartBtn = document.getElementById('clearCart');
  const closeCartBtn = document.getElementById('closeCart');

  function saveCart(){
    localStorage.setItem(CART_KEY, JSON.stringify(cart));
    renderCart();
  }

  function addToCart(product){
    const existing = cart.find(i=>i.id===product.id);
    if(existing){ existing.qty += product.qty || 1 }
    else cart.push({...product, qty: product.qty || 1});
    saveCart();
    openCart();
  }

  function removeFromCart(id){
    cart = cart.filter(i=>i.id!==id);
    saveCart();
  }

  function changeQty(id, delta){
    const item = cart.find(i=>i.id===id);
    if(!item) return;
    item.qty += delta;
    if(item.qty < 1) removeFromCart(id);
    saveCart();
  }

  function clearCart(){
    cart = [];
    saveCart();
    closeCart();
  }

  function cartTotal(){
    return cart.reduce((sum,i)=> sum + (i.price * i.qty), 0);
  }

  function renderCart(){
    if(!cartItemsEl) return;
    cartItemsEl.innerHTML = '';
    if(cart.length === 0){
      cartItemsEl.innerHTML = '<div class="cart-empty">Your cart is empty</div>';
      cartSummaryEl.innerHTML = '';
      return;
    }
    cart.forEach(item=>{
      const div = document.createElement('div');
      div.className = 'cart-item';
      div.innerHTML = `
        <img src="${item.image}" alt="${escapeHtml(item.name)}">
        <div style="flex:1">
          <div style="font-weight:600">${escapeHtml(item.name)}</div>
          <div class="muted">₦${formatNumber(item.price)} x ${item.qty}</div>
        </div>
        <div style="display:flex;flex-direction:column;gap:6px;align-items:flex-end">
          <div class="qty-controls">
            <button data-action="dec" data-id="${item.id}">-</button>
            <div style="padding:6px 8px">${item.qty}</div>
            <button data-action="inc" data-id="${item.id}">+</button>
          </div>
          <button data-action="remove" data-id="${item.id}" class="btn small outline">Remove</button>
        </div>
      `;
      cartItemsEl.appendChild(div);
    });

    cartItemsEl.querySelectorAll('button[data-action]').forEach(btn=>{
      btn.addEventListener('click', (e)=>{
        const action = btn.dataset.action;
        const id = btn.dataset.id;
        if(action === 'inc') changeQty(id, 1);
        if(action === 'dec') changeQty(id, -1);
        if(action === 'remove') removeFromCart(id);
      });
    });

    cartSummaryEl.innerHTML = `<div><strong>Items:</strong> ${cart.reduce((s,i)=>s+i.qty,0)} • <strong>Total:</strong> ₦${formatNumber(cartTotal())}</div>`;
  }

  function openCart(){
    cartDrawer.classList.add('open');
  }
  function closeCart(){
    cartDrawer.classList.remove('open');
  }

  // Hook cart buttons in page
  function initPageButtons(){
    // add-to-cart buttons
    document.querySelectorAll('[data-add-to-cart]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const name = btn.datasetName || btn.dataset.name || btn.getAttribute('data-name');
        const price = Number(btn.dataset.price || btn.getAttribute('data-price')) || 0;
        const image = btn.dataset.image || '';
        addToCart({ id, name, price, image, qty:1 });
      });
    });

    // order-now (single item order)
    document.querySelectorAll('[data-order-now]').forEach(btn=>{
      btn.addEventListener('click', ()=>{
        const id = btn.dataset.id;
        const name = btn.dataset.name;
        const price = Number(btn.dataset.price) || 0;
        const qty = Number(btn.dataset.qty) || 1;
        const note = encodeURIComponent(buildSingleMessage({name, price, qty}));
        const wa = `https://wa.me/2348165877866?text=${note}`;
        window.open(wa, '_blank');
      });
    });

    // open cart view (button)
    const openCartBtns = document.querySelectorAll('.open-cart');
    openCartBtns.forEach(b=> b.addEventListener('click', openCart));
  }

  // order cart -> WhatsApp
  if(orderCartBtn){
    orderCartBtn.addEventListener('click', ()=>{
      if(cart.length === 0){
        alert('Your cart is empty.');
        return;
      }
      // build message
      const lines = [];
      lines.push(`Hello Nero's Phone Accessories! I want to order these items:`);
      cart.forEach(i=>{
        lines.push(`${i.qty} x ${i.name} — ₦${formatNumber(i.price)} each`);
      });
      lines.push(`Total: ₦${formatNumber(cartTotal())}`);
      lines.push('');
      lines.push(`Name: `);
      lines.push(`Address / Delivery info: `);
      const text = encodeURIComponent(lines.join('%0A'));
      const waLink = `https://wa.me/2348165877866?text=${text}`;
      window.open(waLink, '_blank');
    });
  }

  if(clearCartBtn) clearCartBtn.addEventListener('click', ()=> {
    if(confirm('Clear cart?')) clearCart();
  });

  if(closeCartBtn) closeCartBtn.addEventListener('click', closeCart);

  // helper: build message for a single item
  function buildSingleMessage(item){
    // item: {name, price, qty}
    return `Hello Nero's Phone Accessories! I want to order ${item.qty} x ${item.name} — ₦${formatNumber(item.price)} each.`;
  }

  // small helpers
  function formatNumber(n){ return Number(n).toLocaleString(); }
  function escapeHtml(s){ return String(s).replace(/[&<>"']/g, function(m){ return {'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;',"'":'&#39;'}[m]; }); }
  
  // Expose some functions globally for inline onclick usage (if any)
  window.addToCartFromData = function(id,name,price,image){
    addToCart({ id: id+'', name, price: Number(price), image, qty:1 });
  };

  // initialize buttons on page
  initPageButtons();
  renderCart();
  saveCart();
});

document.getElementById("whatsappForm").addEventListener("submit", function(e) {
  e.preventDefault();

  // Get form values
  const name = document.getElementById("name").value;
  const email = document.getElementById("email").value;
  const message = document.getElementById("message").value;

  // Your WhatsApp number (with country code, no plus sign)
  const phoneNumber = "2348165877866";

  // Create WhatsApp message text
  const whatsappMessage = `Hello Nero Accessories 👋%0A%0AName: ${name}%0AEmail: ${email}%0AMessage: ${message}`;

  // Open WhatsApp chat
  const whatsappURL = `https://wa.me/${phoneNumber}?text=${whatsappMessage}`;
  window.open(whatsappURL, "_blank");
});

window.scrollTo({
  top: 1000,
  behavior: 'smooth'
})