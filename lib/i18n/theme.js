import i18n from './i18n';

class ThemeManager {
  constructor() {
    this.themes = ['light', 'dark', 'system'];
    this.currentTheme = this.getSavedTheme();
    this.init();
  }

  init() {
    this.applyTheme();
    this.initThemeToggle();
    this.initSystemThemeListener();
  }

  getSavedTheme() {
    return localStorage.getItem('theme') || 'system';
  }

  applyTheme() {
    const themeToApply = this.currentTheme === 'system' 
      ? this.getSystemTheme() 
      : this.currentTheme;
    
    document.documentElement.setAttribute('data-theme', themeToApply);
    document.documentElement.classList.toggle('dark-mode', themeToApply === 'dark');
    
    // Mettre à jour les meta tags
    document.querySelector('meta[name="theme-color"]').content = 
      themeToApply === 'dark' ? '#1a1a1a' : '#ffffff';
  }

  getSystemTheme() {
    return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
  }

  initThemeToggle() {
    const toggle = document.getElementById('theme-toggle');
    if (!toggle) return;

    toggle.innerHTML = `
      <svg class="sun-moon" width="24" height="24" viewBox="0 0 24 24">
        <mask id="moon">
          <rect x="0" y="0" width="24" height="24" fill="white"/>
          <circle cx="24" cy="10" r="8" fill="black"/>
        </mask>
        <circle class="sun" cx="12" cy="12" r="6" mask="url(#moon)"/>
        <g class="sun-beams">
          <line x1="12" y1="1" x2="12" y2="3"/>
          <line x1="12" y1="21" x2="12" y2="23"/>
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64"/>
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78"/>
          <line x1="1" y1="12" x2="3" y2="12"/>
          <line x1="21" y1="12" x2="23" y2="12"/>
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36"/>
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22"/>
        </g>
      </svg>
      <span class="theme-text">${i18n.get(`theme.${this.currentTheme}`)}</span>
    `;

    toggle.addEventListener('click', () => {
      const currentIndex = this.themes.indexOf(this.currentTheme);
      const nextIndex = (currentIndex + 1) % this.themes.length;
      this.setTheme(this.themes[nextIndex]);
    });
  }

  initSystemThemeListener() {
    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
    mediaQuery.addEventListener('change', () => {
      if (this.currentTheme === 'system') {
        this.applyTheme();
      }
    });
  }

  setTheme(theme) {
    if (this.themes.includes(theme)) {
      this.currentTheme = theme;
      localStorage.setItem('theme', theme);
      this.applyTheme();
      this.updateToggleText();
    }
  }

  updateToggleText() {
    const textElement = document.querySelector('.theme-text');
    if (textElement) {
      textElement.textContent = i18n.get(`theme.${this.currentTheme}`);
    }
  }
}

// Initialisation
const themeManager = new ThemeManager();

// Intégration avec i18n
i18n.subscribe(() => {
  themeManager.updateToggleText();
});

export default themeManager;