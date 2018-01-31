define(function (require) {

    var Theme = require("modules/tools/gfi/themes/model"),
        Radio = require("backbone.radio"),
        d3 = require("d3"),
        VerkehrsStaerkenRadTheme;

    VerkehrsStaerkenRadTheme = Theme.extend({
        defaults: {
            name: "",
            tageslinieDataset: [],
            wochenlinieDataset: [],
            jahreslinieDataset: []
        },
        initialize: function () {
            this.listenTo(this, {
                "change:isReady": this.parseGfiContent
            });
        },
        /**
         * Ermittelt alle Namen(=Zeilennamen) der Eigenschaften der Objekte
         */
        parseGfiContent: function () {
            if (_.isUndefined(this.get("gfiContent")) === false) {
                var gfiContent = this.getGfiContent()[0],
                    name = _.has(gfiContent, "Name") ? gfiContent.Name : "unbekannt",
                    tageslinie = _.has(gfiContent, "Tageslinie") ? gfiContent.Tageslinie : null,
                    wochenlinie = _.has(gfiContent, "Wochenlinie") ? gfiContent.Wochenlinie : null,
                    jahrgangslinie = _.has(gfiContent, "Jahrgangslinie") ? gfiContent.Jahrgangslinie : null;

                this.setName(name);

                if (tageslinie) {
                    var obj = this.splitData(tageslinie);

                    this.setTageslinieDataset(obj);
                }

                if (wochenlinie) {
                    var obj = this.splitData(wochenlinie);

                    this.setWochenlinieDataset(obj);
                }

                if (jahrgangslinie) {
                    var obj = this.splitData(jahrgangslinie);

                    this.setJahreslinieDataset(obj);
                }
            }
        },

        /**
         * Nimmt den gfiContent, parst den Inhalt und gibt ihn als stukturtiertes JSON zurück
         * @param  {string} featureData gfiContent
         * @return {Object} Object mit timeDate-Object und Value
         */
        splitData: function (featureData) {
            var dataSplit = featureData.split("|"),
                tempArr = [];

            _.each(dataSplit, function (data) {
                var splitted = data.split(","),
                    day = splitted[0].split(".")[0],
                    month = splitted[0].split(".")[1],
                    year = splitted[0].split(".")[2],
                    hours = splitted[1].split(":")[0],
                    minutes = splitted[1].split(":")[1],
                    seconds = splitted[1].split(":")[2],
                    total = parseFloat(splitted[2]),
                    r_in = splitted[3] ? parseFloat(splitted[3]) : null,
                    r_out = splitted[4] ? parseFloat(splitted[4]) : null;

                tempArr.push({
                    timestamp: new Date (year, month, day, hours, minutes, seconds, 0),
                    total: total,
                    r_in: r_in,
                    r_out: r_out
                });
            });

            return tempArr;
        },

        // getter for tageslinieDataset
        getTageslinieDataset: function () {
            return this.get("tageslinieDataset");
        },
        // setter for tageslinieDataset
        setTageslinieDataset: function (value) {
            this.set("tageslinieDataset", value);
        },

        // getter for wochenlinieDataset
        getWochenlinieDataset: function () {
            return this.get("wochenlinieDataset");
        },
        // setter for WochenlinieDataset
        setWochenlinieDataset: function (value) {
            this.set("wochenlinieDataset", value);
        },

        // getter for jahreslinieDataset
        getJahreslinieDataset: function () {
            return this.get("jahreslinieDataset");
        },
        // setter for JahrgangslinieDataset
        setJahreslinieDataset: function (value) {
            this.set("jahreslinieDataset", value);
        },

        combineYearsData: function (dataPerYear, years) {
            var dataset = [];

            _.each(years, function (year) {
                var attrDataArray = _.where(dataPerYear, {year: year}),
                    yearObject = {year: year};

                _.each(attrDataArray, function (attrData) {
                    yearObject[attrData.attrName] = attrData.value;
                }, this);
                dataset.push(yearObject);
            }, this);
            dataset = this.parseData(dataset);
            this.setDataset(dataset);
        },
        // setter for rowNames
        setRowNames: function (value) {
            this.set("rowNames", value);
        },
        // setter for years
        setYears: function (value) {
            this.set("years", value);
        },
        // setter for art
        setArt: function (value) {
            this.set("art", value);
        },
        // setter for bezeichnung
        setBezeichnung: function (value) {
            this.set("bezeichnung", value);
        },
        // setter for name
        setName: function (value) {
            this.set("name", value);
        },
        setDataset: function (value) {
            this.set("dataset", value);
        },
        getDataset: function () {
            return this.get("dataset");
        },
        // getter for attrToShow
        getAttrToShow: function () {
            return this.get("attrToShow");
        },
        // setter for attrToShow
        setAttrToShow: function (value) {
            this.set("attrToShow", value);
        },
        /**
         * Alle children und Routable-Button (alles Module) im gfiContent müssen hier removed werden.
         */
        destroy: function () {
            _.each(this.get("gfiContent"), function (element) {
                if (_.has(element, "children")) {
                    var children = _.values(_.pick(element, "children"))[0];

                    _.each(children, function (child) {
                        child.val.remove();
                    }, this);
                }
            }, this);
            _.each(this.get("gfiRoutables"), function (element) {
                if (_.isObject(element) === true) {
                    element.remove();
                }
            }, this);
        },
         /*
        * noData comes as "-" from WMS. turn noData into ""
        * try to parse data to float
        */
        parseData: function (dataArray) {
            var parsedDataArray = [];

            _.each(dataArray, function (dataObj) {
                var parsedDataObj = {};

                _.each(dataObj, function (dataVal, dataAttr) {
                    var dataVal = this.parseDataValue(dataVal),
                        parseFloatVal = parseFloat(dataVal);

                    if (isNaN(parseFloatVal)) {
                        parsedDataObj[dataAttr] = dataVal;
                    }
                    else {
                        parsedDataObj[dataAttr] = parseFloatVal;
                    }
                }, this);
                parsedDataArray.push(parsedDataObj);
            }, this);

            return parsedDataArray;
        },
        parseDataValue: function (value) {
            if (value === "*") {
                value = "Ja";
            }
            return value;
        },
        createD3Document: function () {
            var heightGfiContent = $(".gfi-content").css("height").slice(0, -2),
                heightPegelHeader = $(".pegelHeader").css("height").slice(0, -2),
                heightNavbar = $(".verkehrsstaerken .nav").css("height").slice(0, -2),
                heightBtnGroup = $(".verkehrsstaerken #diagramm .btn-group").css("height").slice(0, -2),
                height = heightGfiContent - heightPegelHeader - heightNavbar - heightBtnGroup,
                width = $(".gfi-content").css("width").slice(0, -2),
                graphConfig = {
                graphType: "Linegraph",
                selector: ".graph",
                width: width,
                height: height,
                selectorTooltip: ".graph-tooltip-div",
                scaleTypeX: "ordinal",
                scaleTypeY: "linear",
                data: this.getDataset(),
                xAttr: "year",
                xAxisLabel: "Jahr",
                attrToShowArray: this.getAttrToShow()
            };

            Radio.trigger("Graph", "createGraph", graphConfig);
            this.manipulateSVG();
        },
        manipulateSVG: function () {
            var graphParams = Radio.request ("Graph", "getGraphParams"),
                data = this.getDataset(),
                svg = d3.select(".graph-svg"),
                scaleX = graphParams.scaleX,
                scaleY = graphParams.scaleY,
                tooltipDiv = graphParams.tooltipDiv,
                margin = graphParams.margin,
                offset = graphParams.offset,
                size = 10,
                attrToShowArray = this.getAttrToShow();

            data = _.filter(data, function (obj) {
                return obj[attrToShowArray[0]] !== "-";
            });
            svg.selectAll("dot")
                .data(data)
                .enter().append("g")
                .append("rect")
                .attr("x", function (d) {
                    return scaleX(d.year) + margin.left - (size / 2) + (offset + scaleX.bandwidth() / 2);
                })
                .attr("y", function (d) {
                    return scaleY(d[attrToShowArray[0]]) + (size / 2) + offset + margin.top;
                })
                .attr("width", size)
                .attr("height", size)
                .attr("class", function (d) {
                    var returnVal = "";

                    if (_.has(d, "Baustelleneinfluss") && d[attrToShowArray] !== "-") {
                        returnVal = "dot_visible";
                    }
                    else {
                        returnVal = "dot_invisible";
                    }
                    return returnVal;
                })
                .on("mouseover", function (d) {
                    tooltipDiv.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    tooltipDiv.html(d[attrToShowArray[0]])
                        .attr("style", "background: gray")
                        .style("left", (d3.event.offsetX + 5) + "px")
                        .style("top", (d3.event.offsetY - 5) + "px");

                    })
                .on("mouseout", function () {
                    tooltipDiv.transition()
                        .duration(500)
                        .style("opacity", 0);
                })
                .on("click", function (d) {
                    tooltipDiv.transition()
                        .duration(200)
                        .style("opacity", 0.9);
                    tooltipDiv.html(d[attrToShowArray[0]])
                        .attr("style", "background: gray")
                        .style("left", (d3.event.offsetX + 5) + "px")
                        .style("top", (d3.event.offsetY - 5) + "px");
                    });
            var legendBBox = svg.selectAll(".graph-legend").node().getBBox(),
                width = legendBBox.width,
                height = legendBBox.height,
                x = legendBBox.x,
                y = legendBBox.y;

            svg.selectAll(".graph-legend").append("g")
                .append("rect")
                .attr("width", 10)
                .attr("height", 10)
                .attr("class", "dot_visible")
                .attr("transform", "translate(" + (x + width + 10) + "," + (y + 2.5) + ")");

            legendBBox = svg.selectAll(".graph-legend").node().getBBox();
                width = legendBBox.width;
                height = legendBBox.height;
                x = legendBBox.x;
                y = legendBBox.y;

            svg.selectAll(".graph-legend").append("g")
                .append("text")
                .attr("x", 10)
                .attr("y", 10)
                .attr("transform", "translate(" + (x + width) + "," + (y + 2.5) + ")")
                .text(this.createAndGetLegendText(attrToShowArray[0]));
        },

        createAndGetLegendText: function (value) {
            if (value === "DTV") {
                return "DTV (Kfz/24h) mit Baustelleneinfluss";
            }
            else if (value === "DTVw") {
                return "DTVw (Kfz/24h) mit Baustelleneinfluss";
            }
            else {
                return "SV-Anteil am DTVw (%) mit Baustelleneinfluss";
            }
        }
    });

    return VerkehrsStaerkenRadTheme;
});
