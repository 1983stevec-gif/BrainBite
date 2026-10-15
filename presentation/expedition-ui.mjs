/** Opt-in Playful Expedition UI. The learning engine owns every action and reward. */
const root = typeof document === 'undefined' ? null : document.documentElement;

const NAV_ICONS = {
  worlds: '<circle cx="12" cy="12" r="9"/><path d="m15.5 8.5-2 5-5 2 2-5z" fill="currentColor"/>',
  bites: '<path d="M4 5.5C6.5 4.5 9 4.6 12 6.4v13c-3-1.8-5.5-1.9-8-.9z"/><path d="M20 5.5c-2.5-1-5-.9-8 .9v13c3-1.8 5.5-1.9 8-.9z"/>',
  brainbase: '<path d="M4 11 12 4l8 7"/><path d="M6 9.5V20h12V9.5"/><path d="M10 20v-5h4v5"/>',
};

function navIcon(name) {
  const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
  svg.setAttribute('viewBox', '0 0 24 24');
  svg.setAttribute('aria-hidden', 'true');
  svg.setAttribute('class', 'expedition-nav-mark');
  svg.innerHTML = NAV_ICONS[name];
  return svg;
}

function proxyButton(text, target, className = '') {
  const button = document.createElement('button');
  button.type = 'button';
  button.className = className;
  button.textContent = text;
  button.addEventListener('click', () => target?.click());
  return button;
}

// The prototype is opt-in everywhere. ?ui=classic remains an explicit opt-out.
function wantsExpedition() {
  const ui = new URL(location.href).searchParams.get('ui');
  if (ui === 'expedition') return true;
  if (ui === 'classic') return false;
  return false;
}

