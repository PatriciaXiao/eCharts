// layout settings
var nav_bar_height = $('#nav_bar').height();
var dom = document.getElementById("container");
dom.style.top = nav_bar_height + "px";
dom.style.height = ($(window).height() - nav_bar_height) + "px"; // set width to be "100%" - 40px;
dom.style.width = ($(window).width()) + "px";

// assets
var myChart = echarts.init(dom);
var MAX_INT = 10000;
var coordRange = {
    left: -200,
    right: 160,
    top: 90,
    bottom: -70
}
var myPath = 'image://static/test_image.jpg';
var backgroundColor = '#444455';//'#404a59';
var backgroundColor_rgb = '#445';
var color_flow = '#fff'; // '#000',
var colorSet = ['#a6c84c', '#ffa022', '#46bee9', '#e9967a', '#ffd700', '#dda0dd'];
var nodesInfo = {};
var linkeInfo = {};
var nodes = [];
var links = [];
var toggle = false; // whether or not to show just part of the series

// for debugging purpose
var DEBUG = true;//false;
function debug(val){
    if (DEBUG) console.log(val);
    return val;
}

// variables to be used
// ['groupName', groupData]
// groupData: [{name: 'startPointName'}, {name: 'endPointName', value: value of the line}]
var mergedGroups = [];
var series = [];
var option = {};

// coordinate range [(-200, 200), (-70, 90)]
// mapping data
var coordMap = {
    // for debugging purpose
    'corner_topright': [coordRange.right, coordRange.top], //[121.4648,31.2891],
    'corner_bottomleft': [coordRange.left,coordRange.bottom], //[116.4551,40.2539],
    'corner_topleft': [coordRange.left, coordRange.top],//[113.5107,23.2196],
    'corner_bottomright': [coordRange.right, coordRange.bottom],
    'center': [(coordRange.left + coordRange.right) / 2. , (coordRange.top + coordRange.bottom) / 2.]
};
// could add / modify its contents like this:
// coordMap['center'] = [(coordRange.left + coordRange.right) / 2. , (coordRange.top + coordRange.bottom) / 2.];

// functions 
var convertData = function (data) {
    var res = [];
    for (var i = 0; i < data.length; i++) {
        var dataItem = data[i];
        var fromCoord = coordMap[dataItem[0].name];
        var toCoord = coordMap[dataItem[1].name];
        if (fromCoord && toCoord) {
            res.push({
                fromName: dataItem[0].name, // could be commented out
                toName: dataItem[1].name,   // also could be
                value: dataItem[1].value,
                coords: [fromCoord, toCoord]
            });
        }
    }
    return res;
};

var Groups = ["用户交互项目", "用户行为轨迹"] // nodes, links


var rawData = getData();

function setNodes(raw_input_nodes) {
    // 
    var coords = {};
    var nodes_info = {};
    var nodes = [["用户交互项目", []], ["用户行为轨迹", []]];
    var n_cols = 0;
    var col_length_lst = [];
    for (var i = 0; i < raw_input_nodes.length; i++){
        if(raw_input_nodes[i].length > n_cols) {
            n_cols = raw_input_nodes[i].length;
        }
    }
    for (var i = 0; i < n_cols; i++) {
        col_length_lst.push(0)
        for (var j = 0; j < raw_input_nodes.length; j++) {
            if (raw_input_nodes[j].length > i && raw_input_nodes[j][i] != null)
                col_length_lst[i] += 1;
        }
    }
    // console.log(col_length_lst)
    var interval = (coordRange.right - coordRange.left) / ((n_cols - 1) * 1.0);
    var y_total = (coordRange.top - coordRange.bottom);
    for (var j = 0; j < n_cols; j++){ // according to rows
        var cnt_item = 0;
        var delta_x = interval * j;
        var delta_y = (y_total / (col_length_lst[j] * 1.0 + 1.0));
        for (var i = 0; i < raw_input_nodes.length; i++) { //according to cols
            if (raw_input_nodes[i].length <= j || raw_input_nodes[i][j] == null) continue;
            else cnt_item += 1;
            if (raw_input_nodes[i][j] == 0) continue;
            

            // coords
            coords[nodesNames[raw_input_nodes[i][j].id]] = [
                coordRange.left + delta_x,
                coordRange.top - delta_y * cnt_item
            ];
            // nodes info
            nodes_info[nodesNames[raw_input_nodes[i][j].id]] = {
                label_name: nodesNames[raw_input_nodes[i][j].id], //'Label:' + nodesNames[raw_input_nodes[i][j].id],
                value: raw_input_nodes[i][j].value
            };
            // nodes
            nodes[0][1].push(nodesNames[raw_input_nodes[i][j].id]);
        }
    }

    return [nodes_info, coords, nodes];
}
function setLinks(raw_input_links) {
    var links = [["用户交互项目", []], ["用户行为轨迹", []]];
    for(var i = 0; i < raw_input_links.length; i++) {
        links[1][1].push([
            { name: nodesNames[raw_input_links[i].from] },
            { name: nodesNames[raw_input_links[i].to], value: raw_input_links[i].value }
        ]);
    }
    return [links];
}
function f_size_nodes(x) {
    return 4 - 6000.0/(2000.0+x)
}
function drawNodes() {
    // console.log(nodes.length);
    nodes.forEach( function(item, i){
        series.push({
            name: item[0],
            type: 'effectScatter',
            coordinateSystem: 'geo', //'polar',
            zlevel: 2,
            rippleEffect: {
                brushType: 'stroke'
            },
            tooltip: {
                formatter: function(val) {
                    return val.value[2];
                }
            },
            label: {
                normal: {
                    show: true,
                    position: 'right',
                    formatter: function (val) {
                        // console.log(val)
                        // return nodeInfo[val.name].label_name; //equivalent
                        return val.value[3];
                    }
                }
            },
            symbolSize: function (val) {
                var x = val[2];
                // console.log("x="+x+";y="+f_size_nodes(x))
                return 8 * f_size_nodes(x);
            },
            itemStyle: {
                normal: {
                    color: colorSet[i]
                }
            },
            data: item[1].map(function (dataItem) {
                return {
                    name: dataItem,
                    value: coordMap[dataItem].concat([nodesInfo[dataItem].value, nodesInfo[dataItem].label_name]), //coordMap[dataItem[1].name].concat([dataItem[1].value])
                };
            })
        });
    });
}

