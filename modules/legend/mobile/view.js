import LegendTemplate from "text-loader!./template.html";
import ContentTemplate from "text-loader!../content.html";

const MobileLegendView = Backbone.View.extend({
    events: {
        "click .glyphicon-remove": "toggle"
    },
    initialize: function (Model) {
        this.model = Model;

        this.listenTo(this.model, {
            "change:legendParams": this.paramsChanged
        });

        this.listenTo(Radio.channel("Legend"), {
            "toggleLegendWin": this.toggle
        });

        this.model.setLayerList();

        if (this.model.get("visible")) {
            this.toggle();
        }
    },
    id: "base-modal-legend",
    className: "modal bs-example-modal-sm legend fade in",
    template: _.template(LegendTemplate),
    contentTemplate: _.template(ContentTemplate),
    render: function () {
        var attr = this.model.toJSON();

        this.$el.html(this.template(attr));
        return this;
    },

    /**
     * Steuert Maßnahmen zur Aufbereitung der Legende.
     * @listens this.model~change:legendParams
     * @returns {void}
     */
    paramsChanged: function () {
        var legendParams = this.model.get("legendParams");

        // Filtern von this.unset("legendParams")
        if (!_.isUndefined(legendParams) && legendParams.length > 0) {
            this.addContentHTML(legendParams);
            this.render();
        }
    },

    /**
     * Fügt den Legendendefinitionen das gerenderte HTML hinzu.
     * Dieses wird im template benötigt.
     * @param {object[]} legendParams Legendenobjekte by reference
     * @returns {void}
     */
    addContentHTML: function (legendParams) {
        _.each(legendParams, function (legendDefinition) {
            _.each(legendDefinition.legend, function (legend) {
                legend.html = this.contentTemplate(legend);
            }, this);
        }, this);
    },

    toggle: function () {
        var visible = !this.$el.is(":visible");

        this.model.setVisible(visible); // speichere neuen Status
        this.$el.modal({
            backdrop: true,
            show: true
        });
    },
    /**
     * Entfernt diese view
     * @returns {void}
     */
    removeView: function () {
        this.$el.hide();

        this.remove();
    }
});

export default MobileLegendView;
