define([
    "backbone",
    "config",
    "eventbus",
    "modules/tree/catalogLayer/nodeChild",
    "modules/tree/catalogLayer/viewNodeChild",
    "modules/tree/catalogLayer/viewNodeLayer"
], function (Backbone, Config, EventBus, NodeChild, NodeChildView, NodeLayerView) {

    var TreeNode = Backbone.Model.extend({

        // Layer die direkt unterhalb der Node liegen, werden in die Variable "nodeLayer" geschrieben und
        // alle Layer die zu einer Child-Node unterhalb dieser Node gehören, in die Variable "nodeChildLayer".
        defaults: {
            isExpanded: false,
            isStyled: false,
            nodeLayer: [],
            nodeChildLayer: []
        },

        initialize: function () {
            this.listenToOnce(this, {
                "change:layerList": this.setChildren,
                "change:children": this.setSortedLayerList,
                "change:sortedLayerList": this.setNestedViews
            });

            this.listenToOnce(EventBus, {
                "layerlist:sendLayerListForNode": this.setLayerList
            });

            EventBus.trigger("layerlist:getLayerListForNode", this.get("name"));
        },

        // Alle Layer bzw. Layer-Models die zu dieser Node gehören
        setLayerList: function (layerList) {
            this.set("layerList", layerList);
        },

        /**
         * Alle Layer aus der "layerList" werden in die richtige Reihenfolge gebracht und in das Attribut "children" geschrieben.
         */
        setChildren: function () {
            if (Config.tree.type === "custom") {
                this.setNodeLayerForCustomTree();
                this.setNodeChildLayerForCustomTree();
                this.set("children", _.union(this.get("nodeLayer"), this.get("nodeChildLayer")));
            }
            else {
                this.setChildrenForTree();
                this.set("children", _.union(_.sortBy(this.get("nodeLayer"), "name").reverse(), _.sortBy(this.get("nodeChildLayer"), "name").reverse()));
            }
        },

        /**
         * Alle Layer die ohne Unterordner konfiguriert sind, werden nach ihrer MetaID gruppiert.
         * Dabei handelt es sich nicht immer zwingend um einen "NodeLayer".
         * Gibt es pro MetaID einen Layer, wird er zum Attribut "nodeLayer" hinzugefügt.
         * Gibt es pro MetaID mehrere Layer, werden die Layer zum Attribut "nodeChildLayer" hinzugefügt.
         */
        setNodeLayerForCustomTree: function () {
            var nodeLayerList,
                countByNode,
                layerListByNode;

                // Alle Layer die nicht zu einem Unterordner gehören
                nodeLayerList = _.filter(this.get("layerList"), function (layer) {
                    return layer.attributes.subfolder === undefined;
                });

                // Gruppiert die Layer nach der jeweiligen Node
                countByNode = _.countBy(_.pluck(nodeLayerList, "attributes"), "node");
                // Iteriert über die gruppierten Layer
                _.each(countByNode, function (value, key) {
                    if (key !== "undefined") {
                        // Alle Layer der Gruppe (sprich gleiche Node)
                        layerListByNode = _.filter(nodeLayerList, function (layer) {
                            return layer.attributes.node === key;
                        }).reverse();
                        _.each(layerListByNode, function (layer) {
                            this.push("nodeLayer", {type: "nodeLayer", name: layer.get("name"), layer: layer});
                        }, this);
                    }
                }, this);

                //********************************************** --> nur vorübergehend fürs Olympia-Portal...hoffentlich
                // Alle Layer die keine MetaID und keinen Subfolder haben
                nodeLayerList = _.filter(this.get("layerList"), function (layer) {
                    return layer.attributes.metaID === undefined && layer.attributes.subfolder === undefined;
                });
                _.each(nodeLayerList, function (layer) {
                    this.push("nodeLayer", {type: "nodeLayer", name: layer.get("name"), layer: layer});
                }, this);
                //**********************************************
        },

        /**
         * Alle Layer die mit Unterordner konfiguriert sind, werden nach diesem gruppiert.
         * Die Layer werden dem Attribut "nodeChildLayer" hinzugefügt.
         */
        setNodeChildLayerForCustomTree: function () {
            var nodeChildLayerList,
                countByFolder,
                layerListByFolder;

                // Alle Layer die zu einem Unterordner gehören
                nodeChildLayerList = _.filter(this.get("layerList"), function (layer) {
                    return layer.attributes.subfolder !== undefined;
                });
                // Gruppiert die Layer nach deren Unterordnern
                 countByFolder = _.countBy(_.pluck(nodeChildLayerList, "attributes").reverse(), "subfolder");

                 // Iteriert über die gruppierten Layer
                _.each(countByFolder, function (value, key) {
                    // Alle Layer der Gruppe (sprich gleiche Unterordner)
                    layerListByFolder = _.filter(this.get("layerList"), function (layer) {
                        return layer.attributes.subfolder === key;
                    }).reverse();
                    // Layer zum Attribut "nodeChildLayer" hinzugefügt
                    this.push("nodeChildLayer", {type: "nodeChild", name: layerListByFolder[0].get("subfolder"), children: layerListByFolder});
                }, this);
        },

        /**
         * Alle Layer werden nach ihrer MetaID gruppiert.
         * Gibt es pro MetaID einen Layer, wird er zum Attribut "nodeLayer" hinzugefügt.
         * Gibt es pro MetaID mehrere Layer, werden die Layer zum Attribut "nodeChildLayer" hinzugefügt.
         */
        setChildrenForTree: function () {
            var countByMetaID,
                layerListByID;

            // Gruppiert die Layer nach deren MetaID
            countByMetaID = _.countBy(_.pluck(this.get("layerList"), "attributes"), "metaID");

            // Iteriert über die Metadaten-ID's
            _.each(countByMetaID, function (value, key) {
                // Alle Layer der Gruppe (sprich gleiche MetaID)
                layerListByID = _.filter(this.get("layerList"), function (layer) {
                    return layer.attributes.metaID === key;
                });

                // Absteigende alphabetische Sortierung der Layer --> Das ABSTEIGENDE ist für das rendern erforderlich
                layerListByID = _.sortBy(layerListByID, function (layer) {
                    return layer.get("name");
                }).reverse();
                // Gibt es mehrere Layer in der Gruppe werden sie in einem Unterordner (Metadaten-Name) zusammengefasst
                if (layerListByID.length > 1) {
                    // Layer zum Attribut "nodeChildLayer" hinzugefügt
                    this.push("nodeChildLayer", {type: "nodeChild", name: layerListByID[0].get("metaName"), children: layerListByID});
                }
                else {
                    // Layer zum Attribut "nodeLayer" hinzugefügt
                    this.push("nodeLayer", {type: "nodeLayer", name: layerListByID[0].get("metaName"), layer: layerListByID[0]});
                }
            }, this);
        },

        /**
         * Alle Layer-Models aus "children" werden in das Attribut "sortedLayerList" geschrieben.
         * "sortedLayerList" wird für die Map.js gebraucht. Der unterste Layer im Layerbaum wird als erster in der Map.js der Karte hinzugefügt.
         * So wird sichergestellt das die Reihenfolge der Layer im Layerbaum und der Layer auf der Karte dieselbe ist.
         */
        setSortedLayerList: function () {
            // Zwischenspeicher für die Layer (Models)
            var sortedLayerList = [];
            // Iteriert über "children"
            _.each(this.get("children"), function (child) {
                if (child.type === "nodeLayer") {
                    sortedLayerList.push(child.layer);
                }
                else if (child.type === "nodeChild") {
                    // Iteriert über die Children der Node
                    _.each(child.children, function (nodeChildren) {
                        sortedLayerList.push(nodeChildren);
                    });
                }
            });
            this.set("sortedLayerList", sortedLayerList);
        },

        /**
         * "sortedLayerList" wird aktualisiert. Die Layer-Models werden in die gleiche Reihenfolge gebracht wie die Views im Layerbaum.
         */
        updateSortedLayerList: function () {
            var sortedLayerList = [];

            _.each(this.get("childViews"), function (childView) {
                if (childView.model.get("type") === "nodeLayer") {
                    sortedLayerList.push(childView.model);
                }
                else if (childView.model.get("type") === "nodeChild") {
                    _.each(childView.model.get("childViews"), function (nodeChildView) {
                        sortedLayerList.push(nodeChildView.model);
                    });
                }
            });
            this.set("sortedLayerList", sortedLayerList);
        },

        /**
         * Erzeugt aus "children" pro Eintrag eine Model/View Komponente und schreibt diese gesammelt in das Attribut "childViews".
         */
        setNestedViews: function () {
            // Zwischenspeicher für die Views
            var nestedViews = [],
                nodeLayerView,
                nodeChildView;

            // Iteriert über "children"
            _.each(this.get("children"), function (child) {
                if (child.type === "nodeLayer") {
                    // nodeLayerView
                    child.layer.set("type", "nodeLayer");
                    nodeLayerView = new NodeLayerView({model: child.layer});
                    nestedViews.push(nodeLayerView);
                }
                else if (child.type === "nodeChild") {
                    // nodeChildView
                    nodeChildView = new NodeChildView({model: new NodeChild(child)});
                    nestedViews.push(nodeChildView);
            }
                }, this);
            this.set("childViews", nestedViews);
        },
        toggleExpand: function () {
            if (this.get("isExpanded") === true) {
                this.set("isExpanded", false);
            }
            else {
                this.set("isExpanded", true);
            }
        },

        moveUpInList: function () {
            this.updateSortedLayerList();
            this.collection.moveNodeUp(this);
        },

        moveDownInList: function () {
            this.updateSortedLayerList();
            this.collection.moveNodeDown(this);
        },

        /**
         * Hilfsmethode um ein Attribut vom Typ Array zu setzen.
         * {String} attribute - Das Attribut das gesetzt werden soll
         * {whatever} value - Der Wert des Attributs
         */
        push: function (attribute, value) {
            var clonedAttribute = _.clone(this.get(attribute));

            clonedAttribute.push(value);
            this.set(attribute, clonedAttribute);
        }
    });

    return TreeNode;
});
