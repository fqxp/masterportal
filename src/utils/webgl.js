import Layer from "../core/layers/layer";
import * as webgl from "@masterportal/masterportalapi/src/renderer/webgl";

/**
 * Hides all features by removing them from the layer source.
 * @public
 * @override <LayerType>.hideAllFeatures
 * @returns {void}
 */
export function hideAllFeatures () {
    this.get("layerSource").clear();
}

/**
 * sets the layerSource to have the inital features array
 * @public
 * @override <LayerType>.showAllFeatures
 * @returns {void}
 */
export function showAllFeatures () {
    this.hideAllFeatures();
    this.get("layerSource").addFeatures(this.features);
}

/**
 * Filters the visibility of features by ids.
 * @public
 * @param  {String[]} featureIdList Feature ids to be shown.
 * @override <LayerType>.showFeaturesByIds
 * @return {void}
 */
export function showFeaturesByIds (featureIdList) {
    const featuresToShow = featureIdList.map(id => this.features.find(feature => feature.getId() === id));

    this.hideAllFeatures();
    this.get("layerSource").addFeatures(featuresToShow);
}

/**
 * Sets the attribute isSelected and sets the layers visibility. If newValue is false, the layer is removed from map.
 * Calls the layer super, disposes WebGL resources if layer is set invisible
 * @public
 * @override <LayerType>.setIsSelected
 * @memberof WebGLLayer
 * @implements {Layer.setIsSelected}
 * @param {Boolean} newValue true, if layer is selected
 * @todo rerender map after canvas render complete
 *       necessary for GPU rendering, since no map/layer event catches the rendering correctly
 *       otherwise icons will be rendered as black quads
 * @returns {void}
 */
async function setIsSelected (newValue) {
    if (this.isDisposed()) {
        // recreate layer instance if buffer has been disposed
        this.layer = webgl.createLayer({...this.attributes, source: this.source});
    }

    Layer.prototype.setIsSelected.call(this, newValue);

    if (!this.get("isVisibleInMap")) {
        // dispose WebGL buffer if layer removed
        this.layer.dispose();
    }
}

/**
 * Returns whether the WebGL resources have been disposed
 * @memberof WebGLLayer
 * @public
 * @readonly
 * @returns {Boolean} true / false
 */
export function isDisposed () {
    return this.layer ? this.layer.disposed : true;
}

/**
 * Remove setter for style
 * If renderer is webgl don't do anything
 * @returns {void}
 */
export function setStyle () {
    /**
     * execute empty
     * @todo enable future update of style?
     */
}

/**
 * Sets the necessary class methods/properties if layer uses webgl renderer
 * Overrides existing methods and properties
 * @param {Layer} layerInstance - the layer instance to modify
 * @returns {void}
 */
export function setLayerProperties (layerInstance) {
    // set this.source as persistent, if layer is disposed
    layerInstance.source = layerInstance.layer.getSource();

    // override layer methods
    layerInstance.isDisposed = isDisposed;
    layerInstance.setIsSelected = setIsSelected;
    layerInstance.hideAllFeatures = hideAllFeatures;
    layerInstance.showAllFeatures = showAllFeatures;
    layerInstance.showFeaturesByIds = showFeaturesByIds;
    layerInstance.setStyle = setStyle;
    layerInstance.styling = setStyle;
}

export default {
    setLayerProperties,
    hideAllFeatures,
    showAllFeatures,
    showFeaturesByIds,
    setIsSelected,
    isDisposed,
    setStyle
};
