define(function (require) {

    var Backbone = require("backbone"),
        Radio = require("backbone.radio"),
        ItemTemplate = require("text!modules/menu/desktop/tool/template.html"),
        ItemView;

    ItemView = Backbone.View.extend({
        tagName: "li",
        className: "dropdown dropdown-tools",
        template: _.template(ItemTemplate),
        events: {
            "click": "checkItem"
        },
        initialize: function () {
            this.listenTo(this.model, {
                "change:isActive": this.toggleIsActiveClass
            });

            this.listenTo(Radio.channel("Map"), {
                "change": function (mode) {
                    this.toggleSupportedVisibility(mode);
                }
            });

            this.render();
            this.toggleSupportedVisibility(Radio.request("Map", "getMapMode"));
            this.setCssClass();
            this.toggleIsActiveClass();
        },
        render: function () {
            var attr = this.model.toJSON();

            $("#" + this.model.getParentId()).append(this.$el.html(this.template(attr)));
        },

        toggleSupportedVisibility: function(mode) {
            if(mode === '2D'){
                this.$el.show();
            } else if(this.model.get("supportedIn3d").indexOf(this.model.getId()) >= 0){
                this.$el.show();
            } else {
                this.$el.hide();
            }
        },

        /**
         * Abhängig davon ob ein Tool in die Menüleiste oder unter dem Punkt Werkzeuge gezeichnet wird,
         * bekommt die View eine andere CSS-Klasse zugeordent
         */
        setCssClass: function () {
            if (this.model.getParentId() === "root") {
                this.$el.addClass("menu-style");
                this.$el.find("span").addClass("hidden-sm");
            }
            else {
                this.$el.addClass("tool-style");
            }
        },

        toggleIsActiveClass: function () {
            if (this.model.getIsActive() === true && this.model.getParentId() === "Werkzeuge") {
                this.$el.addClass("active");
            }
            else {
                this.$el.removeClass("active");
            }
        },

        checkItem: function () {
            if (this.model.getName() === "legend") {
                Radio.trigger("Legend", "toggleLegendWin");
            }
            else {
                this.model.setIsActive(true);
            }
            // Navigation wird geschlossen
            $("div.collapse.navbar-collapse").removeClass("in");
        }
    });

    return ItemView;
});
