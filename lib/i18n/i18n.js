class I18n {
  constructor(config) {
    this.version = '2.1.0';
    this.locales = config.locales;
    this.defaultLocale = config.defaultLocale;
    this.translations = {};
    this.currentLocale = this.defaultLocale;
    this.observers = [];
    this.cacheEnabled = true;
    
    this.init();
  }

  async init() {
    await this.loadTranslations(this.defaultLocale);
    this.applyAllTranslations();
    
    // Précharger les autres langues
    this.locales
      .filter(lang => lang !== this.defaultLocale)
      .forEach(lang => this.loadTranslations(lang));
  }

  subscribe(callback) {
    this.observers.push(callback);
    return () => this.observers = this.observers.filter(obs => obs !== callback);
  }

  notify() {
    this.observers.forEach(callback => callback(this.currentLocale));
  }

  async loadTranslations(locale) {
    if (this.translations[locale]) return;

    try {
      const response = await fetch(`/locales/${locale}.json?v=${this.version}`);
      if (!response.ok) throw new Error('Network response was not ok');
      
      this.translations[locale] = await response.json();
      console.info(`[i18n] Loaded ${locale} translations`);
      
      if (this.cacheEnabled) {
        localStorage.setItem(`i18n_${locale}`, JSON.stringify({
          data: this.translations[locale],
          timestamp: Date.now()
        }));
      }
    } catch (error) {
      console.error(`[i18n] Failed to load ${locale}:`, error);
      this.loadFromCache(locale);
    }
  }

  loadFromCache(locale) {
    const cached = localStorage.getItem(`i18n_${locale}`);
    if (cached) {
      try {
        const { data } = JSON.parse(cached);
        this.translations[locale] = data;
        console.info(`[i18n] Loaded ${locale} from cache`);
      } catch (e) {
        console.error(`[i18n] Corrupted cache for ${locale}`);
      }
    }
  }

  setLocale(locale) {
    if (this.locales.includes(locale) && locale !== this.currentLocale) {
      this.currentLocale = locale;
      document.documentElement.lang = locale;
      document.documentElement.dir = this.getTextDirection(locale);
      localStorage.setItem('preferred_language', locale);
      this.applyAllTranslations();
      this.notify();
    }
  }

  getTextDirection(locale) {
    const rtlLanguages = ['ar', 'he', 'fa', 'ur'];
    return rtlLanguages.includes(locale) ? 'rtl' : 'ltr';
  }

  applyAllTranslations() {
    this.applyToElements();
    this.applyToMeta();
    this.applyToPlaceholders();
  }

  applyToElements() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
      const key = el.getAttribute('data-i18n');
      const text = this.get(key, el.dataset.i18nCount ? parseInt(el.dataset.i18nCount) : 1);
      
      if (text) {
        el.innerHTML = text;
        
        // Gestion des attributs supplémentaires
        if (el.dataset.i18nAttr) {
          el.setAttribute(el.dataset.i18nAttr, text);
        }
      }
    });
  }

  applyToPlaceholders() {
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
      const key = el.getAttribute('data-i18n-placeholder');
      const text = this.get(key);
      if (text) el.placeholder = text;
    });
  }

  applyToMeta() {
    const titleKey = document.documentElement.getAttribute('data-i18n-title');
    if (titleKey) {
      document.title = this.get(titleKey) || document.title;
    }
    
    const desc = document.querySelector('meta[name="description"]');
    if (desc) {
      const descKey = desc.getAttribute('data-i18n-content');
      if (descKey) desc.content = this.get(descKey) || desc.content;
    }
  }

  get(key, count = 1, params = {}) {
    let translation = this.translations[this.currentLocale]?.[key] || 
                     this.translations[this.defaultLocale]?.[key] || 
                     key;

    // Gestion des pluriels
    if (typeof translation === 'object') {
      translation = count > 1 ? translation.plural : translation.singular;
    }

    // Remplacement des variables
    return translation.replace(/\${(\w+)}/g, (_, param) => params[param] || '');
  }
}

// Initialisation
const i18n = new I18n({
  locales: ['fr', 'en', 'ar'],
  defaultLocale: 'fr'
});

// Hot-reload pour le développement
if (process.env.NODE_ENV === 'development') {
  const eventSource = new EventSource('/i18n-updates');
  eventSource.onmessage = () => {
    console.log('[i18n] Hot reloading translations...');
    i18n.locales.forEach(lang => {
      delete i18n.translations[lang];
      i18n.loadTranslations(lang);
    });
  };
}

export default i18n;