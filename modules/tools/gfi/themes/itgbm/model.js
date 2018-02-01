define(function (require) {

    var Theme = require("modules/tools/gfi/themes/model"),
        Config = require("config"),
        ItGbmTheme;

    ItGbmTheme = Theme.extend({
        defaults: _.extend({}, Theme.prototype.defaults,
            {postMessageUrl: "http://localhost:8080"}
        ),
        initialize: function () {
            this.listenTo(this, {
                "change:isReady": this.parseGfiContent
            });
            this.setParams(Config);
        },
        setParams: function (config) {
            if (_.has(config, "postMessageUrl") && config.postMessageUrl.length > 0) {
                this.setPostMessageUrl(config.postMessageUrl);
            }
        },
        /**
         * sets title and gfiContent attributes
         */
        parseGfiContent: function () {
            this.set("title", this.get("gfiContent")[0].Name);
            this.set("gfiContent", _.omit(this.get("gfiContent")[0], "Name"));
        },

        /**
         * triggers feature properties via postMessage
         */
        postMessageToItGbm: function () {
            var featureProperties = _.omit(this.get("feature").getProperties(), ["geometry", "geometry_EPSG_25832", "geometry_EPSG_4326"]);

            featureProperties.extent = this.get("feature").getGeometry().getExtent();
            parent.postMessage({"featureToDetail": JSON.stringify(featureProperties), "layerId": this.get("id")}, this.get("postMessageUrl"));
        },
        setPostMessageUrl: function (value) {
            this.set("postMessageUrl", value);
        }
    });

    return ItGbmTheme;
});
