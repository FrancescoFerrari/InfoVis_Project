(function() {
  var drag_add_link, global, graph, height, update, width,
    __indexOf = Array.prototype.indexOf || function(item) {
    	for (var i = 0, l = this.length; i < l; i++)
    		{
    		if (i in this && this[i] === item)
    			return i;
    		} return -1;
    	};

  width = 960;
  height = 500;

  /* SELECTION - store the selected node
  */

  /* EDITING - store the drag mode (either 'drag' or 'add_link')
  */

  global = {
    selection: null,
  };


  /* create some fake data
  */
  graph = {
    nodes: [
      {
        id: '1',
        label:"a",
        x: 469,
        y: 410,
        type: 'blue'
      }, {
        id: '2',
        label:"b",
        x: 493,
        y: 364,
        type: 'blue'
      }, {
        id: '3',
        label:"c",
        x: 442,
        y: 365,
        type: 'orange'
      }, {
        id: '4',
        label:"d",
        x: 467,
        y: 314,
        type: 'green'
      }

     ],
    edges: [
      {
        id:"1",
        source: '1',
        target: '2',
        label:"a->b",

      }, {
        id:"2",
        source: '2',
        target: '3',
        label:"B->C",

      }, {
        id:"3",
        source: '3',
        target: '1',
        label:"c->a",

      }, {
        id:"4",
        source: '4',
        target: '1',
        label:"d->a",

      }, {
        id:"5",
        source: '4',
        target: '2',
        label:"d->b",

      }

    ],

  last_index: 5,
  artificial_index: 0,
  links_index:6,

    objectify: (function() {
      /* resolve node IDs (not optimized at all!)
      */
      var l, n, _i, _len, _ref, _results;
      _ref = graph.edges;
      _results = [];
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        l = _ref[_i];
        _results.push((function() {
          var _j, _len2, _ref2, _results2;
          _ref2 = graph.nodes;
          _results2 = [];
          for (_j = 0, _len2 = _ref2.length; _j < _len2; _j++) {
            n = _ref2[_j];
            if (l.source === n.id) {
              l.source = n;
              continue;
            }
            if (l.target === n.id) {
              l.target = n;
              continue;
            } else {
              _results2.push(void 0);
            }
          }
          return _results2;
        })());
      }
      return _results;
    }),

    remove: (function(condemned) {
      /* remove the given node or link from the graph, also deleting dangling edges if a node is removed
      */

      if (__indexOf.call(graph.nodes, condemned) >= 0) {
        graph.nodes = graph.nodes.filter(function(n) {
          return n !== condemned;
        });
        return graph.edges = graph.edges.filter(function(l) {
          return l.source.id !== condemned.id && l.target.id !== condemned.id;
        });
      }
      //this part is for deleting the single link
      else if (__indexOf.call(graph.edges, condemned) >= 0) {
        return graph.edges = graph.edges.filter(function(l) {
          return l !== condemned;
        });
      }
    }),

    add_node: (function(type) {
      var n;
      n = {
        id: graph.last_index++,
        label:"node: "+ graph.last_index,
        x: width / 2,
        y: height / 2,
        type: type
      };
	//mette il nodo nel grafo
      graph.nodes.push(n);
      return n;
    }),

    add_link: (function(source, target) {
      /* avoid edges to self
      */
      var l, link, _i, _len, _ref;
      if (source === target) return null;
      /* avoid link duplicates
      */
      _ref = graph.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        if (link.source === source && link.target === target) return null;
      }

      l = {
        id: graph.links_index++,
        label:source.id+"-->"+target.id,
        source: source,
        target: target
      };
      graph.edges.push(l);
      return l;
    }),

    add_modified_link:(function(source, target, mod_id, mod_lab) {
      /* avoid edges to self
      */
      var l, link, _i, _len, _ref;
      if (source === target) return null;
      /* avoid link duplicates
      */
      _ref = graph.edges;
      for (_i = 0, _len = _ref.length; _i < _len; _i++) {
        link = _ref[_i];
        if (link.source === source && link.target === target) return null;
      }

      l = {
        id: mod_id,
        label: mod_lab,
        source: source,
        target: target
      };
      graph.edges.push(l);
      return l;
    })

  };

  graph.objectify();


  window.main = (function () {
    /* create the SVG
    */
    var container, library, svg, toolbar;

    svg = d3.select('.mainArea');

    /* ZOOM and PAN
    */
    /* create container elements
    */
    container = svg.append('g');

    container.call(d3.behavior.zoom().scaleExtent([0.5, 8]).on('zoom', (function () {
      return global.vis.attr('transform', "translate(" + d3.event.translate + ")scale(" + d3.event.scale + ")");
    })));

    global.vis = container.append('g');
    /* create a rectangular overlay to catch events
    */
    /* WARNING rect size is huge but not infinite. this is a dirty hack
    */
    global.vis.append('rect').attr('class', 'overlay')
        .attr('x', -500000).attr('y', -500000).attr('width', 1000000).attr('height', 1000000)
        .on('click', (function (d) {
      /* SELECTION
      */
      global.selection = null;

      d3.selectAll('.node').classed('selected', false);
      return d3.selectAll('.link').classed('selected', false);
    }));
    /* END ZOOM and PAN
    */
    global.colorify = d3.scale.category10();
    /* initialize the force layout
    */
    global.force = d3.layout.force().size([width, height]).charge(-400).linkDistance(60).on('tick', (function () {
      /* update nodes and edges
      */
      global.vis.selectAll('.node').attr('transform', function (d) {
        return "translate(" + d.x + "," + d.y + ")";
      });
      return global.vis.selectAll('.link').attr('x1', function (d) {
        return d.source.x;
      }).attr('y1', function (d) {
        return d.source.y;
      }).attr('x2', function (d) {
        return d.target.x;
      }).attr('y2', function (d) {
        return d.target.y;
      });
    }));
    /* DRAG
    */
    global.drag = global.force.drag().on('dragstart', function (d) {
      return d.fixed = true;
    });
    /* DELETION - pressing DEL deletes the selection
    */
    /*

    commentato perchè scomodo con l'editor
    d3.select(window).on('keydown', function () {
      if (d3.event.keyCode === 46 ) {
        if (global.selection != null) {
          graph.remove(global.selection);
          global.selection = null;
          return update();
        }
      }
    });
*/


    function isEditable(selection){
      let bool=0;
      if (selection !== null){
        if (__indexOf.call(graph.nodes, selection) >= 0) {
          if (selection.type !== "artificial")
            bool = 1;
        }else {
          if (selection.source.type !== "artificial" && selection.target.type !== "artificial")
            bool = 2
        }
       }

      return bool;
    }


    function usedId(selection, new_id, switch_id){
      let bool=true;

      if(switch_id===1) {
        if (selection.id === new_id)
          return true;
        else {

          for (let i = 0; i < graph.nodes.length; i++) {
            if (graph.nodes[i].id === new_id)
              bool = false;
          }
          return bool;
        }
      }
      if(switch_id===2) {
        if (selection.id === new_id)
          return true;
        else {

          for (let i = 0; i < graph.edges.length; i++) {
            if (graph.edges[i].id === new_id)
              bool = false;
          }
          return bool;
        }
      }

    }

    function submit_changes(selection) {

      const switch_id= isEditable(selection);
      if(switch_id===1)
       if (usedId( selection, document.getElementById("node_id").value , 1)){

        let modified_node={
          id: document.getElementById("node_id").value,
          label: document.getElementById("node_label").value,
          x: selection.x,
          y: selection.y,
          type: document.getElementById("node_type").value
        };
        let list_link=allLinkOfNode(selection);

          graph.remove(selection);
          update();

         graph.nodes.push(modified_node);

          for (let i = 0; i < list_link.length; i++)
            graph.add_link(modified_node, list_link[i]);

          global.selection=modified_node;

      }
      if(switch_id===2)
        if (usedId( selection, document.getElementById("node_id").value,2 )) {

          let source = selection.source;
          let target = selection.target;

          graph.remove(selection);
          update();

          graph.add_modified_link(source, target, document.getElementById("node_id").value, document.getElementById("node_label").value);

          global.selection = null;
        }
      update();
    }


    function showEdit(selection_to_show) {

      if (isEditable(selection_to_show) === 1) {
        document.getElementById("node_id").value = selection_to_show.id;
        document.getElementById("node_label").value = selection_to_show.label;
        document.getElementById("node_type").value = selection_to_show.type;
      } else if (isEditable(selection_to_show) === 2) {
        document.getElementById("node_id").value = selection_to_show.id;
        document.getElementById("node_label").value = selection_to_show.label;
        document.getElementById("node_type").value = "";
      }
    }

    /*funzione per colorare le icone e mostrare l'editor
     */
    d3.select(window).on('click', function () {

      {
            if (global.selection !== null) {


                d3.selectAll("#trashIcon").attr("href", "img/red_trash.jpg");

              {
                if (global.selection.type === "artificial")
                  d3.selectAll("#glueIcon").attr("href", "img/blue_glue.png");
                else
                  d3.selectAll("#glueIcon").attr("href", "img/glue.png");
              }
            }
            else
                d3.selectAll("#trashIcon").attr("href", "img/trash.jpg");
        }
        {
            if (__indexOf.call(graph.edges, global.selection) >= 0)
                d3.selectAll("#splitIcon").attr("href", "img/red_scissors.png");
             else
                d3.selectAll("#splitIcon").attr("href", "img/scissor.png");
        }

    });

    d3.select(".mainArea").on('click', function () {
            if (global.selection !== null)
              showEdit(global.selection);
    });


      /* funzione di split del link con creazione del nodo artificiale
       */
    function split(linkToSplit) {

      /* rimuovi il link selezionato
     */

      if (__indexOf.call(graph.edges, linkToSplit) >= 0) {
        graph.remove(linkToSplit);
        global.selection = null;

        //aggiungi il nodo artificiale
        let n;
        n = {
          id: "a" + graph.artificial_index++,
          x: (linkToSplit.target.x + linkToSplit.source.x) / 2,    // punto medio x del vettore
          y: (linkToSplit.target.y + linkToSplit.source.y) / 2,
          type: "artificial"
        };

        //mette il nodo nel grafo
        graph.nodes.push(n);

        //collega i link al nuovo nodo artificiale
        graph.add_link(linkToSplit.source, n);
        graph.add_link(n, linkToSplit.target);

        update();
      }
    }

    /* funzione che attacca i link collegati al nodo artificiale
     */
    function glue(artificialNode) {

        let connectedNodes = allLinkOfNode(artificialNode); //return a list of the near node

      //remove node and associated link
        graph.remove(artificialNode);
        global.selection = null;

        //collega i nodi vicini
        graph.add_link(connectedNodes[0] , connectedNodes[1]);

        update();

    }

    update();

    /* TOOLBAR */
    toolbar = $("<div class='toolbar'></div>");
    $('body').append(toolbar);
    toolbar.append($("<svg\n    class='active tool'\n    data-tool='pointer'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n    <g transform='translate(881.10358,-356.22543)'>\n      <g transform='matrix(0.8660254,-0.5,0.5,0.8660254,-266.51112,-215.31898)'>\n        <path\n           d='m -797.14902,212.29589 a 5.6610848,8.6573169 0 0 0 -4.61823,4.3125 l -28.3428,75.0625 a 5.6610848,8.6573169 0 0 0 4.90431,13 l 56.68561,0 a 5.6610848,8.6573169 0 0 0 4.9043,-13 l -28.3428,-75.0625 a 5.6610848,8.6573169 0 0 0 -5.19039,-4.3125 z m 0.28608,25.96875 18.53419,49.09375 -37.06838,0 18.53419,-49.09375 z'\n        />\n        <path\n           d='m -801.84375,290.40625 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,35.25 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-35.25 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 z'\n        />\n      </g>\n    </g>\n</svg>"));
    toolbar.append($("<svg\n    class='tool'\n    data-tool='add_node'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n    <g transform='translate(720.71649,-356.22543)'>\n      <g transform='translate(-3.8571429,146.42857)'>\n        <path\n           d='m -658.27638,248.37149 c -1.95543,0.19978 -3.60373,2.03442 -3.59375,4 l 0,12.40625 -12.40625,0 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,10 c -0.007,0.1353 -0.007,0.27095 0,0.40625 0.19978,1.95543 2.03442,3.60373 4,3.59375 l 12.40625,0 0,12.4375 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-12.4375 12.4375,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-10 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -12.4375,0 0,-12.40625 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -10,0 c -0.1353,-0.007 -0.27095,-0.007 -0.40625,0 z'\n        />\n        <path\n           d='m -652.84375,213.9375 c -32.97528,0 -59.875,26.86847 -59.875,59.84375 0,32.97528 26.89972,59.875 59.875,59.875 32.97528,0 59.84375,-26.89972 59.84375,-59.875 0,-32.97528 -26.86847,-59.84375 -59.84375,-59.84375 z m 0,14 c 25.40911,0 45.84375,20.43464 45.84375,45.84375 0,25.40911 -20.43464,45.875 -45.84375,45.875 -25.40911,0 -45.875,-20.46589 -45.875,-45.875 0,-25.40911 20.46589,-45.84375 45.875,-45.84375 z'\n        />\n      </g>\n    </g>\n</svg>"));
    toolbar.append($("<svg\n    class='tool'\n    data-tool='add_link'\n    xmlns='http://www.w3.org/2000/svg'\n    version='1.1'\n    width='32'\n    height='32'\n    viewBox='0 0 128 128'>\n<g transform='translate(557.53125,-356.22543)'>\n    <g transform='translate(20,0)'>\n      <path\n         d='m -480.84375,360 c -15.02602,0 -27.375,12.31773 -27.375,27.34375 0,4.24084 1.00221,8.28018 2.75,11.875 l -28.875,28.875 c -3.59505,-1.74807 -7.6338,-2.75 -11.875,-2.75 -15.02602,0 -27.34375,12.34898 -27.34375,27.375 0,15.02602 12.31773,27.34375 27.34375,27.34375 15.02602,0 27.375,-12.31773 27.375,-27.34375 0,-4.26067 -0.98685,-8.29868 -2.75,-11.90625 L -492.75,411.96875 c 3.60156,1.75589 7.65494,2.75 11.90625,2.75 15.02602,0 27.34375,-12.34898 27.34375,-27.375 C -453.5,372.31773 -465.81773,360 -480.84375,360 z m 0,14 c 7.45986,0 13.34375,5.88389 13.34375,13.34375 0,7.45986 -5.88389,13.375 -13.34375,13.375 -7.45986,0 -13.375,-5.91514 -13.375,-13.375 0,-7.45986 5.91514,-13.34375 13.375,-13.34375 z m -65.375,65.34375 c 7.45986,0 13.34375,5.91514 13.34375,13.375 0,7.45986 -5.88389,13.34375 -13.34375,13.34375 -7.45986,0 -13.34375,-5.88389 -13.34375,-13.34375 0,-7.45986 5.88389,-13.375 13.34375,-13.375 z'\n      />\n      <path\n         d='m -484.34375,429.25 c -1.95543,0.19978 -3.60373,2.03442 -3.59375,4 l 0,12.40625 -12.40625,0 c -2.09434,2.1e-4 -3.99979,1.90566 -4,4 l 0,10 c -0.007,0.1353 -0.007,0.27095 0,0.40625 0.19978,1.95543 2.03442,3.60373 4,3.59375 l 12.40625,0 0,12.4375 c 2.1e-4,2.09434 1.90566,3.99979 4,4 l 10,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-12.4375 12.4375,0 c 2.09434,-2.1e-4 3.99979,-1.90566 4,-4 l 0,-10 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -12.4375,0 0,-12.40625 c -2.1e-4,-2.09434 -1.90566,-3.99979 -4,-4 l -10,0 c -0.1353,-0.007 -0.27095,-0.007 -0.40625,0 z'\n      />\n    </g>\n  </g>\n</svg>"));

    d3.select(".toolbar")
        .append('svg')
        .attr("class", "tool")
        .attr("data-tool", "split")
        .attr("xmlns", "http://www.w3.org/2000/svg")
        .attr("version", "1.1")
        .attr("height", "32")
        .attr("width", "32")
        .attr("viewBox", "0 0 128 128")
        .append("image")
        .attr("id", "splitIcon")
        .attr("height", "125px")
        .attr("width", "125px")
        .attr("href", "img/scissor.png")
        .on("click", function () {
          split(global.selection)
        });

      d3.select(".toolbar")
          .append('svg')
          .attr("class", "tool")
          .attr("data-tool", "split")
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .attr("version", "1.1")
          .attr("height", "32")
          .attr("width", "32")
          .attr("viewBox", "0 0 128 128")
          .append("image")
          .attr("id", "glueIcon")
          .attr("height", "125px")
          .attr("width", "125px")
          .attr("href", "img/glue.png")
          .on("click", function () {
            if(global.selection.type==="artificial")
              glue(global.selection)
          });

      d3.select(".toolbar")
          .append('svg')
          .attr("class", "tool")
          .attr("data-tool", "split")
          .attr("xmlns", "http://www.w3.org/2000/svg")
          .attr("version", "1.1")
          .attr("height", "32")
          .attr("width", "32")
          .attr("viewBox", "0 0 128 128")
          .append("image")
          .attr("id", "trashIcon")
          .attr("height", "105px")
          .attr("width", "105px")
          .attr("href", "img/trash.jpg")
          .on("click", function () {

              graph.remove(global.selection);
              global.selection = null;
              return update();

          });

      d3.select('#submit_node_changes').on("click", function () {
         submit_changes(global.selection);
      });


    library = $("<div class='library'></div></div>");
    toolbar.append(library);
    ['blue', 'orange', 'green', 'red', 'violet'].forEach(function (type) {
      var new_btn;
      new_btn = $("<svg width='42' height='42'>\n    <g class='node'>\n        <circle\n            cx='21'\n            cy='21'\n            r='18'\n            stroke='" + (global.colorify(type)) + "'\n            fill='" + (d3.hcl(global.colorify(type)).brighter(3)) + "'\n        />\n    </g>\n</svg>");
      new_btn.bind('click', function () {
        graph.add_node(type);
        return update();
      });
      library.append(new_btn);
      return library.hide();
    });
    global.tool = 'pointer';
    global.new_link_source = null;
    global.vis.on('mousemove.add_link', (function (d) {
      /* check if there is a new link in creation
      */

      var p;
      if (global.new_link_source != null) {
        /* update the draggable link representation
        */
        p = d3.mouse(global.vis.node());
        return global.drag_link.attr('x1', global.new_link_source.x).attr('y1', global.new_link_source.y).attr('x2', p[0]).attr('y2', p[1]);
      }
    })).on('mouseup.add_link', (function (d) {
      global.new_link_source = null;
      /* remove the draggable link representation, if exists
      */
      if (global.drag_link != null) return global.drag_link.remove();
    }));


    /*BUTTONS
     */
    divButtons=$(" <div\n   class='buttons' id='buttons'  </div>" );
    buttonFilteredGraph=   $("<button class='saveButton' id='originalJson'  style='margin-right: 50px;'>Save Planar Graph</button>" );
    buttonArtificialGraph= $("<button class='saveButton' id='artificialJson' style='margin-right: 50px;' >Save Drawing</button>" );
    buttonLoadJson=        $("<input class='saveButton' type=\"file\" id=\"files\" name=\"files[]\" multiple />\n" );

    $('body').append(divButtons);
    divButtons.append(buttonFilteredGraph);
    divButtons.append(buttonArtificialGraph);
    divButtons.append(buttonLoadJson);



    function encode( s ) {
      var out = [];
      for ( let i = 0; i < s.length; i++ ) {
        out[i] = s.charCodeAt(i);
      }
      return new Uint8Array( out );
    }

    /* For the clockwise order */
    function orderlink(centerNode, listOfLinktoSort) {

      //listOfLinktoSort =[ obj={id: "", label: "" ,x: "" , y: "", type: ""  } ... {...}  ]
      const center = {x:centerNode.x ,y:centerNode.y};

      var startAng;
      listOfLinktoSort.forEach(point => {
        var ang = Math.atan2(point.y - center.y,point.x - center.x);
        if(!startAng){ startAng = ang }
        else {
          if(ang < startAng){  // ensure that all points are clockwise of the start point
            ang += Math.PI * 2;
          }
        }
        point.angle = ang; // add the angle to the point
      });
      // Sort clockwise;
      listOfLinktoSort.sort((a,b)=> a.angle - b.angle);

      /*
       for ANTI CLOCKWISE use this sniplet
      // reverse the order
      const ccwPoints = listOfLinktoSort.reverse();
      // move the last point back to the start
      ccwPoints.unshift(ccwPoints.pop());
       */

      //print
      var result=[];
      for (let i=0; i<listOfLinktoSort.length ; i++)
        result.push(listOfLinktoSort[i].id);
      return result;
    }

    function allLinkOfNode(node){
      var result=[];
      for (let j=0; j<graph.edges.length ; j++){
        if (node.id ===graph.edges[j].source.id){
          result.push(graph.edges[j].target)
        }
        else  if (node.id ===graph.edges[j].target.id){
          result.push(graph.edges[j].source)
        }
      }
      return result;
  }

    function reconnectedId(currentNode,nextNode) {
      if (nextNode.type !== "artificial")
        return nextNode.id;
      else{
        let links= allLinkOfNode(nextNode);
        for (let i in links) {
          if (links[i].id !== currentNode.id) {
            return reconnectedId(nextNode,links[i]);
          }
        }
      }

    }

    function createResult(){
      var listaNodi =[];
      var listaLink =[];

      for (let i=0; i<graph.nodes.length ; i++){
        let obj = {
          id: graph.nodes[i].id,
          label: graph.nodes[i].label,
          order: orderlink( graph.nodes[i], allLinkOfNode(graph.nodes[i]) ),
          color: graph.nodes[i].type
        };
        listaNodi.push(obj);
      }
      for (let j=0; j<graph.edges.length ; j++){
        let link = {
          id: graph.edges[j].id,
          label: graph.edges[j].label,
          source: graph.edges[j].source.id,
          target: graph.edges[j].target.id
        };
        listaLink.push(link);
      }
      return{
        nodes: listaNodi,
        edges: listaLink,
        nodes_index: listaNodi.length

      };
    }

    function order_without_Artificial(centerNode, listOfLinktoSort) {

      const center = {x: centerNode.x, y: centerNode.y};

      var startAng;
      listOfLinktoSort.forEach(point => {
        var ang = Math.atan2(point.y - center.y, point.x - center.x);
        if (!startAng) {
          startAng = ang
        } else {
          if (ang < startAng) {  // ensure that all points are clockwise of the start point
            ang += Math.PI * 2;
          }
        }
        point.angle = ang; // add the angle to the point
      });
      // Sort clockwise;
      listOfLinktoSort.sort((a, b) => a.angle - b.angle);

      /*
       for ANTI CLOCKWISE use this sniplet
      // reverse the order
      const ccwPoints = listOfLinktoSort.reverse();
      // move the last point back to the start
      ccwPoints.unshift(ccwPoints.pop());
       */

      //print
      var result = [];
      for (let i = 0; i < listOfLinktoSort.length; i++) {
        /* change the artificial node with the real node id*/
        if (listOfLinktoSort[i].type === "artificial")
        result.push(reconnectedId(centerNode, listOfLinktoSort[i]));
        else
        result.push(listOfLinktoSort[i].id);
      }
        return result;
    }


    function createFilteredResult() {
      var listaNodi =[];
      var listaLink =[];

      for (let i=0; i<graph.nodes.length ; i++) {
        if (graph.nodes[i].type !== "artificial") {
          let obj = {
            id: graph.nodes[i].id,
            label: graph.nodes[i].label,
            order: order_without_Artificial(graph.nodes[i], allLinkOfNode(graph.nodes[i])),
            color: graph.nodes[i].type
          };
          listaNodi.push(obj);
        }
      }

      for (let j=0; j<graph.edges.length ; j++) {

        if (!(graph.edges[j].source.type == "artificial" && graph.edges[j].target.type == "artificial")) {

          /*for the edges i need only one control or in the target or in the source or i will get some duplicate */
          if (graph.edges[j].target.type == "artificial"){
            let originalID=reconnectedId( graph.edges[j].source , graph.edges[j].target );

            let link = {
              id: graph.edges[j].id,
              label: graph.edges[j].label,
              source: graph.edges[j].source.id,
              target: originalID
            };

            listaLink.push(link);
          }
          else if (graph.edges[j].source.type !== "artificial" && graph.edges[j].target.type !== "artificial"){
            let link = {
              id: graph.edges[j].id,
              label: graph.edges[j].label,
              source: graph.edges[j].source.id,
              target: graph.edges[j].target.id
            };
            listaLink.push(link);
          }
        }
      }//iterazione_for
      return{
        nodes: listaNodi,
        edges: listaLink,
        nodes_index: graph.artificial_index+ listaNodi.length
      };
    }

    /* Inizio Load Json */
    var json;

    document.getElementById(buttonLoadJson[0].id).addEventListener('change', handleFileSelect, false);

    function handleFileSelect(evt) {
      var files = evt.target.files; // FileList object
      // files is a FileList of File objects. List some properties.

      for (var i = 0, f; f = files[i]; i++) {
        var reader = new FileReader();

        // Closure to capture the file information.
        reader.onload = (function (theFile) {
          return function (e) {
            console.log('e readAsText = ', e);
            console.log('e readAsText target = ', e.target);
            try {
              json = JSON.parse(e.target.result);

              let listaNodi =[];

              for (let i=0; i<json.nodes.length ; i++) {
                let obj = {
                  id: json.nodes[i].id,
                  label: json.nodes[i].label,
                  type: json.nodes[i].color
                };
                listaNodi.push(obj);
              }
              graph.last_index= json.nodes_index;
              graph.artificial_index=json.nodes_index;
              graph.links_index=json.edges.length;

              graph.nodes=listaNodi;
              graph.edges=json.edges;
              graph.objectify();
              update();



            } catch (ex) {
              alert('ex when trying to parse json = ' + ex);
            }
          }
        })(f);
        reader.readAsText(f);
      }

    }
    document.getElementById(buttonLoadJson[0].id).addEventListener('change', handleFileSelect, false);

    /*Json trascription of the graph without artificial node and link*/
    var button = document.getElementById( buttonFilteredGraph[0].id );
    button.addEventListener( 'click', function() {
        let result = createFilteredResult();
        let data = encode( JSON.stringify(result, null, "\t"));

        /* for browser downloading
        */
        let blob = new Blob( [ data ], {
          type: 'application/octet-stream'
        });
        url = URL.createObjectURL( blob );
        var link = document.createElement( 'a' );
        link.setAttribute( 'href', url );
        link.setAttribute( 'download', 'graph.json' );

        let event = document.createEvent( 'MouseEvents' );
        event.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
        link.dispatchEvent( event );
      });


    /*Json trascription of the graph with artificial node too*/
    var button2 = document.getElementById( buttonArtificialGraph[0].id );
    button2.addEventListener( 'click', function() {

      var result = createResult();
      var data = encode( JSON.stringify(result, null, "\t"));

      /* for browser downloading
      */
      var blob = new Blob( [ data ], {
        type: 'application/octet-stream'
      });
      url = URL.createObjectURL( blob );
      var link = document.createElement( 'a' );
      link.setAttribute( 'href', url );
      link.setAttribute( 'download', 'graph.json' );

      var event = document.createEvent( 'MouseEvents' );
      event.initMouseEvent( 'click', true, true, window, 1, 0, 0, 0, 0, false, false, false, false, 0, null);
      link.dispatchEvent( event );
    });


    return d3.selectAll('.tool').on('click', function () {
      var new_tool, nodes;
      d3.selectAll('.tool').classed('active', false);
      d3.select(this).classed('active', true);
      new_tool = $(this).data('tool');
      nodes = global.vis.selectAll('.node');
      if (new_tool === 'add_link' && global.tool !== 'add_link') {
        /* remove drag handlers from nodes
        */
        nodes.on('mousedown.drag', null).on('touchstart.drag', null);
        /* add drag handlers for the add_link tool
        */
        nodes.call(drag_add_link);
      } else if (new_tool !== 'add_link' && global.tool === 'add_link') {
        /* remove drag handlers for the add_link tool
        */
        nodes.on('mousedown.add_link', null).on('mouseup.add_link', null);
        /* add drag behavior to nodes
        */
        nodes.call(global.drag);
      }
      if (new_tool === 'add_node') {
        library.show();
      } else {
        library.hide();
      }
      return global.tool = new_tool;
    });
  });

  update = function() {
    /* update the layout
    */
    var edges, new_nodes, nodes;
    global.force.nodes(graph.nodes).links(graph.edges).start();
    /* create nodes and edges
    */
    /* (edges are drawn with insert to make them appear under the nodes)
    */
    /* also define a drag behavior to drag nodes
    */
    /* dragged nodes become fixed
    */
    nodes = global.vis.selectAll('.node').data(graph.nodes, function(d) {
      return d.id;
    });
    new_nodes = nodes.enter().append('g').attr('class', 'node').on('click', (function(d) {
      /* SELECTION
      */      global.selection = d;
      d3.selectAll('.node').classed('selected', function(d2) {
        return d2 === d;
      });
      return d3.selectAll('.link').classed('selected', false);
    }));
    edges = global.vis.selectAll('.link').data(graph.edges, function(d) {
      return "" + d.source.id + "->" + d.target.id;
    });
    edges.enter().insert('line', '.node').attr('class', 'link').on('click', (function(d) {
      /* SELECTION
      */      global.selection = d;
      d3.selectAll('.link').classed('selected', function(d2) {
        return d2 === d;
      });
      return d3.selectAll('.node').classed('selected', false);
    }));
    edges.exit().remove();
    /* TOOLBAR - add link tool initialization for new nodes
    */
    if (global.tool === 'add_link') {
      new_nodes.call(drag_add_link);
    } else {
      new_nodes.call(global.drag);
    }
    new_nodes.append('circle')
        .attr('r', function(d){
          if (d.type==="artificial")
            return 5;
          else return 18;
        })
        .attr('stroke', function(d) {
          if (d.type==="artificial")
            return d3.hcl(null).brighter(1);
          else
            return global.colorify(d.type);
       })
        .attr('fill', function(d) {
          if (d.type==="artificial")
            return d3.hcl(null).brighter(3);
          else
            return d3.hcl(global.colorify(d.type)).brighter(3);
      });
    /* draw the label
    */

    new_nodes
        .append('text')
        .text(function(d) {
          if(d.type==="artificial")
            return "";
          else return d.id;})
        .attr('dy', '0.35em')
        .attr('fill', function(d) {
            return global.colorify(d.type);
    });
    return nodes.exit().remove();
  };

  drag_add_link = function(selection) {
    return selection.on('mousedown.add_link', (function(d) {
      var p;
      global.new_link_source = d;
      /* create the draggable link representation
      */
      p = d3.mouse(global.vis.node());
      global.drag_link = global.vis.insert('line', '.node').attr('class', 'drag_link').attr('x1', d.x).attr('y1', d.y).attr('x2', p[0]).attr('y2', p[1]);
      /* prevent pan activation
      */
      d3.event.stopPropagation();
      /* prevent text selection
      */
      return d3.event.preventDefault();
    })).on('mouseup.add_link', (function(d) {

      /*il controllo è per evitare loop di archi artificiali
       */
      if(global.new_link_source.type!=="artificial" && d.type !=="artificial") {
        /* add link and update, but only if a link is actually added
        */
        if (graph.add_link(global.new_link_source, d) != null) return update();
      }
    }));
  };






}).call(this);
