powers = {
  russia: {
    territory: ["lvn", "stp", "mos", "sev", "war", "ukr"],
    units: {
      army: ["mos", "war"],
      fleet: ["stp", "sev"],
    }
  },
  germany: {
    territory: ["ruh", "kie", "ber", "mun", "pru", "sil"],
    units: {
      army: ["ber", "mun"],
      fleet: ["kie"],
    }
  },
  austria: {
    territory: ["boh", "gal", "vie", "bud", "tri", "tyr"],
    units: {
      army: ["vie", "bud"],
      fleet: ["tri"],
    }
  },
  england: {
    territory: ["lon", "wal", "edi", "yor", "cly", "lvp"],
    units: {
      army: ["lvp"],
      fleet: ["lon", "edi"],
    }
  },
  france: {
    territory: ["pic", "par", "bre", "gas", "mar", "bur"],
    units: {
      army: ["mar", "par"],
      fleet: ["bre"],
    }
  },
  italy: {
    territory: ["pie", "ven", "tus", "apu", "nap", "rom"],
    units: {
      army: ["rom", "ven"],
      fleet: ["nap"],
    }
  },
  turkey: {
    territory: ["arm", "ank", "con", "smy", "syr"],
    units: {
      army: ["smy", "con"],
      fleet: ["ank"],
    }
  },
}

provinceData = {}

function load_unit(type, power, target, x, y) {
  Snap.load("/static/svg/" + type + ".svg", function(f) {
    var group = f.select("g");
    var e = group.select("#fill_area");
    e.addClass(power);
    e.attr("style", "stroke-width: 0;");
    target.append(group);
    var fill = $(e.node).css("fill");
    m = fill.match(/^rgb\s*\(\s*(\d+)\s*,\s*(\d+)\s*,\s*(\d+)\s*\)$/i);
    if (m) {
      var d = 1.5;
      var r = Math.round(m[1] * d);
      var g = Math.round(m[2] * d);
      var b = Math.round(m[3] * d);
      e.attr("style", "fill: rgb(" + r + "," + g + "," + b + "); stroke-width: 0");
    }
    var box = group.getBBox();
    var s = 1.75;
    x = x - box.width / 2;
    y = y - box.height / 2;
    group.transform("t" + x + "," + y + " s" + s + "," + s);
  });
}


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

    var unit = province.getElementsByTagName("jdipNS:UNIT");
    provinceData[name].unit = {x: unit[0].getAttribute("x"),
                               y: unit[0].getAttribute("y")};

    var supplyCenter = province.getElementsByTagName("jdipNS:SUPPLY_CENTER");
    if (supplyCenter.length != 0) {
      provinceData[name].supply_center = {x: supplyCenter[0].getAttribute("x"),
                                          y: supplyCenter[0].getAttribute("y")};
    }
  }

  var svg = request.responseXML.getElementsByTagName("svg")[0];
  svg.id = "map";

  var content = $('#map_div');
  content.append(svg);

  svg = $("#map");
  var w = Math.max(document.documentElement.clientWidth, window.innerWidth || 0)
  var h = Math.max(document.documentElement.clientHeight, window.innerHeight || 0)
  var original_width = svg.width()
  var original_height = svg.height()

  var height = h - 20;
  var width = original_width * height / original_height;
  if (width < 1000) {
    width = 1000;
  }
  svg.width(width);
  svg.height(svg.height() * svg.width() / original_width);

  var s = Snap('#map');

  s.select("#MouseLayer").attr("pointer-events", "none");
  s.select("#FullLabelLayer").attr("pointer-events", "none");
  s.select("#BriefLabelLayer").attr("pointer-events", "none");

  var supplyCenterLayer = s.select("#SupplyCenterLayer");
  for (var key in provinceData) {
    var supply_center = provinceData[key].supply_center;
    if (supply_center != undefined) {
      supplyCenterLayer.circle(supply_center.x, supply_center.y, 12).attr("fill-opacity", 0.5);
      var star = supplyCenterLayer.image("/static/img/supply_center.png",
                                         supply_center.x, supply_center.y, 21, 21);
      star.transform("t-11,-11 r-25");
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

  var unitLayer = s.select("#UnitLayer");
  for (var power in powers) {
    for (var i = 0; i < powers[power].territory.length; ++i) {
      var province = powers[power].territory[i];
      var element = s.select("#_" + province);
      if (!element) {
        alert("unknown province: " + province);
        continue;
      }
      element.addClass(power);
    }

    for (var i = 0; i < powers[power].units.army.length; ++i) {
      var province = powers[power].units.army[i];
      //s.circle(provinceData[province].unit.x, provinceData[province].unit.y, 10);
      load_unit("army", power, unitLayer,
                provinceData[province].unit.x, provinceData[province].unit.y);
    }

    for (var i = 0; i < powers[power].units.fleet.length; ++i) {
      var province = powers[power].units.fleet[i];
      //s.circle(provinceData[province].unit.x, provinceData[province].unit.y, 10);
      load_unit("fleet", power, unitLayer,
                provinceData[province].unit.x, provinceData[province].unit.y);
    }
  }
  s.select("#FullLabelLayer").show();
}

window.onload = function () {
    build_map();
    update_visibility();
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


function update_visibility() {
  var s = Snap("#map");
  var labelLayer = s.select("#FullLabelLayer");
  var unitLayer = s.select("#UnitLayer");
  var supplyCenterLayer = s.select("#SupplyCenterLayer");

  if ($("#show_labels").prop("checked")) {
    labelLayer.show();
  } else {
    labelLayer.hide();
  }

  if ($("#show_units").prop("checked")) {
    unitLayer.show();
  } else {
    unitLayer.hide();
  }

  if ($("#show_supply").prop("checked")) {
    supplyCenterLayer.show();
  } else {
    supplyCenterLayer.hide();
  }
}
