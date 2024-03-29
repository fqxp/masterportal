import {expect} from "chai";
import sinon from "sinon";
import WMSTimeLayer from "../../wmsTime";
import store from "../../../../app-store";

describe("src/core/layers/wmsTime.js", () => {
    let attributes;

    before(() => {
        mapCollection.clear();
        const map = {
            id: "ol",
            mode: "2D",
            addInteraction: sinon.stub(),
            removeInteraction: sinon.stub(),
            addLayer: sinon.spy(),
            getLayers: () => {
                return {
                    getArray: () => [{
                        getVisible: () => true,
                        get: () => "layerId"
                    }],
                    getLength: sinon.spy(),
                    forEach: sinon.spy()
                };
            },
            getView: () => {
                return {
                    getResolutions: () => [2000, 1000]
                };
            }
        };

        mapCollection.addMap(map, "2D");
    });
    beforeEach(() => {
        sinon.stub(WMSTimeLayer.prototype, "requestCapabilities").returns(new Promise(resolve => resolve({status: 200, statusText: "OK", data: {}})));
        attributes = {
            name: "wmsTimeTestLayer",
            id: "id",
            typ: "WMS",
            tilesize: 512,
            singleTile: false,
            minScale: "0",
            maxScale: "2500000",
            isChildLayer: false,
            layers: "layer1,layer2",
            transparent: false,
            isSelected: false,
            time: {
                default: "1997"
            }
        };
        store.getters = {
            treeType: "custom"
        };
    });

    afterEach(() => {
        sinon.restore();
    });

    it("createLayer shall create an ol/Layer with source", function () {
        const wmsTimeLayer = new WMSTimeLayer(attributes),
            layer = wmsTimeLayer.get("layer");

        expect(layer).not.to.be.undefined;
        expect(layer.getSource()).not.to.be.undefined;
    });
    it("createLayer with isSelected=true shall add layer to map", function () {
        attributes.isSelected = true;
        const wmsTimeLayer = new WMSTimeLayer(attributes),
            layer = wmsTimeLayer.get("layer");

        expect(layer).not.to.be.undefined;
        expect(wmsTimeLayer.get("isVisibleInMap")).to.be.true;
        expect(wmsTimeLayer.get("layer").getVisible()).to.be.true;
    });
    it("createLayer with isSelected=false shall not add layer to map", function () {
        const wmsTimeLayer = new WMSTimeLayer(attributes);

        expect(wmsTimeLayer.get("layer")).not.to.be.undefined;
        expect(wmsTimeLayer.get("isVisibleInMap")).to.be.false;
        expect(wmsTimeLayer.get("layer").getVisible()).to.be.false;
    });
    it("extractExtentValues - extract an object that contains the time range", function () {
        const wmsTimeLayer = new WMSTimeLayer(attributes),
            extent = {
                value: "2006/2018/P2Y"
            };

        expect(wmsTimeLayer.extractExtentValues(extent)).deep.equals({
            timeRange: ["2006", "2008", "2010", "2012", "2014", "2016", "2018"],
            step: {
                year: "2"
            }
        });
    });
    it("createTimeRange - create an array with the time range", function () {
        const wmsTimeLayer = new WMSTimeLayer(attributes),
            min = "2006",
            max = "2018",
            step = {
                years: "2"
            };

        expect(wmsTimeLayer.createTimeRange(min, max, step)).to.be.an("array");
        expect(wmsTimeLayer.createTimeRange(min, max, step)).includes("2006", "2008", "2010", "2012", "2014", "2016", "2018");
    });
    it("createTimeRange - create an array with the time range", function () {
        const wmsTimeLayer = new WMSTimeLayer(attributes),
            min = "2006",
            max = "2018",
            step = {
                years: "2"
            };

        expect(wmsTimeLayer.createTimeRange(min, max, step)).to.be.an("array");
        expect(wmsTimeLayer.createTimeRange(min, max, step)).includes("2006", "2008", "2010", "2012", "2014", "2016", "2018");
    });

    describe("createCapabilitiesUrl", () => {
        it("test params", () => {
            const wmsTimeUrl = "https://geodienste.hamburg.de/HH_WMS-T_Satellitenbilder_Sentinel-2",
                version = "1.1.1",
                layers = "layer1",
                wmsTimeLayer = new WMSTimeLayer(attributes),
                createdUrl = wmsTimeLayer.createCapabilitiesUrl(wmsTimeUrl, version, layers);

            expect(createdUrl.origin).to.eql("https://geodienste.hamburg.de");
            expect(createdUrl.pathname).to.eql("/HH_WMS-T_Satellitenbilder_Sentinel-2");
            expect(createdUrl.searchParams.get("service")).to.eql("WMS");
            expect(createdUrl.searchParams.get("version")).to.eql(version);
            expect(createdUrl.searchParams.get("layers")).to.eql(layers);
            expect(createdUrl.searchParams.get("request")).to.eql("GetCapabilities");
        });

        it("createUrl should respect questionmark in url", () => {
            const wmsTimeUrl = "https://mapservice.regensburg.de/cgi-bin/mapserv?map=wfs.map",
                version = "1.1.1",
                layers = "layer1,layer2",
                wmsTimeLayer = new WMSTimeLayer(attributes),
                createdUrl = wmsTimeLayer.createCapabilitiesUrl(wmsTimeUrl, version, layers);

            expect(createdUrl.origin).to.eql("https://mapservice.regensburg.de");
            expect(createdUrl.pathname).to.eql("/cgi-bin/mapserv");
            expect(createdUrl.searchParams.get("map")).to.eql("wfs.map");
            expect(createdUrl.searchParams.get("service")).to.eql("WMS");
            expect(createdUrl.searchParams.get("version")).to.eql(version);
            expect(createdUrl.searchParams.get("layers")).to.eql(layers);
            expect(createdUrl.searchParams.get("request")).to.eql("GetCapabilities");
        });
    });
});
