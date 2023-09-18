const { default: icons } = await import('../foundation/icons.js');

class MGallery extends HTMLElement {
  static get observedAttributes() {
    return ['current-image'];
  }

  imagesCount = null;

  storage = {};

  isDragging = null;

  dragX = null;

  dragForceX = null;

  dragDeltaX = null;

  translations = {
    en: {
      previousImage: 'Previous image',
      nextImage: 'Next image',
    },
    de: {
      previousImage: 'Vorheriges Bild',
      nextImage: 'Nächstes Bild',
    },
  };

  constructor() {
    super();

    const language = this.closest('[lang]')?.lang;
    const translations = this.translations[language] ?? this.translations.en;

    const imagesListElement = this.querySelector(':scope > ul');

    this.imagesCount = imagesListElement.childElementCount;

    this.template = Object.assign(document.createElement('template'), {
      innerHTML: `
        <div class="m-gallery__images">
          ${imagesListElement.outerHTML}
        </div>
        <nav class="m-gallery__navigation">
          <div class="a-pagination" data-kind="dots">
            <ul>
              ${Array.from({ length: this.imagesCount }, (_, index) => index + 1).map((index) => `<li><button data-index="${index}" data-action="show-image" aria-label="${index}"></button></li>`).join('')}
            </ul>
          </div>
          <div class="m-gallery__navigation-buttons">
            <button class="a-button" data-kind="circle" data-variant="outline" data-size="small" data-action="previous-image" aria-label="${translations.previousImage}">${icons.chevronLeft}</button>
            <button class="a-button" data-kind="circle" data-variant="outline" data-size="small" data-action="next-image" aria-label="${translations.nextImage}">${icons.chevronRight}</button>
          </div>
        </nav>
      `,
    });
    this.imagesElement = this.template.content.querySelector('.m-gallery__images');
    this.imagesUlElement = this.imagesElement.querySelector(':scope > ul');
    this.imgElements = this.imagesUlElement.querySelectorAll(':scope > li > img');

    this.navElement = this.template.content.querySelector('.m-gallery__navigation');
    this.paginationButtonElements = this.navElement.querySelectorAll('[data-action="show-image"]');
    this.buttonPreviousImageElement = this.navElement.querySelector('[data-action="previous-image"]');
    this.buttonNextImageElement = this.navElement.querySelector('[data-action="next-image"]');

    // Functions
    // Utility function to check if an element is partially in view
    const isElementPartiallyInViewport = (element) => {
      const rect = element.getBoundingClientRect();
      const windowHeight = window.innerHeight || document.documentElement.clientHeight;
      const windowWidth = window.innerWidth || document.documentElement.clientWidth;

      return (
        rect.top < windowHeight
        && rect.bottom > 0
        && rect.left < windowWidth
        && rect.right > 0
      );
    };

    // Intersection Observer
    const observer = new IntersectionObserver((entries) => {
      entries.forEach((entry) => {
        entry.target.toggleAttribute('data-is-intersecting', entry.isIntersecting);
      });
    }, {
      threshold: 0.5, // Check if at least 50% of the element is visible
      rootMargin: '20px',
      root: this,
    });
    [...this.imgElements].forEach((imgElement) => {
      observer.observe(imgElement);
    });

    // Event Listener
    const onPointerDown = (event) => {
      event.preventDefault();
      this.isDragging = true;
      this.dragXStart = event.screenX;
      this.scrollXStart = this.imagesUlElement.scrollLeft;
      this.dragForceX = null;
      this.dragX = null;
      this.dragDeltaX = null;
      Object.assign(this.imagesUlElement.style, {
        scrollSnapType: 'none',
        scrollBehavior: 'auto',
        cursor: 'grabbing',
      });
    };
    const onPointerMove = (event) => {
      if (this.isDragging) {
        this.dragForceX = 1 - this.dragX / event.screenX;
        this.dragX = event.screenX;
        this.dragDeltaX = (this.dragXStart - event.screenX);
        this.imagesUlElement.scroll({
          left: this.scrollXStart + this.dragDeltaX,
          behavior: 'auto',
        });
      }
    };
    const onPointerUp = () => {
      this.isDragging = false;
      let newIndex = this.currentImage;
      if (Math.abs(this.dragForceX) > 0.01) {
        if (this.dragForceX <= 0) {
          newIndex += 1;
        } else {
          newIndex -= 1;
        }
      }
      this.showImage(newIndex);
      Object.assign(this.imagesUlElement.style, {
        cursor: null,
      });
      setTimeout(() => {
        if (this.isDragging === false) {
          Object.assign(this.imagesUlElement.style, {
            scrollSnapType: null,
            scrollBehavior: null,
          });
        }
      }, 700);
    };
    const onKeyDown = (event) => {
      if (isElementPartiallyInViewport(this.imagesUlElement)) {
        if (event.key === 'ArrowLeft') {
          event.preventDefault();
          this.showImage(this.currentImage - 1);
        } else if (event.key === 'ArrowRight') {
          event.preventDefault();
          this.showImage(this.currentImage + 1);
        }
      }
    };
    this.imagesUlElement.addEventListener('mousedown', onPointerDown);
    window.addEventListener('mousemove', onPointerMove);
    window.addEventListener('mouseup', onPointerUp);
    document.addEventListener('keydown', onKeyDown);
    this.paginationButtonElements.forEach((paginationButtonElement) => {
      paginationButtonElement.addEventListener('click', () => {
        this.currentImage = paginationButtonElement.dataset.index;
      });
    });
    this.buttonPreviousImageElement.addEventListener('click', () => this.showImage(this.currentImage - 1));
    this.buttonNextImageElement.addEventListener('click', () => this.showImage(this.currentImage + 1));
    this.imagesUlElement.addEventListener('scroll', () => {
      const newIndex = [...this.imgElements].findIndex((_) => _.getAttribute('data-is-intersecting') !== null);
      this.currentImage = newIndex + 1;
    }, {
      passive: true,
    });
    this.imgElements.forEach((imgElement, index) => {
      imgElement.addEventListener('click', () => {
        if (this.dragDeltaX === null) {
          this.showImage(index + 1);
        }
      });
    });
  }

