class AZoomPicture extends HTMLElement {
	imgElement = null;

	defaultClientWidth = null;

	defaultSizes = null;

	currentZoom = 1;

	constructor() {
		super();
		this.imgElement = this.querySelector('img');
		this.defaultSizes = this.imgElement.sizes;
		this.defaultClientWidth = this.imgElement.clientWidth;

		if (this.getAttribute('role') === 'button') {
			this.addEventListener('click', this.onClick);
			this.addEventListener('keydown', (event) => {
				switch (event.key) {
					case 'Enter':
					case ' ':
						event.preventDefault();
						this.onClick(event);
						break;
				}
			});
		} else {
			this.addEventListener('mouseenter', this.onMouseEnter);
		}
		this.addEventListener('mousemove', this.onMouseMove);
		this.addEventListener('mouseleave', this.onMouseLeave);
	}

	onClick(event) {
		this.toggleAttribute('zoomed');

		const { isZoomed } = this;

		if (isZoomed === true) {
			this.translateImage(
				event.offsetX,
				event.offsetY,
				event.currentTarget.clientWidth,
				event.currentTarget.clientHeight,
			);
			this.zoom();
		} else {
			this.resetZoom();
		}
	}

	onMouseEnter() {
		this.toggleAttribute('zoomed', true);
		this.zoom();
	}

	onMouseLeave() {
		this.resetZoom();
	}

	onMouseMove(event) {
		if (this.isZoomed) {
			this.translateImage(
				event.offsetX,
				event.offsetY,
				event.currentTarget.clientWidth,
				event.currentTarget.clientHeight,
			);
		}
	}

	zoom() {
		const scale = this.maxZoom / this.imgElement.clientWidth;
		this.imgElement.setAttribute('sizes', `${this.maxZoom}px`);

		const animation = this.imgElement.animate([
			{ scale: scale },
		], {
			duration: 100,
			easing: 'ease-out',
		});
		animation.addEventListener('finish', () => {
			this.imgElement.style.setProperty('scale', scale);
		});
	}

	resetZoom() {
		this.toggleAttribute('zoomed', false);

		this.imgElement.style.removeProperty('transform-origin');
		const animation = this.imgElement.animate([
			{ scale: 1 },
		], {
			duration: 100,
			easing: 'ease-out',
		});
		animation.addEventListener('finish', () => {
			this.imgElement.style.removeProperty('scale');
			this.imgElement.setAttribute('sizes', this.defaultSizes);
		});
	}

	translateImage(offsetX, offsetY, clientWidth, clientHeight) {
		const relativeX = (offsetX / clientWidth) * 100;
		const relativeY = (offsetY / clientHeight) * 100;
		this.imgElement.style.setProperty('transform-origin', `${relativeX}% ${relativeY}%`);
	}

	get isZoomed() {
		return this.hasAttribute('zoomed');
	}

	get maxZoom() {
		return parseInt(this.getAttribute('max-zoom'), 10) || 1000;
	}
}

// Define the custom element
customElements.define('a-zoom-picture', AZoomPicture);
