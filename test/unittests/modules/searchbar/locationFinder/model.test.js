import LocationFinderModel from "@modules/searchbar/locationFinder/model.js";
import {expect} from "chai";

describe("modules/searchbar/locationFinder", function () {

    let model;

    beforeEach(function () {
        model = new LocationFinderModel({
            serviceId: "testId"
        });
        model.set("serviceUrl", "testServiceUrl");
    });

    describe("search", function () {

        it("Build URL and payload", function () {

            model.set("sref", "testEpsgCode");

            model.sendRequest = function (url, payload) {
                expect(url).to.eq("testServiceUrl/Lookup");
                expect(payload).to.eql({
                    query: "helloWorld",
                    sref: "testEpsgCode"
                });
            };

            model.search("helloWorld");
        });

        it("Build URL and payload with filter", function () {

            model.set("classes", ["Adresse", "Straßenname"]);
            model.set("sref", "testEpsgCode");

            model.sendRequest = function (url, payload) {
                expect(url).to.eq("testServiceUrl/Lookup");
                expect(payload).to.eql({
                    query: "helloWorld",
                    filter: "type:Adresse,Straßenname",
                    sref: "testEpsgCode"
                });
            };

            model.search("helloWorld");
        });
    });
});
