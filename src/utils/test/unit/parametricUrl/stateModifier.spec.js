import {expect} from "chai";
import {setValueToState} from "../../../parametricUrl/stateModifier";
import * as crs from "masterportalAPI/src/crs";

const namedProjections = [
    ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
    ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
    ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
    ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
];

describe("src/utils/stateModifier.js", () => {
    describe("setValueToState", () => {
        it("setValueToState does not react if key is not an array", () => {
            const state = {
                    urlParams: {},
                    Tools: {
                        Measure: {
                            active: false
                        }
                    }
                },
                value = "true";

            setValueToState(state, null, value);
            expect(state.Tools.Measure.active).to.be.equals(false);

            setValueToState(state, undefined, value);
            expect(state.Tools.Measure.active).to.be.equals(false);

            setValueToState(state, {}, value);
            expect(state.Tools.Measure.active).to.be.equals(false);
        });
        it("setValueToState sets a boolean", async () => {
            const key = "Tools/Measure/active",
                state = {
                    urlParams: {},
                    Tools: {
                        Measure: {
                            active: false
                        }
                    }
                };

            await setValueToState(state, key, "true");
            expect(state.Tools.Measure.active).to.be.equals(true);

            state.Tools.Measure.active = false;
            await setValueToState(state, key, "1");
            expect(state.Tools.Measure.active).to.be.equals(true);

            state.Tools.Measure.active = false;
            await setValueToState(state, key, true);
            expect(state.Tools.Measure.active).to.be.equals(true);

            await setValueToState(state, key, "false");
            expect(state.Tools.Measure.active).to.be.equals(false);

            state.Tools.Measure.active = true;
            await setValueToState(state, key, "0");
            expect(state.Tools.Measure.active).to.be.equals(false);

            state.Tools.Measure.active = true;
            await setValueToState(state, key, false);
            expect(state.Tools.Measure.active).to.be.equals(false);

            state.Tools.Measure.active = true;
            await setValueToState(state, key, null);
            expect(state.Tools.Measure.active).to.be.equals(false);
        });

        /**
        * These kinds of params are possible for starting tool draw:
        * It doesn't matter if it is controlled by vuex state or by backbone.
        *  ?Tools/Draw/active=true
        *  ?tools/Draw/active=true
        *  ?tools/draw/active=true
        *  ?Draw/active=true
        *  ?draw/active=true
        *  ?Draw/active
        *  ?draw/active
        *  ?isinitopen=draw
        *  ?isinitopen=Draw
        *  ?startupmodul=Draw
        *  ?startupmodul=draw
        */
        describe("test start tool by urlparams", () => {
            it("setValueToState sets tool active with param without incomplete key, no value or key has not expected case", async () => {
                let key = "Tools/Measure/active";
                const state = {
                    urlParams: {},
                    Tools: {
                        Measure: {
                            active: false
                        }
                    }
                };

                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "tools/Measure/active";
                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "tools/measure/active";
                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "Measure/active";
                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "measure/active";
                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "Measure/active";
                await setValueToState(state, key, "");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "measure/active";
                await setValueToState(state, key, "");
                expect(state.Tools.Measure.active).to.be.equals(true);

                state.Tools.Measure.active = false;
                key = "measure";
                await setValueToState(state, key, "true");
                expect(state.Tools.Measure.active).to.be.equals(true);

            });
            it("setValueToState with isinitopen, tool is in state", async () => {
                const key = "isinitopen",
                    state = {
                        urlParams: {},
                        Tools: {
                            Measure: {
                                active: false
                            }
                        }
                    };
                let value = "measure";

                await setValueToState(state, key, value);
                expect(state.Tools.Measure.active).to.be.equals(true);
                expect(state.urlParams[key]).to.be.equals(undefined);

                state.Tools.Measure.active = false;
                state.isinitopen = undefined;
                value = "Measure";
                await setValueToState(state, key, value);
                expect(state.Tools.Measure.active).to.be.equals(true);
                expect(state.urlParams[key]).to.be.equals(undefined);

            });
            it("setValueToState with isinitopen, tool is not in state", async () => {
                const key = "isinitopen",
                    state = {
                        urlParams: {},
                        Tools: {
                        }
                    };
                let value = "print";

                await setValueToState(state, key, value);
                expect(state.Tools.Print).to.be.equals(undefined);
                expect(state.urlParams[key]).to.be.equals("print");

                state.Tools = {};
                state.urlParams = {};
                state.isinitopen = undefined;
                value = "Print";
                await setValueToState(state, key, value);
                expect(state.Tools.Print).to.be.equals(undefined);
                expect(state.urlParams[key]).to.be.equals("Print");
            });


            it("setValueToState with startupmodul, tool is in state", async () => {
                const key = "startupmodul",
                    state = {
                        urlParams: {},
                        Tools: {
                            Measure: {
                                active: false
                            }
                        }
                    };
                let value = "measure";

                await setValueToState(state, key, value);
                expect(state.Tools.Measure.active).to.be.equals(true);
                expect(state.urlParams.isinitopen).to.be.equals(undefined);

                state.Tools.Measure.active = false;
                state.startupmodul = undefined;
                value = "Measure";
                await setValueToState(state, key, value);
                expect(state.Tools.Measure.active).to.be.equals(true);
                expect(state.urlParams.isinitopen).to.be.equals(undefined);

            });
            it("setValueToState with startupmodul, tool is not in state", async () => {
                const key = "startupmodul",
                    state = {
                        urlParams: {},
                        Tools: {
                        }
                    };
                let value = "print";

                await setValueToState(state, key, value);
                expect(state.Tools.Print).to.be.equals(undefined);
                expect(state.urlParams.isinitopen).to.be.equals("print");

                state.Tools.Print = undefined;
                state.isinitopen = undefined;
                value = "Print";
                await setValueToState(state, key, value);
                expect(state.Tools.Print).to.be.equals(undefined);
                expect(state.urlParams.isinitopen).to.be.equals("Print");
            });
        });
        describe("UrlParam center", () => {
            it("?Map/center or only center as param-key is set to state", async () => {
                let key = "Map/center",
                    valueAsString = "[553925,5931898]";
                const state = {
                        urlParams: {},
                        Map: {
                            center: [0, 0]
                        }
                    },
                    value = [553925, 5931898];

                await setValueToState(state, key, valueAsString);
                expect(state.Map.center).to.be.deep.equals(value);

                state.Map.center = [0, 0];
                key = "center";
                await setValueToState(state, key, valueAsString);
                expect(state.Map.center).to.be.deep.equals(value);

                state.Map.center = [0, 0];
                key = "Map/center";
                valueAsString = "553925,5931898";
                await setValueToState(state, key, valueAsString);
                expect(state.Map.center).to.be.deep.equals(value);

                state.Map.center = [0, 0];
                key = "center";
                valueAsString = "553925,5931898";
                await setValueToState(state, key, valueAsString);
                expect(state.Map.center).to.be.deep.equals(value);
            });
        });
        describe("UrlParam marker", () => {
            it("test param marker and MapMarker, coordinates as array or comma separated", async () => {
                let key = "marker",
                    valueAsString = "[553925,5931898]";
                const state = {
                        urlParams: {},
                        MapMarker: {
                            coordinates: [0, 0]
                        }
                    },
                    value = [553925, 5931898];

                await setValueToState(state, key, valueAsString);
                expect(state.MapMarker.coordinates).to.be.deep.equals(value);

                state.MapMarker.coordinates = [0, 0];
                key = "MapMarker";
                await setValueToState(state, key, valueAsString);
                expect(state.MapMarker.coordinates).to.be.deep.equals(value);

                state.MapMarker.coordinates = [0, 0];
                key = "mapmarker";
                await setValueToState(state, key, valueAsString);
                expect(state.MapMarker.coordinates).to.be.deep.equals(value);

                state.MapMarker.coordinates = [0, 0];
                key = "mapmarker";
                valueAsString = "553925,5931898";
                await setValueToState(state, key, valueAsString);
                expect(state.MapMarker.coordinates).to.be.deep.equals(value);
            });
            it("test param marker with projection", async () => {
                crs.registerProjections(namedProjections);

                // ?Map/projection=EPSG:8395&marker=[3565836,5945355]
                const key = "marker",
                    valueAsString = "[3565836,5945355]",
                    state = {
                        urlParams: {},
                        MapMarker: {
                            coordinates: [0, 0]
                        }
                    },
                    value = [3565836, 5945355];

                await setValueToState(state, key, valueAsString);
                await setValueToState(state, "Map/projection", "EPSG:8395");
                expect(state.MapMarker.coordinates).to.be.deep.equals(value);
                expect(state.urlParams.projection.name).to.be.deep.equals("EPSG:8395");
            });
        });
    });
});
