define(function (require) {

    var Layer = require("modules/core/modelList/layer/model"),
        ol = require("openlayers"),
        GeoJSONLayer;

    GeoJSONLayer = Layer.extend({
        initialize: function () {
            this.superInitialize();
        },

        /**
         * [createLayerSource description]
         * @return {[type]} [description]
         */
        createLayerSource: function () {
            this.setLayerSource(new ol.source.Vector());
        },

        /**
         * [createLayer description]
         * @return {[type]} [description]
         */
        createLayer: function () {
            this.setLayer(new ol.layer.Vector({
                source: this.getLayerSource(),
                name: this.get("name"),
                typ: this.get("typ"),
                gfiAttributes: this.get("gfiAttributes"),
                routable: this.get("routable"),
                gfiTheme: this.get("gfiTheme"),
                id: this.getId()
            }));

            this.updateData();
        },

        updateData: function () {
            Radio.trigger("Util", "showLoader");

            $.ajax({
                url: Radio.request("Util", "getProxyURL", this.get("url")),
                async: false,
                type: "GET",
                context: this,
                success: function (data) {
                    Radio.trigger("Util", "hideLoader");
                    var crs = (_.has(data, "crs") && data.crs.properties.name) ? data.crs.properties.name : "EPSG:25832",
                        geojsonReader = new ol.format.GeoJSON(),
                        features = geojsonReader.readFeatures(data);
                        console.log(crs);
                    _.each(features, function (feature) {
                        var geometry = feature.getGeometry();

                        geometry.transform("EPSG:4326", "EPSG:25832");
                        console.log(geometry);
                        // _.each(coords, function (coord) {

                        //         console.log(coord);
                        //     if (_.isArray(coord)) {
                        //         var transformObject = {
                        //                 fromCRS: crs,
                        //                 toCRS: "EPSG:25832",
                        //                 point: coord
                        //             },
                        //             newCoord = Radio.request("CRS", "transform", transformObject);
                        //         console.log(newCoord);
                        //         newCoords.push(newCoord);
                        //     }
                        //     else {
                        //     }
                        // });
                        // geometry.setCoordinates(newCoords);


                    });


                    this.getLayerSource().addFeatures(features);
                    this.set("loadend", "ready");
                    this.getLayer().setStyle(this.get("style"));

                },
                error: function (jqXHR, errorText, error) {
                    Radio.trigger("Util", "hideLoader");
                }
            });
        },
        /**
         * Zeigt alle Features mit dem Default-Style an
         */
        showAllFeatures: function () {
            var collection = this.getLayerSource().getFeatures();

            collection.forEach(function (feature) {
                feature.setStyle(this.getDefaultStyle());
            }, this);
        },

        /**
         * Versteckt alle Features mit dem Hidden-Style
         */
        hideAllFeatures: function () {
            var collection = this.getLayerSource().getFeatures();

            collection.forEach(function (feature) {
                feature.setStyle(this.getHiddenStyle());
            }, this);
        },

        /**
         * Zeigt nur die Features an, deren Id übergeben wird
         * @param  {string[]} featureIdList
         */
        showFeaturesByIds: function (featureIdList) {
            this.hideAllFeatures();
            _.each(featureIdList, function (id) {
                var feature = this.getLayerSource().getFeatureById(id);

                feature.setStyle(this.getDefaultStyle());
            }, this);
        },

        // Getter
        getFeatures: function () {
            return this.get("features");
        },

        getDefaultStyle: function () {
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(49, 159, 211, 0.8)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgba(50, 50, 50, 1)",
                    width: 1
                })
            });
        },

        getHiddenStyle: function () {
            return new ol.style.Style({
                fill: new ol.style.Fill({
                    color: "rgba(255, 255, 255, 0)"
                }),
                stroke: new ol.style.Stroke({
                    color: "rgba(49, 159, 211, 0)"
                })
            });
        }
    });

    return GeoJSONLayer;
});