  get currentImage() {
    return this.storage.currentImage;
  }

  set currentImage(value) {
    if (this.storage.currentImage !== value) {
      this.storage.currentImage = value;
      this.setAttribute('current-image', value);
    }
  }

  showImage(index) {
    const imageToShowElement = this.imagesUlElement.children[index - 1];
    if (imageToShowElement) {
      this.currentImage = index;
      const scrollLeft = imageToShowElement.getBoundingClientRect().left
        - this.getBoundingClientRect().left + this.imagesUlElement.scrollLeft;
      if (imageToShowElement) {
        this.imagesUlElement.scroll({
          left: scrollLeft,
          behavior: 'smooth',
        });
      }
    }
  }

  updateNav() {
    const {
      paginationButtonElements,
      buttonPreviousImageElement,
      buttonNextImageElement,
      currentImage,
    } = this;

    paginationButtonElements.forEach((paginationButtonElement) => {
      const index = parseInt(paginationButtonElement.dataset.index, 10);
      paginationButtonElement.toggleAttribute('aria-pressed', currentImage === index);
    });
    buttonPreviousImageElement.toggleAttribute('disabled', this.currentImage === 1);
    buttonNextImageElement.toggleAttribute('disabled', this.currentImage === this.imagesCount);
  }

  render() {
    this.innerHTML = '';
    this.appendChild(this.template.content);
    this.updateNav();
  }

  attributeChangedCallback(name, oldValue, newValue) {
    if (name === 'current-image') {
      const parsedValue = parseInt(newValue, 10);
      if (this.currentImage !== parsedValue) {
        this.showImage(parsedValue);
        this.currentImage = parsedValue;
      }
      this.updateNav();
    }
  }

  connectedCallback() {
    // set default attributes
    if (this.getAttribute('current-image') === null) {
      this.currentImage = 1;
    }

    // Initial rendering
    this.render();
  }
}

// Define the custom element
customElements.define('m-gallery', MGallery);
