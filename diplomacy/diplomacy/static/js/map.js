powers = {
  "russia": {
    "territory": ["lvn", "stp", "mos", "sev", "war", "ukr"],
  },
  "germany": {
    "territory": ["ruh", "kie", "ber", "mun", "pru", "sil"],
  },
  "austria": {
    "territory": ["boh", "gal", "vie", "bud", "tri", "tyr"],
  },
  "england": {
    "territory": ["lon", "wal", "edi", "yor", "cly", "lvp"],
  },
  "france": {
    "territory": ["pic", "par", "bre", "gas", "mar", "bur"],
  },
  "italy": {
    "territory": ["pie", "ven", "tus", "apu", "nap", "rom"],
  },
  "turkey": {
    "territory": ["arm", "ank", "con", "smy", "syr"],
  },
}

provinceData = {}


function build_map() {
  var request = new XMLHttpRequest();
  request.open("GET", "/static/svg/map.svg", false);
  request.send(null);

  // read relevant XML data first, won't work after the svg node is included in the DOM tree
  var provinceDataNode = request.responseXML.getElementsByTagName("jdipNS:PROVINCE_DATA")[0];
  for (var i = 0; i < provinceDataNode.children.length; ++i) {
    var province = provinceDataNode.children[i];
    var name = province.getAttribute("name");
    provinceData[name] = {}
    var supplyCenter = province.getElementsByTagName("jdipNS:SUPPLY_CENTER");
    if (supplyCenter.length != 0) {
      provinceData[name].supply_center = {x: supplyCenter[0].getAttribute("x"),
                                          y: supplyCenter[0].getAttribute("y")};
    }
  }

  var svg = request.responseXML.getElementsByTagName("svg")[0];
  svg.id = "map";

  var content = $('#content');
  content.append(svg);

  svg = $("#map");
  var width = svg.width()
  svg.width("1500");
  svg.height(svg.height() * svg.width() / width);

  var s = Snap('#map');

  s.select("#MouseLayer").attr("pointer-events", "none");
  s.select("#FullLabelLayer").attr("pointer-events", "none");
  s.select("#BriefLabelLayer").attr("pointer-events", "none");

  var supplyCenterLayer = s.select("#SupplyCenterLayer");
  for (var key in provinceData) {
    var supply_center = provinceData[key].supply_center;
    if (supply_center != undefined) {
      var star = supplyCenterLayer.image("/static/img/supply_center.png",
                                         supply_center.x, supply_center.y, 20, 19);
      star.transform("t-10,-10 r-25");
    }
  }

  var provincePaths = s.selectAll("#MapLayer path");
  for (var i = 0; i < provincePaths.length; ++i) {
    var element = provincePaths[i];
    element.hover(function() {
      this.attr("style", "stroke: darkred; stroke-width: 5; fill-opacity: 0.9;");
    }, function() {
      this.attr("style", "stroke: black; stroke-width: 1; fill-opacity: 1;");
    });
  }

  for (var power in powers) {
    for (var i = 0; i < powers[power]["territory"].length; ++i) {
      var province = powers[power]["territory"][i];
      var element = s.select("#_" + province);
      if (!element) {
        alert("unknown province: " + province);
        continue;
      }
      element.addClass(power);
    }
  }
  s.select("#FullLabelLayer").show();
}

window.onload = function () {
    build_map();
};

Snap.plugin(function (Snap, Element) {
  // displays the element
  Element.prototype.show = function() {
    this.attr('display', '');
    this.attr('visibility', 'inherit');
  };

  // hides the element
  Element.prototype.hide = function() {
    this.attr('display', 'none');
    this.attr('visibility', 'inherit');
  };
});
