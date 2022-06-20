import initialState from "./stateWfsTransaction";
import {generateSimpleGetters} from "../../../../app-store/utils/generators";

const getters = {
    ...generateSimpleGetters(initialState),
    currentInteractionConfig (state, {currentLayerId}) {
        // TODO(roehlipa): Adjust doc for edit and delete as well as their functionality
        const configuration = {
            LineString: {
                available: false,
                caption: "common:modules.tools.wfsTransaction.interactionSelect.line",
                icon: "bi-slash-lg",
                multi: false
            },
            Point: {
                available: false,
                caption: "common:modules.tools.wfsTransaction.interactionSelect.point",
                icon: "bi-record-circle",
                multi: false
            },
            Polygon: {
                available: false,
                caption: "common:modules.tools.wfsTransaction.interactionSelect.polygon",
                icon: "bi-hexagon-fill",
                multi: false
            },
            edit: {
                icon: "bi-pencil-square"
            },
            delete: {
                icon: "bi-trash"
            }
        };

        ["delete", "edit"].forEach(val => {
            configuration[val].available = typeof state[val] === "boolean" ? state[val] : true;
            configuration[val].caption = typeof state[val] === "string" ? state[val] : `common:modules.tools.wfsTransaction.interactionSelect.${val}`;
        });
        ["LineString", "Point", "Polygon"].forEach(val => {
            let geometryConfiguration,
                layerConfiguration = null;

            if (val === "Polygon" && state.areaButton !== undefined && state.areaButton.length > 0) {
                // TODO: Shrink this to a single const when areaButton is removed
                console.warn("WfsTransaction: The configuration parameter 'areaButton' has been deprecated. Please use 'polygonButton' instead.");
                geometryConfiguration = state.areaButton;
            }
            else {
                geometryConfiguration = state[(val.endsWith("String") ? val.replace("String", "") : val).toLowerCase() + "Button"];
            }
            if (!geometryConfiguration) {
                return;
            }
            if (typeof geometryConfiguration === "boolean") {
                configuration[val].available = true;
                return;
            }
            layerConfiguration = geometryConfiguration.find(config => config.layerId === currentLayerId);
            if (layerConfiguration === undefined) {
                return;
            }
            configuration[val].available = layerConfiguration.show; // TODO(roehlipa): Maybe deprecate parameter "show" in favour of "available"? Or "enabled"?
            configuration[val].caption = layerConfiguration.caption ? layerConfiguration.caption : configuration[val].caption;
            configuration[val].multi = layerConfiguration.multi ? layerConfiguration.multi : false;
        });
        return configuration;
    },
    currentLayerId (state) {
        return state.layerIds[state.currentLayerIndex];
    },
    requiredFieldsFilled (state) {
        return state.featureProperties.every(property => property.required ? property.value !== null : true);
    },
    showInteractionsButtons (state) {
        // TODO(roehlipa): The form should also be displayed when editing a feature to be able to update the properties
        return [null, "delete", "edit"].includes(state.selectedInteraction);
    }
};

export default getters;
