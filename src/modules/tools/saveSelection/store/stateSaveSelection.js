/**
 * SaveSelection tool state definition.
 * @typedef {Object} SaveSelectionState
 * @property {Boolean} active if true, SaveSelection will be rendered.
 * @property {String} id id of the SaveSelection component.
 * @property {String} name Displayed as the title. (config-param)
 * @property {String} glyphicon Icon next to the title. (config-param)
 * @property {Boolean} renderToWindow If true, tool is rendered in a window, else in the sidebar. (config-param)
 * @property {Boolean} resizableWindow If true, window is resizable. (config-param)
 * @property {Boolean} isVisibleInMenu If true, tool is selectable in menu. (config-param)
 * @property {Boolean} deactivateGFI Flag if tool should deactivate GFI. (config-param)
 * @property {String[]} layerIds Array of unique layer ids.
 * @property {?ModelList} layerList List of layers.
 * @property {Number[]} layerTransparencies Array of transparencies of the layers.
 * @property {Number[]} layerVisibilities Array of visiblities of the layers.
 */
const state = {
    active: false,
    id: "saveSelection",
    // defaults for config.json tool parameters
    name: "common:menu.tools.saveSelection",
    glyphicon: "glyphicon-share",
    renderToWindow: true,
    resizableWindow: true,
    isVisibleInMenu: true,
    deactivateGFI: true,
    // saveSelection state
    layerIds: [],
    layerList: [],
    layerTransparencies: [],
    layerVisibilities: []
};

export default state;
