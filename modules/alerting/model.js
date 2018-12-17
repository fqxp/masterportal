/**
 * @module Alerting
 * @classDesc AlertingModelBLABLABLA
 * @extends Backbone.Model
 */
const AlertingModel = Backbone.Model.extend({
    defaults: {
        // http://getbootstrap.com/components/#alerts-examples
        category: "alert-info",
        // true wenn Close Button dargestellt werden soll
        isDismissable: true,
        // true wenn OK Button dargestellt werden soll
        isConfirmable: false,
        // Position der Messages [top-center | center-center]
        position: "top-center",
        // letzte/aktuelle Alert Message
        message: "",
        animation: false
    },
    initialize: function () {
        var channel = Radio.channel("Alert");

        this.listenTo(channel, {
            "alert": this.setParams,
            "alert:remove": function () {
                this.trigger("removeAll");
            }
        }, this);
    },

    /**
     * Wird ein String übergeben, handelt es sich dabei um die Alert Message
     * Ist es ein Objekt, werden die entsprechenden Attribute gesetzt
     * @param {String|Object} val -
     * @returns {void}
     */
    setParams: function (val) {
        if (_.isString(val)) {
            this.setId(_.uniqueId());
            this.setMessage(val);
        }
        else if (_.isObject(val)) {
            this.setMessage(val.text);
            if (_.has(val, "id") === true) {
                this.setId(val.id);
            }
            else {
                this.setId(_.uniqueId());
            }
            if (_.has(val, "kategorie") === true) {
                this.setCategory(val.kategorie);
            }
            if (_.has(val, "dismissable") === true) {
                this.setIsDismissable(val.dismissable);
            }
            if (_.has(val, "confirmable") === true) {
                this.setIsConfirmable(val.confirmable);
            }
            if (_.has(val, "position") === true) {
                this.setPosition(val.position);
            }
            if (_.has(val, "animation")) {
                this.setAnimation(val.animation);
            }
            if (!_.has(val, "animation")) {
                this.setAnimation(false);
            }
        }
        this.trigger("render");
    },

    setId: function (value) {
        this.set("id", value.toString());
    },

    setCategory: function (value) {
        this.set("category", value);
    },

    setIsDismissable: function (value) {
        this.set("isDismissable", value);
    },

    setIsConfirmable: function (value) {
        this.set("isConfirmable", value);
    },

    setMessage: function (value) {
        this.set("message", value);
    },

    setPosition: function (value) {
        this.set("position", value);
    },
    setAnimation: function (value) {
        this.set("animation", value);
    }
});

export default AlertingModel;