function f_flow_speed(item) {
    if(item==undefined) return 0;
    if(item[1].value == 0) return 0;
    // console.log(item)
    var speed = 1.0 + (10000.0 / (item[1].value + 2000.0));
    // console.log(speed)
    return speed;
}

function drawLinks() {
    links.forEach(function (item, i) {
        var dataSet = convertData(item[1]);
        dataSet.forEach(function (flow_line, j) {
            //
            series.push(
                // the "flow"
                {
                    name: item[0],
                    type: 'lines',
                    zlevel: 1,
                    effect: {
                        show: true,
                        period: f_flow_speed(item[1][j]), //1, //6, // speed // 0 for nothing happens
                        trailLength: 0.7,
                        color: color_flow,
                        symbolSize: 3
                    },
                    lineStyle: {
                        normal: {
                            color: colorSet[i],
                            width: 0,
                            curveness: 0.2
                        }
                    },
                    data: [dataSet[j]] //debug(item[1])//convertData(item[1])
                },
                // the "line"
                {
                    name: item[0],
                    type: 'lines',
                    zlevel: 2,
                    // symbol: ['none', 'arrow'],
                    symbol: ['none', 'none'],
                    symbolSize: 10,
                    effect: {
                        show: false, //true,
                        period: 6,
                        trailLength: 0,
                        symbol: myPath,
                        symbolSize: 15
                    },
                    lineStyle: {
                        normal: {
                            color: colorSet[i],
                            width: 1,
                            opacity: 0.6,
                            curveness: 0.2
                        }
                    },
                    tooltip: {
                        formatter: function (params) {
                            // console.log(params)
                            return 'from ' + params.data.fromName + " to " + params.data.toName + " with value " + params.data.value;
                        }
                    },
                    label: {
                        normal: {
                            // show: true,
                            show: true,
                            position: 'middle',
                            formatter: function (val) {
                                return val.value;
                            }
                        }
                    },
                    data: [dataSet[j]]
                }
                
            );
        });
        
    });
}

// prepare data

var nodes_settings = setNodes(rawData.nodes);
nodesInfo = nodes_settings[0];
coordMap = nodes_settings[1];
nodes = nodes_settings[2];
// nodes = [['Group1', ['查公司', '查老板', '查关系']]]
var links_settings = setLinks(rawData.links);
links = links_settings[0]

// draw data
drawNodes();
drawLinks();