export async function initExpeditionUI() {
  if (!root || !wantsExpedition()) return false;
  if (root.dataset.ui === 'expedition') return true;
  const sheet = document.createElement('link');
  sheet.rel = 'stylesheet';
  sheet.href = new URL('./expedition.css', import.meta.url).href;
  try {
    await new Promise((resolve, reject) => {
      sheet.addEventListener('load', resolve, { once: true });
      sheet.addEventListener('error', () => reject(new Error('Expedition stylesheet unavailable')), { once: true });
      document.head.append(sheet);
    });
  } catch {
    sheet.remove();
    return false;
  }
  root.dataset.ui = 'expedition';
  const app = document.querySelector('.app');
  const originalHome = document.querySelector('#childDock [data-screen="home"]');
  const header = document.createElement('header');
  header.className = 'expedition-header';
  const navigation = document.createElement('nav');
  navigation.className = 'expedition-navigation';
  navigation.setAttribute('aria-label', 'Adventure navigation');
  const brand = proxyButton('BrainBite', originalHome, 'expedition-brand');
  brand.setAttribute('aria-label', 'BrainBite home');
  const profile = document.querySelector('.dash-quick-actions [data-screen="profile"]');
  const settings = document.querySelector('.dash-quick-actions [data-screen="settings"]');
  const avatar = document.getElementById('homeAvatar');
  const name = document.getElementById('homeProfileName');
  if (profile) {
    profile.className = 'expedition-profile';
    profile.replaceChildren(avatar, name);
    profile.setAttribute('aria-label', 'Your profile');
  }
  if (settings) {
    settings.className = 'expedition-settings';
    settings.title = 'Settings';
    settings.setAttribute('aria-label', 'Settings');
  }
  const utilities = document.createElement('details');
  utilities.className = 'expedition-more';
  const summary = document.createElement('summary');
  summary.textContent = 'More';
  summary.setAttribute('aria-label', 'More activities and progress');
  const menu = document.createElement('div');
  menu.className = 'expedition-more-menu';
  for (const [selector, text] of [
    ['.home-rail [data-screen="practice"]', 'Practice'],
    ['.home-rail [data-screen="code"]', 'Make & code'],
    ['#parentNav', 'Parents'],
  ]) {
    const button = document.querySelector(selector);
     if (!button) continue;
     button.className = 'expedition-menu-action';
     button.textContent = text;
     button.setAttribute('aria-label', text);
     button.addEventListener('click', () => { utilities.open = false; });
     menu.append(button);
  }
  const progress = document.createElement('div');
  progress.className = 'expedition-progress-details';
  const level = document.querySelector('.dash-level');
  const counters = document.querySelector('.dash-counters');
  if (level) progress.append(level);
  if (counters) progress.append(counters);
  menu.append(progress);
  utilities.append(summary, menu);
  navigation.append(profile, brand, utilities, settings);
  header.append(navigation);
  app.prepend(header);

  const rail = document.querySelector('.home-rail');
  for (const [destination, label] of [
    ['worlds', 'Explore'], ['bites', 'Collection'], ['brainbase', 'My space'],
  ]) {
    const button = rail?.querySelector(`[data-screen="${destination}"]`);
    if (!button) continue;
    const icon = navIcon(destination);
    const caption = document.createElement('span');
    caption.textContent = label;
    button.replaceChildren(icon, caption);
    button.setAttribute('aria-label', label);
    rail.append(button);
  }
  const play = document.getElementById('continueBtn');
  if (play) {
    const mission = document.getElementById('homePlayMission');
    const label = document.createElement('strong');
    label.textContent = 'Continue adventure';
    const arrow = document.createElement('span');
    arrow.textContent = '→';
    arrow.setAttribute('aria-hidden', 'true');
    play.replaceChildren(label, arrow, mission);
  }
  const hero = document.querySelector('.adventure-hero-copy');
  const goal = document.createElement('div');
  goal.className = 'expedition-world-progress';
  const goalText = document.getElementById('homeGoalText');
  const goalBar = document.querySelector('.home-right .goal-bar');
  if (goalText) goal.append(goalText);
  if (goalBar) goal.append(goalBar);
  hero?.insertBefore(goal, play);

  const banner = document.getElementById('clearBanner');
  const close = document.getElementById('clearClose');
  const next = document.getElementById('clearNext');
  let previousFocus = null;
  const home = proxyButton('Back to adventure', originalHome, 'expedition-result-home');
  home.addEventListener('click', () => close?.click());
  banner?.querySelector('.clear-actions')?.append(home);
  banner?.setAttribute('aria-labelledby', 'clearTitle');
  banner?.setAttribute('aria-describedby', 'clearPoints');
  const syncResults = () => {
    const visible = banner && !banner.hidden;
    root.classList.toggle('expedition-results-open', !!visible);
    if (visible) {
      previousFocus = document.activeElement;
      banner.setAttribute('role', 'dialog');
      banner.setAttribute('aria-modal', 'true');
      banner.tabIndex = -1;
      (next && !next.hidden ? next : home).focus({ preventScroll: true });
    } else {
      banner?.setAttribute('role', 'status');
      banner?.removeAttribute('aria-modal');
      if (previousFocus?.isConnected && previousFocus.getClientRects().length) previousFocus.focus({ preventScroll: true });
      previousFocus = null;
    }
  };
  if (banner) new MutationObserver(syncResults).observe(banner, { attributes: true, attributeFilter: ['hidden'] });
  document.addEventListener('keydown', event => {
    if (banner?.hidden || !banner) return;
    if (event.key === 'Escape') { event.preventDefault(); close?.click(); }
    if (event.key !== 'Tab') return;
    const buttons = [...banner.querySelectorAll('button')].filter(button => !button.hidden && !button.disabled);
    const first = buttons[0], last = buttons.at(-1);
    if (event.shiftKey && (document.activeElement === first || !banner.contains(document.activeElement))) {
      event.preventDefault(); last?.focus();
    } else if (!event.shiftKey && (document.activeElement === last || !banner.contains(document.activeElement))) {
      event.preventDefault(); first?.focus();
    }
  });
  document.addEventListener('focusin', event => {
    if (banner && !banner.hidden && !banner.contains(event.target)) (next && !next.hidden ? next : home).focus({ preventScroll: true });
  });
  document.addEventListener('click', event => {
    if (utilities.open && !utilities.contains(event.target)) utilities.open = false;
  });
  return true;
}
