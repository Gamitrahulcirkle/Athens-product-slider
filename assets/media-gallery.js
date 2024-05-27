if (!customElements.get('media-gallery')) {
	customElements.define('media-gallery', class MediaGallery extends HTMLElement {
		constructor() {
			super();
			this.elements = {
				mains: this.querySelectorAll('.product-media-main'),
				thumbnails: this.querySelectorAll('.product-media-thumbnail'),
			};

			if (!this.elements.thumbnails.length) {
				return;
			}

			this.elements.thumbnails.forEach((thumbnail) => {
				const mediaToggle = thumbnail.querySelector('button');
				if (!mediaToggle) {
					return;
				}
				mediaToggle.addEventListener('click', this.setActiveMedia.bind(this, mediaToggle.dataset.mediaId, false));
			});
		}

		setActiveMedia(mediaId, prepend) {
			const thumbnail = [...this.elements.thumbnails].find((element) => {
				return element.dataset.mediaId === mediaId.toString();
			});
			const isActive = thumbnail?.classList.contains('is-active');

			if (!thumbnail || isActive) {
				return;
			}

			const index = [...this.elements.thumbnails].indexOf(thumbnail);
			const activeMainMedia = [...this.elements.mains].find((element) => {
				return element.classList.contains('is-active');
			});
			this.elements.thumbnails.forEach((thumb) => {
				thumb.classList.remove('is-active');
			});
			activeMainMedia.classList.remove('is-active');

			const nextMainMedia = this.elements.mains[index];
			nextMainMedia.classList.add('is-active');
			thumbnail.classList.add('is-active');
			this.playActiveMedia(nextMainMedia);

			if (prepend) {
				thumbnail.parentElement.prepend(thumbnail);
			} else {
				thumbnail.scrollIntoView({
					behavior: 'smooth',
					block: 'nearest',
				});
			}
		}

		playActiveMedia(activeItem) {
			window.pauseAllMedia();
			const deferredMedia = activeItem.querySelector('deferred-media');

			if (deferredMedia) {
				deferredMedia.loadContent(false);
			}
		}
	});
}

if (!customElements.get('product-thumbnail-navigation')) {
	customElements.define('product-thumbnail-navigation', class ProductThumbnailNavigation extends HTMLElement {
		constructor() {
			super();
		}

		connectedCallback() {
			this.init();
		}

		init() {
			this.gallery = document.querySelector(`#${this.getAttribute('for')}`);
			this.elements = {
				gallery: this.gallery,
				scroller: this.gallery.querySelector('.product-media-scroller'),
				thumbnailWrapper: this.gallery.querySelector('.product-media-thumbnails'),
				thumbnails: this.gallery.querySelectorAll('.product-media-thumbnail'),
				buttonPrev: this.querySelector('.js-prev'),
				buttonNext: this.querySelector('.js-next'),
			};

			if (!this.elements.thumbnails.length) {
				return;
			}

            if( this.classList.contains('horizontal-scroll') ){ //For horizontal thumbnail position
              if( this.elements.scroller.clientWidth < this.elements.thumbnailWrapper.scrollWidth  ){
                this.classList.remove('hidden');
                
                this.elements.buttonPrev.addEventListener('click', (event) => {
                  event.preventDefault();                  
                  this.scrollLeft()
                });

                this.elements.buttonNext.addEventListener('click', (event) => {
                  event.preventDefault();                  
                    this.scrollRight()
				});
              }
            }else{
              if ( this.elements.scroller.clientHeight < this.elements.thumbnailWrapper.scrollHeight) {
                this.classList.remove('hidden');
                
                this.elements.buttonPrev.addEventListener('click', (event) => {
                  event.preventDefault();
                  this.prev();					
				});
                
                this.elements.buttonNext.addEventListener('click', (event) => {
                  event.preventDefault();
                  this.next();
                });				
              }
            }
          
            this.elements.thumbnailWrapper.addEventListener('scroll', () => {
              this.buttonAvailability();
            });
        }

		prev() {
			const scrollPos = this.elements.thumbnailWrapper.scrollTop;
			this.elements.thumbnailWrapper.scroll(0, scrollPos - 300);
		}

		next() {
			const scrollPos = this.elements.thumbnailWrapper.scrollTop;
			this.elements.thumbnailWrapper.scroll(0, scrollPos + 300);
		}
        scrollLeft(){
          const scrollPos = this.elements.thumbnailWrapper.scrollLeft;
		  this.elements.thumbnailWrapper.scroll(scrollPos - 100, 0);
          
        }
        scrollRight(){
          //console.log(this.elements.thumbnailWrapper.getBoundingClientRect())
          const scrollPos = this.elements.thumbnailWrapper.scrollLeft;
		  this.elements.thumbnailWrapper.scroll(scrollPos + 100, 0);
          
        }
		buttonAvailability() {
          if( this.classList.contains('horizontal-scroll') ){
            const el = this.elements.thumbnailWrapper;
            this.elements.buttonPrev.classList.remove('pill-nav-item-disabled');
            this.elements.buttonNext.classList.remove('pill-nav-item-disabled');
            
            if( el.scrollLeft > 0 ){
              const lastChild = el.lastElementChild;
              const lastChildRect = lastChild.getBoundingClientRect();
              const parentRect = el.getBoundingClientRect();
              let lastChildRight = Math.round( lastChildRect.right );
              let parentRight = Math.round( parentRect.right );
              
              this.elements.buttonPrev.classList.remove('pill-nav-item-disabled');
              if( parentRight < lastChildRight-10 ){
                this.elements.buttonNext.classList.remove('pill-nav-item-disabled');
              }else{
                //this.elements.buttonNext.classList.remove('pill-nav-item-disabled');
                this.elements.buttonNext.classList.add('pill-nav-item-disabled');
              }
            }else{
              this.elements.buttonPrev.classList.add('pill-nav-item-disabled');
            }
          }else{
			const el = this.elements.thumbnailWrapper;
			const hasBottomed = el.scrollTop + el.clientHeight >= el.scrollHeight - 30;
			const hasTopped = el.scrollTop <= 30;
			this.elements.buttonPrev.classList.remove('pill-nav-item-disabled');
			this.elements.buttonNext.classList.remove('pill-nav-item-disabled');

			if (hasBottomed) {
				this.elements.buttonNext.classList.add('pill-nav-item-disabled');
			}

			if (hasTopped) {
				this.elements.buttonPrev.classList.add('pill-nav-item-disabled');
			}
          }  
		}
	});
}