//////
series.push(
    {
        name: 'debug',
        type: 'lines',
        zlevel: 1,
        effect: {
            show: true,
            period: 6, //1, //6, // speed
            trailLength: 0.7,
            color:  backgroundColor, //'#000', // '#fff',
            symbolSize: 3
        },
        lineStyle: {
            normal: {
                color: backgroundColor,  //'#000',//color[i],
                width: 1,
                curveness: 0,
                opacity: 0,
            }
        },
        data: [{
            fromName: 'inf_far',
            toName: 'inf_far_2',
            coords: [[-1 * MAX_INT, -1 * MAX_INT], [-1 * MAX_INT + 1, -1 * MAX_INT + 1]]
        }]
    }
);
//////
series.push(
    {
        name:'分层统计',
        type:'funnel',
            left: 5,//'10%',
            zlevel: 2,
            top: 5,
            //x2: 80,
            // bottom: 60,
            width: 60,//'80%',
            height: 100,
            // height: {totalHeight} - y - y2,
            min: 0,
            max: 100,
            minSize: '0%',
            maxSize: '100%',
            funnelAlign: 'left',
            sort: 'descending',
            gap: 2,
            label: {
                normal: {
                    show: true,
                    position: 'right'//'inside'
                },
                emphasis: {
                    textStyle: {
                        fontSize: 5
                    }
                }
            },
            labelLine: {
                normal: {
                    length: 10,
                    lineStyle: {
                        width: 1,
                        type: 'solid'
                    }
                }
            },
            itemStyle: {
                normal: {
                    borderColor:  backgroundColor_rgb, //backgroundColor, //'#fff',
                    borderWidth: 1
                }
            },
            data: [
                {value: 60, name: '访问'},
                {value: 30, name: '咨询'},
                {value: 10, name: '订单'},
                {value: 90, name: '点击'},
                {value: 100, name: '展现'}
            ],
            tooltip: {
                trigger: 'item', // '{a}': series name, '{b}': data item name, '{c}': data item value
                formatter: "{a} <br/>{b} : {c}%"
            },
            color: colorSet
        }
);

option = {
    backgroundColor: backgroundColor,
    tooltip : {
        trigger: 'item',
    },
    legend: {
        orient: 'vertical',
        top: 'bottom',
        left: 'right',
        // ECharts 提供的标记类型包括 'circle', 'rect', 'roundRect', 'triangle', 'diamond', 'pin', 'arrow'
        // 也可以通过 'image://url' 设置为图片，其中 url 为图片的链接。
        data:[
            {name: '用户交互项目', icon: 'circle', textStyle: {color: 'yellow'}}, 
            {name: '用户行为轨迹', icon: 'circle', textStyle: {color: 'yellow'}}, 
            {name: '分层统计', icon: 'roundRect'} // '漏斗图'
        ],

        textStyle: {
            color: '#fff'
        },
        selectedMode: 'multiple', //'single'
        selected: {
            '用户交互项目': true,
            '用户行为轨迹': true,
            '分层统计': true
        },
        // 使用字符串模板，模板变量为图例名称 {name}
        // formatter: 'Legend {name}'
        // 使用回调函数
        
        formatter: function (dat) {
            // console.log(dat)
            return dat;//'Legend ' + dat;
        }
        // show: false
    },
    geo: {
        map: 'coordinateMap',
        // show: false, // hide map will stop zooming
        label: {
            emphasis: {
                show: false
            }
        },
        roam: true,
        silent: true,
        itemStyle: {
            normal: {
                areaColor: backgroundColor,
                borderColor: backgroundColor
            },
            emphasis: {
                areaColor: backgroundColor
            }
        }
    },
    series: series
};

function obj_clone(obj) {
    // Handle the 3 simple types, and null or undefined
    if (null == obj || "object" != typeof obj) return obj;

    // Handle Date
    if (obj instanceof Date) {
        var copy = new Date();
        copy.setTime(obj.getTime());
        return copy;
    }

    // Handle Array
    if (obj instanceof Array) {
        var copy = [];
        for (var i = 0, len = obj.length; i < len; ++i) {
            copy[i] = obj_clone(obj[i]);
        }
        return copy;
    }

    // Handle Object
    if (obj instanceof Object) {
        var copy = {};
        for (var attr in obj) {
            if (obj.hasOwnProperty(attr)) copy[attr] = obj_clone(obj[attr]);
        }
        return copy;
    }

    throw new Error("Unable to copy obj! Its type isn't supported.");
}

if (option && typeof option === "object") {
    myChart.setOption(option, true);
    // console.log(myChart)
    myChart.on('click', function (params) {
        // console.log(params);
        // console.log(params.seriesIndex)
        //console.log(series[params.seriesIndex].data[params.dataIndex]);
        // console.log(params.seriesIndex, params.dataIndex);
        if (toggle) {
            // console.log("toggle true")
            option.series = series;
            myChart.setOption(option, true)
            toggle = false;
        }
        else {
            //
            var tmp_series = obj_clone(series);
            var tmp_item = obj_clone(tmp_series[params.seriesIndex].data[params.dataIndex]);
            tmp_series[params.seriesIndex].data = [tmp_item];
            option.series = tmp_series;
            // console.log(option.series)
            myChart.setOption(option, true);
            toggle = true;
        }
    });
}