import i18n from './i18n';

class BlogSystem {
  constructor() {
    this.posts = [];
    this.filteredPosts = [];
    this.currentCategory = 'all';
    this.initialized = false;
  }

  async init() {
    try {
      const response = await fetch('/api/blog/posts');
      this.posts = await response.json();
      this.initialized = true;
      this.render();
      
      // Écouter les changements de langue
      i18n.subscribe(() => this.render());
    } catch (error) {
      console.error('Failed to load blog posts:', error);
      this.loadFallbackData();
    }
  }

  loadFallbackData() {
    this.posts = [/* Données de repli */];
    this.initialized = true;
    this.render();
  }

  filterByCategory(category) {
    this.currentCategory = category;
    this.filteredPosts = category === 'all' 
      ? [...this.posts] 
      : this.posts.filter(post => post.category === category);
    this.render();
  }

  search(query) {
    const normalizedQuery = query.toLowerCase();
    this.filteredPosts = this.posts.filter(post => 
      post.title[i18n.currentLocale].toLowerCase().includes(normalizedQuery) ||
      post.excerpt[i18n.currentLocale].toLowerCase().includes(normalizedQuery)
    );
    this.render();
  }

  render() {
    if (!this.initialized) return;

    const container = document.getElementById('blog-container');
    if (!container) return;

    container.innerHTML = this.filteredPosts.map(post => this.renderPost(post)).join('');
    this.initLazyLoading();
  }

  renderPost(post) {
    return `
      <article class="blog-card" data-category="${post.category}" data-id="${post.id}">
        <div class="blog-image-container">
          <img class="lazy" 
               data-src="${post.image}" 
               alt="${post.title[i18n.currentLocale]}" 
               loading="lazy">
          <div class="image-overlay"></div>
          <span class="post-category">${post.category[i18n.currentLocale]}</span>
        </div>
        <div class="blog-content">
          <div class="post-meta">
            <time datetime="${post.date}">
              ${new Date(post.date).toLocaleDateString(i18n.currentLocale, { 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </time>
            <span class="reading-time">${this.calculateReadingTime(post)} min read</span>
          </div>
          <h3>${post.title[i18n.currentLocale]}</h3>
          <p>${post.excerpt[i18n.currentLocale]}</p>
          <div class="post-tags">
            ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
          <a href="/blog/${post.slug[i18n.currentLocale]}" class="read-more">
            ${i18n.get('blog.read_more')} →
          </a>
        </div>
      </article>
    `;
  }

  calculateReadingTime(post) {
    const wordCount = post.content[i18n.currentLocale].split(/\s+/).length;
    return Math.ceil(wordCount / 200); // 200 mots/minute
  }

  initLazyLoading() {
    if ('IntersectionObserver' in window) {
      const lazyImages = document.querySelectorAll('.lazy');
      const imageObserver = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            const img = entry.target;
            img.src = img.dataset.src;
            img.classList.remove('lazy');
            imageObserver.unobserve(img);
          }
        });
      });

      lazyImages.forEach(img => imageObserver.observe(img));
    }
  }
}

// Initialisation
const blog = new BlogSystem();
blog.init();

// Export pour le débogage
window.blogSystem = blog;