if (!customElements.get('media-zoom')) {
	customElements.define('media-zoom', class MediaZoom extends HTMLElement {
		constructor() {
			super();

			this.mode = this.getAttribute('data-mode');
            
			this.zoomWidth = parseInt(this.getAttribute('data-zoom-width'), 10) || 150;
			this.zoomHeight = parseInt(this.getAttribute('data-zoom-height'), 10) || 150;

			this.lastEvent = null;
			this.onMouseEnter = this.onMouseEnter.bind(this);
			this.onMouseMove = this.onMouseMove.bind(this);
			this.onMouseLeave = this.onMouseLeave.bind(this);
			this.onClick = this.onClick.bind(this);
		}

		connectedCallback() {
			this.innerHTML += `<div class="media-zoom-zoom-area devtest"></div>`;
			this.original = this.querySelector('img');
			this.zoomArea = this.querySelector('.media-zoom-zoom-area');

			this.original.addEventListener('mouseenter', this.onMouseEnter);
			this.original.addEventListener('mousemove', this.onMouseMove);
			this.original.addEventListener('mouseleave', this.onMouseLeave);

			if (this.mode === 'lightbox_zoom_hover') {
				this.original.addEventListener('click', this.onClick);
			}

			this.zoomArea.style.width = `${this.zoomWidth}px`;
			this.zoomArea.style.height = `${this.zoomHeight}px`;

			this.preview = document.createElement('div');
			this.preview.classList.add('media-zoom-preview-area');
			this.preview.innerHTML = '<div class="spinner"></div>';
			document.body.appendChild(this.preview);
		}

		disconnectedCallback() {
			this.original.removeEventListener('mouseenter', this.onMouseEnter);
			this.original.removeEventListener('mousemove', this.onMouseMove);
			this.original.removeEventListener('mouseleave', this.onMouseLeave);
			document.body.removeChild(this.preview);
		}

		onMouseEnter() {
			this.zoomArea.style.display = 'block';
			this.preview.style.display = 'block';
              console.log(this.preview)
			const previewSize = `${this.original.offsetWidth}px`;
			this.preview.style.width = previewSize;
			this.preview.style.height = previewSize;

			// Load larger image on first mouse enter
			if (!this.previewImg) {
				this.previewImg = new Image();
				this.previewImg.src = this.getAttribute('data-zoom');
				this.previewImg.onload = () => {
					const zoomScale = this.original.offsetWidth / this.zoomWidth;

					this.previewImg.style.width = `${this.original.offsetWidth * zoomScale}px`;
					this.previewImg.style.height = `${this.original.offsetHeight * zoomScale}px`;

					this.preview.innerHTML = '';
					this.preview.appendChild(this.previewImg);
					if (this.lastEvent) {
						this.original.dispatchEvent(new MouseEvent('mousemove', this.lastEvent));
					}
				};
			} else {
				// Set the correct preview image always on mouse enter
				const zoomScale = this.original.offsetWidth / this.zoomWidth;
				this.previewImg.style.width = `${this.original.offsetWidth * zoomScale}px`;
				this.previewImg.style.height = `${this.original.offsetHeight * zoomScale}px`;
			}
		}

		onMouseMove(e) {
			this.lastEvent = e;
			const { left, top, width, height } = this.original.getBoundingClientRect();

			const x = e.pageX - (window.pageXOffset + left);
			const y = e.pageY - (window.pageYOffset + top);

			const zoomX = Math.min(Math.max(x - this.zoomWidth / 2, 0), width - this.zoomWidth);
			const zoomY = Math.min(Math.max(y - this.zoomHeight / 2, 0), height - this.zoomHeight);

			this.zoomArea.style.left = `${zoomX}px`;
			this.zoomArea.style.top = `${zoomY}px`;

			this.preview.style.position = 'fixed';
			this.preview.style.left = `${left + width + 50}px`;
			this.preview.style.top = `${top - 19}px`;

			if (this.previewImg && this.previewImg.complete) {
				const previewX = (zoomX / width) * this.previewImg.width;
				const previewY = (zoomY / height) * this.previewImg.height;

				this.previewImg.style.transform = `translate(${-previewX}px, ${-previewY}px)`;
			}
		}

		onMouseLeave() {
			this.zoomArea.style.display = 'none';
			this.preview.style.display = 'none';
		}

		onClick() {
			const sectionId = this.getAttribute('data-modal-id');
			const modal = document.querySelector(`#ProductModal-${sectionId}`);

			if (modal) {
				modal.show(this);
			}
		}
	});
}
