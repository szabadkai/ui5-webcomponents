import { getStaticAreaInstance, removeStaticArea } from "./StaticArea.js";
import RenderScheduler from "./RenderScheduler.js";
import getEffectiveStyle from "./theming/getEffectiveStyle.js";
import executeTemplate from "./renderer/executeTemplate.js";
import isLegacyBrowser from "./isLegacyBrowser.js";
import getConstructableStyle from "./theming/getConstructableStyle.js";

/**
 * @class
 * @author SAP SE
 * @private
 * Defines and takes care of ui5-static-are-item items
 */
class StaticAreaItem {
	constructor(_ui5ElementContext) {
		this.ui5ElementContext = _ui5ElementContext;
		this._rendered = false;
	}

	isRendered() {
		return this._rendered;
	}

	/**
	 * @private
	 */
	_createStaticAreaItem() {
		if (this.staticAreaItemDomRef) {
			return;
		}

		// Initial rendering of fragment
		this.staticAreaItemDomRef = document.createElement("ui5-static-area-item");
		this.staticAreaItemDomRef.attachShadow({ mode: "open" });
		this.staticAreaItemDomRef.classList.add(this.ui5ElementContext._id); // used for getting the popover in the tests

		getStaticAreaInstance().appendChild(this.staticAreaItemDomRef);
		this._rendered = true;
	}

	/**
	 * @private
	 */
	_updateStaticAreaItemShadowRoot() {
		const renderResult = executeTemplate(this.ui5ElementContext.constructor.staticAreaTemplate, this.ui5ElementContext);
		let stylesToPrepend;

		if (document.adoptedStyleSheets) { // Chrome
			this.staticAreaItemDomRef.shadowRoot.adoptedStyleSheets = getConstructableStyle(this.ui5ElementContext.constructor, true);
		} else if (!isLegacyBrowser()) { // FF, Safari
			stylesToPrepend = getEffectiveStyle(this.ui5ElementContext.constructor, true);
		}

		this.ui5ElementContext.constructor.render(renderResult, this.staticAreaItemDomRef.shadowRoot, stylesToPrepend, { eventContext: this.ui5ElementContext });
	}

	/**
	 * @protected
	 */
	_updateFragment() {
		this._createStaticAreaItem();
		this._updateContentDensity(this.ui5ElementContext.isCompact);
		this._updateStaticAreaItemShadowRoot();
	}

	/**
	 * @protected
	 */
	_removeFragmentFromStaticArea() {
		if (!this.staticAreaItemDomRef) {
			return;
		}

		const staticArea = getStaticAreaInstance();

		staticArea.removeChild(this.staticAreaItemDomRef);

		this.staticAreaItemDomRef = null;

		// remove static area
		if (staticArea.childElementCount < 1) {
			removeStaticArea();
		}
	}

	/**
	 * @protected
	 */
	_updateContentDensity(isCompact) {
		if (!this.staticAreaItemDomRef) {
			return;
		}

		if (isCompact) {
			this.staticAreaItemDomRef.classList.add("sapUiSizeCompact");
			this.staticAreaItemDomRef.classList.add("ui5-content-density-compact");
		} else {
			this.staticAreaItemDomRef.classList.remove("sapUiSizeCompact");
			this.staticAreaItemDomRef.classList.remove("ui5-content-density-compact");
		}
	}

	/**
	 * @protected
	 * Returns reference to the DOM element where the current fragment is added.
	 */
	async getDomRef() {
		if (!this._rendered || !this.staticAreaItemDomRef) {
			this._updateFragment();
		}
		await RenderScheduler.whenDOMUpdated(); // Wait for the content of the ui5-static-area-item to be rendered
		return this.staticAreaItemDomRef && this.staticAreaItemDomRef.shadowRoot;
	}
}

class StaticAreaItemElement extends HTMLElement {
	constructor() {
		super();
	}

	get isUI5Element() {
		return true;
	}
}

if (!customElements.get("ui5-static-area-item")) {
	customElements.define("ui5-static-area-item", StaticAreaItemElement);
}

export default StaticAreaItem;