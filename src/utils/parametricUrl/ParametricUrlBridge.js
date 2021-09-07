import {getLayerWhere} from "masterportalAPI/src/rawLayerList";
import {convert, convertToStringArray, convertTransparency, parseQuery} from "./converter";
import {setValueToState} from "./stateModifier";
import store from "../../app-store";
import {MapMode} from "../../modules/map/store/enums";

const toolsNotInState = ["compareFeatures", "parcelSearch", "print", "featureLister", "layerSlider", "filter", "shadow", "virtualcity", "wfst", "styleWMS", "extendedFilter", "wfsFeatureFilter", "wfst"];

/**
 * Sets url params to state, which are used before mount of vue-app.
 * @returns {void}
 */
export function readUrlParamStyle () {
    const params = new URLSearchParams(window.location.search);

    params.forEach(function (value, key) {
        if (key.toLowerCase() === "style" || key.toLowerCase() === "uistyle") {
            const valueUpperCase = value.toUpperCase();

            if (valueUpperCase === "TABLE" || valueUpperCase === "SIMPLE") {
                store.state.urlParams.uiStyle = valueUpperCase;
            }
        }
    });
}
/**
 * Sets url params to state, which are used before mount of vue-app.
 * @param {String} query content of window.location.search
 * @returns {void}
 */
export function handleUrlParamsBeforeVueMount (query) {
    const params = new URLSearchParams(query);

    params.forEach(function (value, key) {
        if (key.toLowerCase() === "query" || key.toLowerCase() === "search/query") {
            store.state.urlParams["Search/query"] = parseQuery(value);
        }
        else if (key.toLocaleLowerCase() === "map/layerids" || key.toLocaleLowerCase() === "layerids") {
            const visibility = params.has("visibility") ? params.get("visibility") : "",
                transparency = params.has("transparency") ? params.get("transparency") : "";

            store.state.urlParams["Map/layerIds"] = parseLayerParams(value, visibility, transparency);
        }
    });
}
/**
 * Triggers at backbone Radio channel "ParametricURL": "ready".
 * @returns {void}
 */
export function triggerParametricURLReady () {
    const channel = Radio.channel("ParametricURL");

    channel.trigger("ready");
}
/**
 * Returns key and value containing previous content to handle in backbone model.
 * @param {String} urlParamsKey key of url params
 * @param {String} urlParamsValue value of url params
 * @returns {Object} containg key and value containing previous content to handle in backbone model
 */
