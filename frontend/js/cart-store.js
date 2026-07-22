/* Shared cart logic, backed by localStorage. Loaded on every page. */
const CartStore = (() => {
  const KEY = 'varahi_cart';

  function getCart() {
    try {
      return JSON.parse(localStorage.getItem(KEY)) || [];
    } catch (e) {
      return [];
    }
  }

  function saveCart(cart) {
    localStorage.setItem(KEY, JSON.stringify(cart));
    updateBadge();
  }

  function addItem(product, quantity = 1) {
    const cart = getCart();
    const existing = cart.find((item) => item.productId === product.id);
    if (existing) {
      existing.quantity += quantity;
    } else {
      cart.push({
        productId: product.id,
        name: product.name,
        price: product.price,
        image: product.image,
        quantity,
      });
    }
    saveCart(cart);
  }

  function updateQuantity(productId, quantity) {
    let cart = getCart();
    cart = cart.map((item) =>
      item.productId === productId ? { ...item, quantity: Math.max(quantity, 1) } : item
    );
    saveCart(cart);
  }

  function removeItem(productId) {
    const cart = getCart().filter((item) => item.productId !== productId);
    saveCart(cart);
  }

  function clearCart() {
    saveCart([]);
  }

  function totalItems() {
    return getCart().reduce((sum, item) => sum + item.quantity, 0);
  }

  function totalPrice() {
    return getCart().reduce((sum, item) => sum + item.price * item.quantity, 0);
  }

  function updateBadge() {
    document.querySelectorAll('.js-cart-count').forEach((el) => {
      el.textContent = totalItems();
    });
  }

  return { getCart, saveCart, addItem, updateQuantity, removeItem, clearCart, totalItems, totalPrice, updateBadge };
})();
