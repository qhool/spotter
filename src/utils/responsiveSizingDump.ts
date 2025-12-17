export function responsiveSizingDump(): string {
	const vv = window.visualViewport;

	const dpr = window.devicePixelRatio ?? NaN;
	const docEl = document.documentElement;

	const screenCssW = screen.width;
	const screenCssH = screen.height;

	const dump: Record<string, unknown> = {
		ts: new Date().toISOString(),

		// What media queries and layout typically key off of
		viewport_css: {
			innerWidth: window.innerWidth,
			innerHeight: window.innerHeight,
			clientWidth: docEl.clientWidth,
			clientHeight: docEl.clientHeight
		},

		// Physical-ish characteristics exposed to JS (still mostly “CSS-ish”)
		screen_css: {
			width: screenCssW,
			height: screenCssH,
			availWidth: screen.availWidth,
			availHeight: screen.availHeight,
			colorDepth: screen.colorDepth,
			pixelDepth: screen.pixelDepth,
			orientation: screen.orientation?.type ?? null,
			orientationAngle: screen.orientation?.angle ?? null
		},

		// DPR & derived backing-store-ish pixel counts
		dpr: {
			devicePixelRatio: dpr,
			viewport_device_px: {
				width: Math.round(window.innerWidth * dpr),
				height: Math.round(window.innerHeight * dpr)
			},
			screen_device_px: {
				width: Math.round(screenCssW * dpr),
				height: Math.round(screenCssH * dpr)
			}
		},

		// Useful for “why is my page zoomed?” and accessibility scaling
		zoom: {
			// Often ~1; changes with pinch-zoom / page zoom.
			visualViewportScale: vv?.scale ?? null,
			// Layout viewport / visual viewport can diverge on mobile when zoomed.
			visualViewport_css: vv
				? {
						width: vv.width,
						height: vv.height,
						offsetLeft: vv.offsetLeft,
						offsetTop: vv.offsetTop,
						pageLeft: vv.pageLeft,
						pageTop: vv.pageTop
					}
				: null
		},

		// Helpful for responsive breakpoints
		media: {
			prefersReducedMotion: matchMedia('(prefers-reduced-motion: reduce)').matches,
			prefersColorSchemeDark: matchMedia('(prefers-color-scheme: dark)').matches,
			pointer: {
				anyHover: matchMedia('(any-hover: hover)').matches,
				anyPointerFine: matchMedia('(any-pointer: fine)').matches,
				hover: matchMedia('(hover: hover)').matches,
				pointerFine: matchMedia('(pointer: fine)').matches
			}
		}
	};

	// Pretty JSON + a short one-line summary up top
	const summary =
		`inner=${window.innerWidth}x${window.innerHeight}css ` +
		`client=${docEl.clientWidth}x${docEl.clientHeight}css ` +
		`dpr=${dpr} ` +
		`vvScale=${vv?.scale ?? 'n/a'}`;

	return summary + '\n' + JSON.stringify(dump, null, 2);
}
