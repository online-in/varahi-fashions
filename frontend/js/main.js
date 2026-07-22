/* Shared behavior across all pages: mobile nav, cart badge, WhatsApp link,
   footer year, and the site-wide API base + config. */
const API_BASE = '/api';

const SiteConfig = {
  whatsappNumber: '918099809089',
  storePhone: '9346619967',
};

async function loadSiteConfig() {
  try {
    const res = await fetch(`${API_BASE}/config`);
    if (res.ok) {
      const data = await res.json();
      SiteConfig.whatsappNumber = data.whatsappNumber || SiteConfig.whatsappNumber;
      SiteConfig.storePhone = data.storePhone || SiteConfig.storePhone;
    }
  } catch (e) {
    /* backend not reachable yet — fall back to defaults above */
  }
  wireWhatsappLinks();
}

function wireWhatsappLinks() {
  document.querySelectorAll('.js-whatsapp-link').forEach((el) => {
    const presetMsg = el.getAttribute('data-message') || 'Hello Varahi Fashions, I would like to know more about your sarees.';
    el.href = `https://wa.me/${SiteConfig.whatsappNumber}?text=${encodeURIComponent(presetMsg)}`;
  });
  document.querySelectorAll('.js-phone-link').forEach((el) => {
    el.href = `tel:${SiteConfig.storePhone}`;
  });
  document.querySelectorAll('.js-phone-text').forEach((el) => {
    el.textContent = `+91 ${SiteConfig.storePhone}`;
  });
  document.querySelectorAll('.js-whatsapp-text').forEach((el) => {
    el.textContent = `+91 ${SiteConfig.whatsappNumber.slice(2)}`;
  });
}

function wireMobileNav() {
  const toggle = document.querySelector('.nav-toggle');
  const links = document.querySelector('.nav-links');
  const backdrop = document.querySelector('.nav-drawer-backdrop');
  if (!toggle || !links) return;

  function openDrawer() {
    links.classList.add('open');
    backdrop?.classList.add('open');
  }
  function closeDrawer() {
    links.classList.remove('open');
    backdrop?.classList.remove('open');
  }

  toggle.addEventListener('click', () => {
    links.classList.contains('open') ? closeDrawer() : openDrawer();
  });
  backdrop?.addEventListener('click', closeDrawer);
  links.querySelectorAll('a').forEach((a) => a.addEventListener('click', closeDrawer));
}

function stampFooterYear() {
  document.querySelectorAll('.js-year').forEach((el) => {
    el.textContent = new Date().getFullYear();
  });
}

function formatINR(amount) {
  return `₹${Number(amount).toLocaleString('en-IN')}`;
}

document.addEventListener('DOMContentLoaded', () => {
  wireMobileNav();
  stampFooterYear();
  CartStore.updateBadge();
  loadSiteConfig();
});
