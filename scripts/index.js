document.addEventListener('DOMContentLoaded', () => {
    class Slider {
        constructor({
            selector,
            isLoop = false,
            dots = false,
            autoplay = false,
            pauseOnHover = false,
            swipe = false,
            delay = 4000,
            controlsLabel = {
                next: 'Следующий слайд',
                prev: 'Предыдущий слайд',
            },
        }) {
            this.slider = document.querySelector(selector);

            if (!this.slider) {
                return;
            }

            this.slidesList = this.slider.querySelector('.slider__list');
            this.sliderControls = this.slider.querySelector('.slider__controls');
            this.slides = Array.from(this.slidesList.children);
            this.isLoop = isLoop;
            this.dots = dots;
            this.autoplay = autoplay;
            this.pauseOnHover = pauseOnHover;
            this.swipe = swipe;
            this.delay = delay;
            this.controlsLabel = controlsLabel;
            this.currentSlideIndex = 0;
            this.visibleSlides = 1;
            this.timerId = null;
            this.touchStartX = 0;
            this.touchStartY = 0;

            this.init();
        }

        get lastAvailableIndex() {
            return Math.max(this.slides.length - this.visibleSlides, 0);
        }

        get slideStep() {
            const styles = getComputedStyle(this.slidesList);
            const gap = parseFloat(styles.columnGap || styles.gap) || 0;

            return this.slides[0].getBoundingClientRect().width + gap;
        }

        init() {
            this.slides.forEach((slide) => slide.classList.add('slider__item'));
            this.renderControls();
            this.updateVisibleSlides();
            this.goTo(0);
            this.bindEvents();

            if (this.autoplay) {
                this.startAutoplay();
            }
        }

        renderControls() {
            this.prevButton = this.createButton(
                'slider__button_prev',
                this.controlsLabel.prev,
            );
            this.nextButton = this.createButton(
                'slider__button_next',
                this.controlsLabel.next,
            );

            this.sliderControls.append(this.nextButton, this.prevButton);

            if (this.dots) {
                this.dotsList = document.createElement('ul');
                this.dotsList.className = 'slider__dots';

                this.dotsButtons = this.slides.map((_, index) => {
                    const item = document.createElement('li');
                    const button = document.createElement('button');

                    button.className = 'slider__button slider__button_type_dot';
                    button.type = 'button';
                    button.setAttribute('aria-label', `Перейти к слайду ${index + 1}`);
                    button.addEventListener('click', () => this.goTo(index));

                    item.append(button);
                    this.dotsList.append(item);

                    return button;
                });

                this.sliderControls.append(this.dotsList);
            } else {
                this.counter = document.createElement('div');
                this.counter.className = 'slider__counter';
                this.counter.innerHTML = `
                    <span class="slider__counter-current">1</span>/<span class="slider__counter-total">${this.slides.length}</span>
                `;
                this.sliderControls.append(this.counter);
            }
        }

        createButton(className, label) {
            const button = document.createElement('button');

            button.className = `slider__button ${className}`;
            button.type = 'button';
            button.setAttribute('aria-label', label);
            button.innerHTML = `
                <svg class="slider__button-icon" width="16" height="16" aria-hidden="true">
                    <use href="./img/icons/sprite.svg#arrow"></use>
                </svg>
            `;

            return button;
        }

        bindEvents() {
            this.nextButton.addEventListener('click', () => this.showNextSlide());
            this.prevButton.addEventListener('click', () => this.showPrevSlide());

            window.addEventListener('resize', () => {
                this.updateVisibleSlides();
                this.goTo(this.currentSlideIndex, false);
            });

            if (this.pauseOnHover) {
                this.slider.addEventListener('mouseenter', () => this.stopAutoplay());
                this.slider.addEventListener('mouseleave', () => this.startAutoplay());
                this.slider.addEventListener('focusin', () => this.stopAutoplay());
                this.slider.addEventListener('focusout', () => this.startAutoplay());
            }

            if (this.swipe) {
                this.slidesList.addEventListener('touchstart', (event) => {
                    this.touchStartX = event.changedTouches[0].clientX;
                    this.touchStartY = event.changedTouches[0].clientY;
                }, { passive: true });

                this.slidesList.addEventListener('touchend', (event) => {
                    const touch = event.changedTouches[0];
                    const deltaX = touch.clientX - this.touchStartX;
                    const deltaY = touch.clientY - this.touchStartY;

                    if (Math.abs(deltaX) < 40 || Math.abs(deltaX) < Math.abs(deltaY)) {
                        return;
                    }

                    if (deltaX < 0) {
                        this.showNextSlide();
                    } else {
                        this.showPrevSlide();
                    }
                }, { passive: true });
            }
        }

        updateVisibleSlides() {
            const slideWidth = this.slides[0].getBoundingClientRect().width;
            const listWidth = this.slidesList.getBoundingClientRect().width;

            this.visibleSlides = Math.max(1, Math.round(listWidth / slideWidth));
        }

        resolveIndex(index) {
            if (this.isLoop) {
                if (index > this.lastAvailableIndex) {
                    return 0;
                }

                if (index < 0) {
                    return this.lastAvailableIndex;
                }

                return index;
            }

            return Math.min(Math.max(index, 0), this.lastAvailableIndex);
        }

        goTo(index, updateTransition = true) {
            this.currentSlideIndex = this.resolveIndex(index);

            if (!updateTransition) {
                this.slidesList.style.transition = 'none';
            }

            this.slidesList.style.transform = `translateX(-${this.slideStep * this.currentSlideIndex}px)`;

            if (!updateTransition) {
                requestAnimationFrame(() => {
                    this.slidesList.style.transition = '';
                });
            }

            this.updateActiveSlides();
            this.updateControls();
        }

        showNextSlide() {
            this.goTo(this.currentSlideIndex + 1);
        }

        showPrevSlide() {
            this.goTo(this.currentSlideIndex - 1);
        }

        updateActiveSlides() {
            this.slides.forEach((slide, index) => {
                const isActive = index >= this.currentSlideIndex
                    && index < this.currentSlideIndex + this.visibleSlides;

                slide.classList.toggle('slider__item_active', isActive);
            });
        }

        updateControls() {
            if (!this.isLoop) {
                this.prevButton.disabled = this.currentSlideIndex === 0;
                this.nextButton.disabled = this.currentSlideIndex >= this.lastAvailableIndex;
                this.prevButton.classList.toggle('slider__button_disabled', this.prevButton.disabled);
                this.nextButton.classList.toggle('slider__button_disabled', this.nextButton.disabled);
            }

            if (this.dotsButtons) {
                this.dotsButtons.forEach((button, index) => {
                    button.classList.toggle('slider__button_active', index === this.currentSlideIndex);
                });
            }

            if (this.counter) {
                const current = Math.min(this.currentSlideIndex + this.visibleSlides, this.slides.length);
                this.counter.querySelector('.slider__counter-current').textContent = current;
            }
        }

        startAutoplay() {
            if (!this.autoplay || this.timerId) {
                return;
            }

            this.timerId = window.setInterval(() => {
                this.showNextSlide();
            }, this.delay);
        }

        stopAutoplay() {
            window.clearInterval(this.timerId);
            this.timerId = null;
        }
    }

    document.querySelectorAll('.running-line__list').forEach((list) => {
        const items = Array.from(list.children);

        items.forEach((item) => {
            const clone = item.cloneNode(true);

            clone.setAttribute('aria-hidden', 'true');
            list.append(clone);
        });
    });

    new Slider({
        selector: '#slider-stages',
        dots: true,
        swipe: true,
        controlsLabel: {
            prev: 'Предыдущая стадия',
            next: 'Следующая стадия',
        },
    });

    new Slider({
        selector: '#slider-members',
        autoplay: true,
        isLoop: true,
        pauseOnHover: true,
        delay: 4000,
        controlsLabel: {
            prev: 'Предыдущий участник',
            next: 'Следующий участник',
        },
    });
});
