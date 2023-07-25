import {expect} from "chai";
import crs from "@masterportal/masterportalapi/src/crs";
import mutations from "../../../store/mutationsModeler3D";

const {setProjections} = mutations,
    namedProjections = [
        ["EPSG:31467", "+title=Bessel/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=bessel +datum=potsdam +units=m +no_defs"],
        ["EPSG:25832", "+title=ETRS89/UTM 32N +proj=utm +zone=32 +ellps=GRS80 +towgs84=0,0,0,0,0,0,0 +units=m +no_defs"],
        ["EPSG:8395", "+title=ETRS89/Gauß-Krüger 3 +proj=tmerc +lat_0=0 +lon_0=9 +k=1 +x_0=3500000 +y_0=0 +ellps=GRS80 +datum=GRS80 +units=m +no_defs"],
        ["EPSG:4326", "+title=WGS 84 (long/lat) +proj=longlat +ellps=WGS84 +datum=WGS84 +no_defs"]
    ];

describe("src/modules/tools/modeler3D/store/mutationsModeler3D.js", () => {

    before(() => {
        crs.registerProjections(namedProjections);
    });

    describe("setProjections", () => {
        it("initially sets the currentSelection to \"EPSG:25832\"", () => {
            const state = {
                    projections: [],
                    currentProjection: {id: "http://www.opengis.net/gml/srs/epsg.xml#25832", name: "EPSG:25832", projName: "utm"}
                },
                pr = crs.getProjections();

            pr.forEach(proj => {
                proj.id = proj.name;
            });

            setProjections(state, pr);

            expect(state.projections.length).to.equals(namedProjections.length);
            expect(state.currentProjection.id).to.equals("http://www.opengis.net/gml/srs/epsg.xml#25832");
        });
        it("initially sets the currentSelection to the first one, if no  \"EPSG:25832\" available", () => {
            const state = {
                    projections: [],
                    currentProjection: {id: "http://www.opengis.net/gml/srs/epsg.xml#25832", name: "EPSG:25832", projName: "utm"}
                },
                projections = crs.getProjections().filter(proj => proj.name !== "http://www.opengis.net/gml/srs/epsg.xml#25832");

            projections.forEach(proj => {
                proj.id = proj.name;
            });

            setProjections(state, projections);

            expect(state.projections.length).to.equals(namedProjections.length - 1);
            expect(state.currentProjection.id).to.equals(projections[0].id);
        });
        it("initially set empty projections", () => {
            const state = {
                projections: [],
                currentProjection: {id: "http://www.opengis.net/gml/srs/epsg.xml#25832", name: "EPSG:25832", projName: "utm"}
            };

            setProjections(state, []);

            expect(state.projections.length).to.equals(0);
            expect(state.currentProjection).to.be.undefined;
        });
        it("initially projections are undefined", () => {
            const state = {
                projections: [],
                currentProjection: {id: "http://www.opengis.net/gml/srs/epsg.xml#25832", name: "EPSG:25832", projName: "utm"}
            };

            setProjections(state, undefined);

            expect(state.projections.length).to.equals(0);
            expect(state.currentProjection).to.be.undefined;
        });
    });
});
