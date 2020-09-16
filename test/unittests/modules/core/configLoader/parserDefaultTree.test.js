import DefaultTreeParser from "@modules/core/configLoader/parserDefaultTree.js";
import testServices from "../../../resources/testServices.json";
import Util from "@modules/core/util.js";

// import Collection from "@modules/core/rawLayerList.js";
// import {initializeLayerList} from "masterportalAPI/src/rawLayerList";
import {expect} from "chai";

describe("core/configLoader/parserDefaultTree", function () {

    new Util();

    // Create a model and parse the test data. Take care that the model is clean (empty) before parsing the data.
    /**
     * Helper function to getb the default model.
     * @param {Object} options Options.
     * @returns {Backbone.Model} - Model.
     */
    function getDefaultModel (options) {
        const model = new DefaultTreeParser(options);

        model.setItemList([]);
        model.parseTree(testServices);

        return model;
    }

    describe("the \"select all\" checkbox", function () {
        it("should be visible if global-isFolderSelectable is true", function () {
            expect(Radio.request("Util", "findWhereJs", getDefaultModel({isFolderSelectable: true}).get("itemList"), {"name": "testFolder"}).isFolderSelectable).to.be.equal(true);

        });
        it("should be hidden if global-isFolderSelectable is false", function () {
            expect(Radio.request("Util", "findWhereJs", getDefaultModel({isFolderSelectable: false}).get("itemList"), {"name": "testFolder"}).isFolderSelectable).to.be.equal(false);
        });
    });

    describe("the number of folders within the test data", function () {
        it("should be one", function () {
            expect(getDefaultModel({isFolderSelectable: false}).get("itemList").filter(item => Object.keys({"name": "testFolder"}).every(key => item[key] === {"name": "testFolder"}[key])).length).to.be.equal(1);
        });
    });

    describe("removeWMSBySensorThings", function () {
        it("should be an empty array by empty array input", function () {
            expect(getDefaultModel().removeWMSBySensorThings([])).to.be.an("array").that.is.empty;
        });

        const layerList = [
            {
                "id": "100",
                "typ": "SensorThings",
                "relatedWMSId": "300"
            },
            {
                "id": "200",
                "typ": "WMS"
            },
            {
                "id": "300",
                "typ": "WMS"
            }
        ];

        it("should be empty array without duplicate wms", function () {
            expect(getDefaultModel().removeWMSBySensorThings(layerList).length).to.equal(2);
            expect(getDefaultModel().removeWMSBySensorThings(layerList)).to.deep.include(
                {
                    "id": "100",
                    "typ": "SensorThings",
                    "relatedWMSId": "300"
                },
                {
                    "id": "200",
                    "typ": "WMS"
                }
            );
        });
    });
});