export function translateToBackbone (urlParamsKey, urlParamsValue) {
    const paramsKey = urlParamsKey.toLowerCase().trim();

    if (paramsKey.startsWith("tools") || paramsKey.indexOf("/active") > -1) {
        let key = urlParamsKey;

        key = key.replace(/tools/i, "");
        key = key.replace(/active/i, "");
        key = key.replace(/\//g, "");

        return {key: "isinitopen", value: key};
    }
    else if (toolsNotInState.find(toolName=>toolName.toLowerCase() === paramsKey.toLocaleLowerCase())) {
        return {key: "isinitopen", value: paramsKey};
    }
    return {key: urlParamsKey, value: urlParamsValue};
}
/**
 * Depending on given key and value special handling in backbone world is triggered.
 * @param {String} key key of url params
 * @param {String} value  value of url params
 * @returns {void}
 */
export function doSpecialBackboneHandling (key, value) {
    if (key === "Map/mapMode") {
        if (value === MapMode.MODE_3D || String(value).toLowerCase() === "3d") {
            Radio.trigger("Map", "mapChangeTo3d");
        }
    }
    else if (key === "Map/mdId") {
        const layers = getLayersUsingMetaId(value);

        setLayersVisible(layers);
    }
    else if (key === "Map/zoomToExtent") {
        Radio.trigger("Map", "zoomToExtent", convert(value), {duration: 0}, store.state.urlParams?.projection);
    }
    else if (key === "Map/zoomToGeometry") {
        const gemometryToZoom = parseZoomToGeometry(value);

        if (gemometryToZoom !== "") {
            Radio.trigger("ZoomToGeometry", "zoomToGeometry", gemometryToZoom, Config.zoomToGeometry.layerId, Config.zoomToGeometry.attribute);
        }
    }
    else if (key === "style") {
        const resultUpperCase = value.toUpperCase();

        if (resultUpperCase === "TABLE" || resultUpperCase === "SIMPLE") {
            Radio.trigger("Util", "setUiStyle", resultUpperCase);
        }
    }
}
/**
     * Parses a Gemometry to be zoomed on.
     * Only configured geometries are zoomed in.
     * @param {String} urlParamValue Geometry to be zoomed on
     * @returns {String} Geometry to be zoomed on
     */
function parseZoomToGeometry (urlParamValue) {
    let geometries,
        gemometryToZoom = "";

    if (Object.prototype.hasOwnProperty.call(Config, "zoomToGeometry") && Object.prototype.hasOwnProperty.call(Config.zoomToGeometry, "geometries")) {
        geometries = Config.zoomToGeometry.geometries;

        if (geometries.includes(urlParamValue.toUpperCase())) {
            gemometryToZoom = urlParamValue.toUpperCase();
        }
        else if (Number.isInteger(parseInt(urlParamValue, 10))) {
            gemometryToZoom = geometries[parseInt(urlParamValue, 10) - 1];
        }
        else {
            store.dispatch("Alerting/addSingleAlert", i18next.t("common:utils.parametricURL.alertZoomToGeometry"));
        }
    }

    return gemometryToZoom;
}

/**
     * Returns the ids of the layer with the given metadataid and the last configured basemap.
     * @param {String} values comma separated list of meta-ids
     * @returns {Object} containing layerIdList, visibilityList and transparencyList
     */
function getLayersUsingMetaId (values) {
    const metaIds = values.split(","),
        layersIds = [],
        baseMaps = Radio.request("Parser", "getItemsByAttributes", {isBaseLayer: true});

    if (Config.tree) {
        Config.tree.metaIdsToSelected = values;
    }
    if (Config.view) {
        Config.view.zoomLevel = 0;
    }
    if (baseMaps) {
        layersIds.push(baseMaps[baseMaps.length - 1].id);
    }

    metaIds.forEach(metaId => {
        const metaIDlayers = Radio.request("Parser", "getItemsByMetaID", metaId);

        metaIDlayers.forEach(layer => {
            layersIds.push(layer.id);
        });
    });
    return {layerIdList: layersIds, visibilityList: layersIds.map(() => true), transparencyList: layersIds.map(() => 0)};
}
/**
     * Parses the string with layer ids, parses visibility and transparency if available in state.urlParams.
     * Amount of layer ids and visibilities and transparencies must be the same.
     * @param {String} layerIdString comma separated ids
     * @param {String} visibilityString comma separated booleans for visibility
     * @param {String} transparencyString comma separated numbers for transparency
     * @returns {Object} containing layerIdList, visibilityList and transparencyList
     */
function parseLayerParams (layerIdString, visibilityString = "", transparencyString = "") {
    const visibilityListBooleans = store.state.urlParams?.visibility ? convert(store.state.urlParams.visibility) : convert(visibilityString),
        transparencyListNumbers = store.state.urlParams?.transparency ? convertTransparency(store.state.urlParams.transparency) : convertTransparency(transparencyString),
        layerParams = [],
        wrongIdsPositions = [],
        treeType = Radio.request("Parser", "getTreeType");

    let layerIdList = convertToStringArray(layerIdString),
        visibilityList = visibilityListBooleans,
        transparencyList = transparencyListNumbers;

    if (typeof layerIdList === "string") {
        layerIdList = [layerIdList];
    }
    if (typeof visibilityListBooleans === "boolean") {
        visibilityList = [visibilityListBooleans];
    }
    else if (visibilityListBooleans === "") {
        visibilityList = layerIdList.map(() => true);
    }
    if (typeof transparencyListNumbers === "string" && transparencyListNumbers !== "") {
        transparencyList = [transparencyListNumbers];
    }
    else if (transparencyListNumbers === "") {
        transparencyList = layerIdList.map(() => 0);
    }
    if (layerIdList.length !== visibilityList.length || visibilityList.length !== transparencyList.length) {
        // timeout may be removed, if everything is migrated to vue. Now it is needed for portal/basic.
        setTimeout(() => {
            store.dispatch("Alerting/addSingleAlert", i18next.t("common:utils.parametricURL.alertWrongAmountVisibility"), {root: true, category: "Warning"});
        }, 500);
        return null;
    }
    layerIdList.forEach((id, index) => {
        const layerConfigured = Radio.request("Parser", "getItemByAttributes", {id: id}),
            layerExisting = getLayerWhere({id: id}),
            optionsOfLayer = {
                id: id,
                visibility: visibilityList[index]
            };

        let layerToPush;

        if (transparencyList[index] !== null) {
            optionsOfLayer.transparency = transparencyList[index];
        }
        layerParams.push(optionsOfLayer);

        if (layerConfigured === undefined && layerExisting !== null && treeType === "light") {
            layerToPush = Object.assign({
                isBaseLayer: false,
                isVisibleInTree: "true",
                parentId: "tree",
                type: "layer"
            }, layerExisting);
            Radio.trigger("Parser", "addItemAtTop", layerToPush);
        }
        else if (layerConfigured === undefined) {
            wrongIdsPositions.push(index + 1);
        }
    });
    alertWrongLayerIds(wrongIdsPositions);
    return layerParams;
}
/**
     * Creates or adds the models of the layerIds and sets them visible in map depending on url param visibility and transparency.
     * @param {string} layerParams the layerIdList, visibilityList and transparencyList
     * @returns {void}
     */
function setLayersVisible (layerParams) {
    const wrongIdsPositions = [];

    if (layerParams) {
        layerParams.layerIdList.forEach((val, index) => {
            const id = String(val),
                rawLayer = getLayerWhere({id: id}),
                optionsOfLayer = {
                    id: id,
                    visibility: layerParams.visibilityList[index]
                },
                layerFromParser = Radio.request("Parser", "getItemByAttributes", {id: id});
            let layerToPush,
                layer = Radio.request("ModelList", "getModelByAttributes", {id: id});

            if (layerParams.transparencyList[index] !== null) {
                optionsOfLayer.transparency = layerParams.transparencyList[index];
            }
            if (layerFromParser === undefined && rawLayer !== null) {
                layerToPush = Object.assign({
                    isBaseLayer: false,
                    isVisibleInTree: "true",
                    parentId: "tree",
                    type: "layer",
                    isVisible: true,
                    isSelected: true
                }, rawLayer);

                Radio.trigger("Parser", "addItemAtTop", layerToPush);
                Radio.trigger("ModelList", "addModelsByAttributes", {id: id});
                Radio.trigger("ModelList", "setModelAttributesById", id, optionsOfLayer);
                layer = Radio.request("ModelList", "getModelByAttributes", {id: id});
                layer.setIsSelected(optionsOfLayer.visibility);
                Radio.trigger("Util", "refreshTree");
            }
            else if (layer) {
                Radio.trigger("ModelList", "setModelAttributesById", id, optionsOfLayer);
                layer.setIsSelected(optionsOfLayer.visibility);
                Radio.trigger("Util", "refreshTree");

            }
            else if (layerFromParser) {
                Radio.trigger("ModelList", "addModelsByAttributes", {id: optionsOfLayer.id});
                layer = Radio.request("ModelList", "getModelByAttributes", {id: optionsOfLayer.id});
                layer.setIsSelected(optionsOfLayer.visibility);
                layer.setVisible(optionsOfLayer.visibility);
                Radio.trigger("Util", "refreshTree");
            }
            else if (layerFromParser === undefined) {
                wrongIdsPositions.push(index + 1);
            }
            Radio.request("ModelList", "initLayerIndeces");
        });
    }
    alertWrongLayerIds(wrongIdsPositions);
}
/**
     * Build alert for wrong layerids
     * @param {string[]} wrongIdsPositions - The positions from wrong layerids.
     * @returns {void}
     */
function alertWrongLayerIds (wrongIdsPositions) {
    if (wrongIdsPositions.length > 0) {
        let wrongIdsPositionsConcat = wrongIdsPositions.shift();

        wrongIdsPositions.forEach(position => {
            wrongIdsPositionsConcat = wrongIdsPositionsConcat + ", " + String(position);
        });
        // timeout may be removed, if everything is migrated to vue. Now it is needed for portal/basic.
        setTimeout(() => {
            store.dispatch("Alerting/addSingleAlert", i18next.t("common:utils.parametricURL.alertWrongLayerIds", {wrongIdsPositionsConcat: wrongIdsPositionsConcat}), {root: true});
        }, 500);
    }
}

/**
     * Updates the loaction.search content with given key and value.
     * Sets the key and value to vuex state urlParams or to state entry, if exists.
     * If an iframe is active, the remoteInterface is used.
     * https://gist.github.com/excalq/2961415: Set or Update a URL/QueryString Parameter, and update URL using HTML history.replaceState().
     * @param  {string} key - url param key
     * @param  {string} value - url param value
     * @fires RemoteInterface#RadioTriggerRemoteInterfacePostMessage
     * @returns {void}
     */
export async function updateQueryStringParam (key, value) {
    const baseUrl = [location.protocol, "//", location.host, location.pathname].join(""),
        urlQueryString = document.location.search,
        newParam = key + "=" + value;

    let keyRegex,
        params = "?" + newParam;

    // If the "search" string exists, then build params from it
    if (urlQueryString) {
        keyRegex = new RegExp("([?,&])" + key + "[^&]*");

        // If param exists already, update it
        if (urlQueryString.match(keyRegex) !== null) {
            params = urlQueryString.replace(keyRegex, "$1" + newParam);
        }
        // Otherwise, add it to end of query string
        else {
            params = urlQueryString + "&" + newParam;
        }
    }
    // iframe
    if (window !== window.top) {
        Radio.trigger("RemoteInterface", "postMessage", {"urlParams": params});
    }
    else {
        window.history.replaceState({}, "", baseUrl + params);
    }
    await parseURL(location.search.substr(1));
}

/**
     * Parse the URL parameters.
     * @param {string} query - URL --> everything after ? if available.
     * @returns {void}
     */
async function parseURL (query) {
    if (query.length > 0) {
        query.split("&").forEach(parameterFromUrl => {
            const parameterFromUrlAsArray = parameterFromUrl.split("="),
                parameterValue = decodeURIComponent(parameterFromUrlAsArray[1]);

            setValueToState(store.state, parameterFromUrlAsArray[0], parameterValue);
        });
    }
}

