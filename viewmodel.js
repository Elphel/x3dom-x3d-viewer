/** @licstart  The following is the entire license notice for the
 *  JavaScript code in this page.
 *
 *   Copyright (C) 2017 Elphel Inc.
 *   Author: Oleg Dzhimiev <oleg@elphel.com>
 *   Desctiption: x3d viewer
 *
 *   The JavaScript code in this page is free software: you can
 *   redistribute it and/or modify it under the terms of the GNU
 *   General Public License (GNU GPL) as published by the Free Software
 *   Foundation, either version 3 of the License, or (at your option)
 *   any later version.  The code is distributed WITHOUT ANY WARRANTY;
 *   without even the implied warranty of MERCHANTABILITY or FITNESS
 *   FOR A PARTICULAR PURPOSE.  See the GNU GPL for more details.
 *
 *   As additional permission under GNU GPL version 3 section 7, you
 *   may distribute non-source (e.g., minimized or compacted) forms of
 *   that code without the copy of the GNU GPL normally required by
 *   section 4, provided you include this license notice and a URL
 *   through which recipients can access the Corresponding Source.
 *
 *  @licend  The above is the entire license notice
 *  for the JavaScript code in this page.
 */

var model = "Undefined";
var NSN = "m";
var elphel_wiki_prefix = "http://wiki.elphel.com/index.php?search="
var nobuttons = false;
var nocontrols = false;
var notitle = false;
var nodocs = false;
var animate = false;
var settings_file = "settings.xml";
var path = "";
var inherited_parameters = "";

var screen_ratio = 1;//w/h
var zoom = 0.9;

var undo = Array();

$(function(){
  prerun();
  resize();
});

function resize(){
    //console.log("resize");
    var w = $(window).width();
    var h = $(window).height();
    if (w>h){
        $("#main").css({width:(Math.round(h*screen_ratio)-10)+"px",height:(h-10)+"px"});
        $("#x3d_canvas").css({width:(Math.round(h*screen_ratio)-10)+"px",height:(h-10)+"px"});
        $("#bom").css({left:(Math.round(h*screen_ratio))+"px"});
        //$("#thrd").css({left:(h-107)+"px"});
    }else{
        $("#main").css({width:(w-10)+"px",height:(Math.round(w/screen_ratio)-10)+"px"});
        $("#x3d_canvas").css({width:(w-10)+"px",height:(Math.round(w/screen_ratio)-10)+"px"});
        $("#bom").css({left:(w)+"px"});
        //$("#thrd").css({left:(w-107)+"px"});
    }
    $("#title").css({
        left: ($("#main").width()/2-$("#title").width()/2)+"px",
    });

    $("#webgl_error").css({
        top:($("#main").height()/2-$("#webgl_error").height()/2)+"px"
    });

}

var resizeTimer;

var moveTimeSet = 0;
var moveTimeStamp = 0;

var showdefault = 0;

var block_load_events = false;

// init helper counter
var showall = 1;

function x3d_model_add_to_DOM(){

    //create and init x3d canvas
    var x3d_cnv = $("<x3d>",{
        id:"x3d_canvas",width:"700px",height:"600px",showLog:"false"
    }).css({
        position:"absolute",
        border: "1px solid gray",
        "border-radius": "2px",
        outline: "none"
    }).addClass("nooutline");

    $("#main").prepend(x3d_cnv);

    /*
    x3d_cnv.click(function(){
        console.log("Temporary disable stop_animation() call");
        //stop_animation();
    });
    */

    var x3d_cnv_ni = $("<navigationinfo>",{id:"navi",type:"'examine' 'any'",speed:"1",headlight:"true"});

    var x3d_cnv_vp = $("<Viewpoint>").attr("fieldOfView","0.200");

    var x3d_cnv_in = $("<inline>",{
        id:"topinline",
        nameSpaceName:NSN,
        url: model
    });

    var x3d_cnv_trans = $("<Transform id='anima' DEF='ball'>");
    x3d_cnv_trans.append(x3d_cnv_in);

    var scene = $("<Scene>");
    scene.append(x3d_cnv_trans);
    x3d_cnv.append(scene);

    // Load settings if exist
    var settings = $("<div>").load(settings_file,function(response,status,xhr){
        if (xhr.status==200){
            var xml = $.parseXML(response);
            x3d_cnv_ni = $(xml).find("NavigationInfo");
            x3d_cnv_vp = $(xml).find("Viewpoint");
            showdefault = 1;
        }
        scene.prepend(x3d_cnv_vp).prepend(x3d_cnv_ni);
    });

    // resize?!
    $("#main").css({
        position:"absolute",
        width: x3d_cnv.width()+"px",
        height: x3d_cnv.height()+"px"
    });

}

function prerun(){
    $(window).resize(function(){
        clearTimeout(resizeTimer);
        resizeTimer = window.setTimeout(resize(),250);
    });

    //"model" and some other parameters
    parseURL();

    x3d_model_add_to_DOM();

    //load x3dom.js
    //$.getScript("x3dom-1.7.0/x3dom.debug.js",function(){
    //$.getScript("http://x3dom.org/download/1.7.1/x3dom.js");
    //$.getScript("http://x3dom.org/download/1.7/x3dom.js",function(){
    //$.getScript("x3dom-1.7.0/x3dom-full.debug.js",function(){
    $.getScript("x3dom-1.7.2/x3dom-full.debug.js",function(){
        x3dom.runtime.ready = function() {
            //x3dom.caps.BACKEND
            if (x3dom.caps.BACKEND!="webgl"){
                x3dom_error();
            }else{
                var x3dom_element = document.getElementById("x3d_canvas");
                x3dom_element.runtime.enterFrame = function() {
                    x3dom_enter_frame();
                };
            }
        };
    });

    //help
    init_help($("#main"));

    //info popup
    var info = $("<div>",{id:"info"}).css({
        position:"absolute",
        bottom:"3px",
        right:"3px",
        "border-radius":"2px",
        border: "1px solid gray",
        color:"white",
        "font-size":"1.2em",
        padding:"10px 10px 10px 10px",
        background:"rgba(50,50,50,0.9)",
        display:"none"
    });

    $("#main").append(info);

    rst_model = $("<button>",{id:"reset_model"}).addClass("btn-my btn nooutline").html("reset model").css({
        position: "absolute",
        top: "3px",
        left: "3px",
        cursor:"pointer"
    });

    rst_model.click(function(){
        model_run_cmd("reset","reset");
        btn_subpart_enableAll();
        model_init();
        //element.runtime.showAll("negY");
        //if (showdefault) element.runtime.resetView();
        //element.runtime.resetView();
        if (animate) {
            stop_animation();
            start_animation();
        }
    });

    $("#main").append(rst_model);

    undo_model = $("<button>",{id:"undo_model",title:"undo (for hidden elements)"}).addClass("btn-my btn nooutline").html("<b>&lt;</b>").css({
        position: "absolute",
        top: "3px",
        left: "105px",
        cursor:"pointer"
    });

    undo_model.click(function(){
        model_run_cmd(undo[undo.length-1],"click-int-all");
        undo.pop();
    });

    $("#main").append(undo_model);

    $("#thrd").css({
        position:"absolute",
        top: "3px",
        right: "27px"
    });

    var element = document.getElementById('x3d_canvas');

    $("#v1").css({cursor:"pointer"}).click(function(){element.runtime.showAll("posX");});
    $("#v2").css({cursor:"pointer"}).click(function(){element.runtime.showAll("negX");});

    $("#v3").css({cursor:"pointer"}).click(function(){element.runtime.showAll("posY");});
    $("#v4").css({cursor:"pointer"}).click(function(){element.runtime.showAll("negY");});

    $("#v5").css({cursor:"pointer"}).click(function(){element.runtime.showAll("posZ");});
    $("#v6").css({cursor:"pointer"}).click(function(){element.runtime.showAll("negZ");});

    $("#v7").css({cursor:"pointer"}).click(function(){element.runtime.resetView();});

    if (nocontrols) {
        undo_model.css({display:"none"});
        rst_model.css({display:"none"});
        hlp.css({display:"none"});
        $("#thrd").css({display:"none"});
    }

    var index = model.lastIndexOf("/");
    var model_pn = model.substr(index+1);
    model_pn = model_pn.slice(0,-4);

    var pn_title = $("<div>",{id:"title"}).css({
        position:"absolute",
        "border-radius":"2px 2px 2px 2px",
        border: "1px solid gray",
        color:"white",
        "font-size":"1.2em",
        padding:"10px 10px 10px 10px",
        background:"rgba(50,50,50,0.9)"
    }).html(model_pn);

    $("#main").append(pn_title);

    pn_title.css({
        top: "0px",
        left: ($("#main").width()/2-pn_title.width()/2)+"px",
    });

    if (notitle){
        pn_title.css({display:"none"});
    }

}

function model_init(){
    removeBOM();
    showBOM();
    resize();
    unbindCanvas();
    bindCanvas();
}

function removeBOM(){
    var top = $("#topinline");
    top.find("Inline").off("click");
    top.find("button").off("click");
    top.find("a").off("click");
    $("#bom").remove();
}

function place_camera(){
    console.log("place camera");
    var top = $("#topinline");
    //get top boundary box position
    var top_groups = top.find("Group");

    if (top_groups.length>0){
        var top_group = $(top_groups[0]);
        var top_bboxcenter = top_group.prop('bboxCenter');
        top_bboxcenter = top_bboxcenter.split(" ");
        var top_bboxsize = top_group.prop('bboxSize');
        top_bboxsize = top_bboxsize.split(" ");

        console.log("Top group bboxcenter is at");
        console.log(top_bboxcenter);

        top_group.parent().prop("translation",(-top_bboxcenter[0])+" "+(-top_bboxcenter[1])+" "+(-top_bboxcenter[2]));

        //var fov = $("Viewpoint").attr("fieldOfView");
        var fov = $("Viewpoint").prop("fieldOfView");

        console.log("field of view is "+fov);

        //(top_bboxsize[1]/2) / l = tg a/2
        fov=fov*zoom;
        var phi = -0.7;

        var boxsize;

        console.log(top_bboxsize);
        boxsize = 0;
        for(var k=0;k<top_bboxsize.length;k++){
            if (parseFloat(top_bboxsize[k])>boxsize) boxsize = parseFloat(top_bboxsize[k]);
        }

        //boxsize = Math.max(...top_bboxsize);

        var view_distance = (boxsize/2)/Math.tan(fov/2);

        var view_elevation = view_distance*Math.tan(phi);

        //$("Viewpoint").attr("position","0 "+view_distance+" 0");
        //$("Viewpoint").attr("orientation","-1 0 0 1.57080");
        console.log(view_distance+" "+view_elevation+" "+phi);

        $("Viewpoint").attr("position","0 "+view_distance+" "+(view_elevation));
        $("Viewpoint").attr("orientation","-1 0 0 "+(Math.PI/2-phi));
        showdefault = true;

        var element = document.getElementById('x3d_canvas');
        if (showdefault) element.runtime.resetView();

        var x3d_cnv_ni = $("NavigationInfo");
        x3d_cnv_ni.prop("speed",Math.round(Math.sqrt(view_distance)/5));
        console.log("speed is "+x3d_cnv_ni.prop("speed"));
    }
}

function showBOM(){
    console.log("showBOM");
    //var bom = $("<ul>",{id:"bom",class:"list-group"}).css({
    var bom = $("<table>",{id:"bom"}).css({
        position:"absolute",
        top:"5px",
        left:"105px"
    });

    if (nobuttons){
        bom.css({
            display:"none"
        });
    }

    $("body").append(bom);

    var top = $("#topinline");

    //upper case was important
    var parts_unique = top.find("Inline");
    //remove the first element -  because of the specific model structure?
    parts_unique.splice(0,1);
    //console.log("Unsorted");
    //console.log(parts_unique);
    parts_unique.sort(function(a,b){
        a = $(a).prop("nameSpaceName");
        b = $(b).prop("nameSpaceName");
        if(a > b) {
            return 1;
        } else if(a < b) {
            return -1;
        } else {
            return 0;
        }
    });

    var bomtr_counter=0;
    var bomtr_subcounter=0;

    //console.log("Sorted");
    //console.log(parts_unique);

    //set default transparency?
    parts_unique.find("Material").attr("transparency",0.1);
    parts_unique.find("Material").prop("transparency",0.1);

    parts_unique.find("Material").attr("shininess",0.5);
    parts_unique.find("Material").prop("shininess",0.5);

    parts_unique.find("Material").attr("specularColor","0.2 0.2 0.2");
    parts_unique.find("Material").prop("specularColor","0.2 0.2 0.2");

    var prev_nsn_group="";
    var odd_group_en = false;

    parts_unique.each(function(i){
        var part = $(this);
        var tmp_nsn = this.getAttribute("nameSpaceName");
        tmp_nsn_arr = tmp_nsn.split("-");
        tmp_nsn_group = tmp_nsn_arr[0]+"-"+tmp_nsn_arr[1];
        if (prev_nsn_group=="") prev_nsn_group = tmp_nsn_group;
        if (prev_nsn_group!=tmp_nsn_group) odd_group_en=!odd_group_en;
        //find secondary appearances

        if (odd_group_en){
            //odd_group = "btn-odd-success";
            odd_group = "";
        }else{
            odd_group = "";
        }

        var sublist = top.find("[USE="+tmp_nsn+"]");
        var ele_sublist = "";

        var btn_subpart = false;

        ele_ul = $("<ul>",{class:"dropdown-menu","data-toggle":"dropdown"}).css({padding:"10px","min-width":"100px",border:"1px solid rgba(50,50,50,0.5)"});
        btn_part = $("<button>",{class:"btn-part btn btn-default btn-sm btn-success "+odd_group}).css({"min-width":"100px"}).html(tmp_nsn);

        btn_part.css({background:getColorByNSN(tmp_nsn)});

        btn_part.attr("odd",odd_group_en);
        btn_part.attr("nsn",tmp_nsn);
        btn_part.attr("state","normal");

        prev_nsn_group = tmp_nsn_group;

        ele_sublist = $("<div>",{class:"btn-group"}).append(btn_part).append(
                $("<button>",{class:"dropdown-toggle btn btn-default btn-sm nooutline",
                    "data-toggle":"dropdown",
                    "aria-haspopup":"true",
                    "aria-expanded":"false"
                }).append(
                    $("<span>",{class:"caret"})
                ).append(
                    $("<span>",{class:"sr-only"}).html("Toggle Dropdown")
                )
            );
        ele_sublist.attr("blockpropagation",false);

        //toggle all button
        btn_subpart = $("<button>",{class:"btn-subpart btn btn-default btn-sm btn-success",title:"Toggle all"}).css({width:"40px"}).html("all");
        btn_subpart.attr("index",sublist.length);
        btn_subpart.attr("nsn",tmp_nsn);
        btn_subpart.attr("selected",true);

        //btn_subpart.click(function(){btn_subpart_click_all($(this),ele_sublist);});
        btn_subpart.click(function(e){
            model_run_cmd(tmp_nsn,"click-int-all");
            e.stopPropagation();
        });

        btn_link_open = $("<a>",{href:"?"+inherited_parameters+"model="+path+"/"+tmp_nsn+".x3d",class:"btn btn-default btn-sm",title:"Open in new window"}).html("<span class=\"glyphicon glyphicon-open\" aria-hidden=\"true\"></span>").css({padding:"7px 13px 7px 13px",margin:"6px 0px 6px 6px"});

        btn_link_open.click(function(e){
            window.location.href = $(this).attr('href');
        });

        btn_link_to_wiki = $("<a>",{href:elphel_wiki_prefix+"\""+tmp_nsn+"\"&fulltext=Search",class:"btn btn-default btn-sm",title:"Elphel Wiki docs"}).html("<span class=\"glyphicon glyphicon-book\" aria-hidden=\"true\"></span>").css({padding:"7px 13px 7px 13px",margin:"6px"});

        btn_link_to_wiki.click(function(e){
            window.location.href = $(this).attr('href');
        });

        ele_ul.append($("<li>").append(btn_subpart.css({display:"inline"}))
                               .append(btn_link_open.css({display:"inline"}))
                               .append(btn_link_to_wiki.css({display:"inline"}))
                               .css({padding:"3px","min-width":"100px",width:"150px"}));

        //build a list for unique and multiple parts
        for(var j=0;j<=sublist.length;j++){
            btn_subpart = $("<button>",{class:"btn-subpart btn btn-default btn-sm btn-success",title:"Toggle element"}).css({width:"40px"}).html(j+1);
            btn_subpart.attr("index",j);
            //btn_subpart.attr("maxindex",sublist.length);
            btn_subpart.attr("nsn",tmp_nsn);
            btn_subpart.attr("selected",true);
            btn_subpart.click(function(){btn_subpart_click($(this),ele_sublist);});

            if (j%5==0) {
                list_el = $("<li>").css({padding:"3px","min-width":"100px",width:"237px"});
                ele_ul.append(list_el);
            }
            list_el.append(btn_subpart.css({display:"inline",margin:"0px 6px 0px 0px"}));
        }

        ele_sublist.click(function(e){
            if ($(this).attr("blockpropagation")=="true") {
                e.stopPropagation();
            }
            $(this).attr("blockpropagation",false);
        });
        ele_sublist.append(ele_ul);

        //var ele = $("<li>",{class:"list-group-item"}).append($(ele_sublist));
        var ele = $("<td>").css({padding:"2px 5px 2px 0px"}).append($(ele_sublist));

        /*
        if(i%3==0){
            bomtr = $("<tr>");
            bom.append(bomtr);
            console.log(bom.height()+" vs "+$("#main").height());
        }
        */
        if (bom.height()<=($("#main").height()-30)){
            bomtr_counter++;
            bomtr = $("<tr id='bomtr_"+bomtr_counter+"'>");
            bomtr_subcounter=0;
            bom.append(bomtr);
        }else{
            bomtr_subcounter++;
            bomtr = $("#bomtr_"+bomtr_subcounter);
            //console.log("Adding to tr #"+bomtr_subcounter);
            if (bomtr_subcounter==bomtr_counter){
                bomtr_subcounter=0;
            }
        }
        bomtr.append(ele);

        btn_part.click(function(){
            model_run_cmd(tmp_nsn,"click-ext");
        });
    });
}

var blockclick = false;

function unbindCanvas(){
    $("Switch").off("mousedown").off("mousemove").off("click");
    var canvas = document.getElementById("x3d_canvas");
    canvas.removeEventListener("touchstart",touchstarted,false);
    canvas.removeEventListener("touchmove",touchmoved,false);
    canvas.removeEventListener("mousedown", mousestarted,false);
    canvas.removeEventListener("mousemove", mousemoved,true);  //does not work with false
    canvas.removeEventListener("mouseup",   mouseended,true);
    canvas.removeEventListener("mouseleave",mouseleft,false);
    canvas.removeEventListener("touchend",  mouseended,false);
    canvas.removeEventListener("touchcancel",  touchcanceled,false);
}

function bindCanvas(){
    //whichChoice for Group tag didn't work
    //$("Switch").on("mousedown").on("mousemove").on("click");

    $("Switch").each(function(){
        var hmm = $(this);
        var id = hmm.attr("id");
        var pn_arr = id.split(/[_:]/);
        var pn = pn_arr[pn_arr.length-2];
        $(this).attr("nsn",pn);
        $(this).attr("state","normal");
    });

    //unblock click
    $("Switch").mousedown(function(){
        blockclick = false;
    });
    //block click is the model was rotated
    $("Switch").mousemove(function(e){
        //alert(e.which);
        if (e.which==1) {
            blockclick = true;
        }
    });

    var canvas = document.getElementById("x3d_canvas");
    canvas.addEventListener("touchstart",touchstarted,false);
    canvas.addEventListener("touchmove", touchmoved,false);
    canvas.addEventListener("mousedown", mousestarted,false);
    canvas.addEventListener("mousemove", mousemoved,true);  //does not work with false
    canvas.addEventListener("mouseleave", mouseleft,false);
    canvas.addEventListener("mouseup",   mouseended,true);
    canvas.addEventListener("touchend",  mouseended,false);
    canvas.addEventListener("touchcancel",touchcanceled,false);
    console.log("Added event listeners");

    //click
    $("Switch").click(function(event){
        var hmm = $(this);
        var id = hmm.attr("id");
        var pn_arr = id.split(/[_:]/);
        var pn = pn_arr[pn_arr.length-2];
        old_time = switch_click_time;
        switch_click_time = getTimeStamp();
        if (!blockclick){
            if ((switch_click_time-old_time)<400){
                if (event.which==1){
                    if (pn_arr[pn_arr.length-1]=="0") model_run_cmd(pn,"normalize");
                    if (pn_arr[pn_arr.length-1]=="0") model_run_cmd(pn,"right-click");
                }
            }else{
                if (event.which==1){
                    //fighting multiple click events
                    if (pn_arr[pn_arr.length-1]=="0") model_run_cmd(pn,"left-click");
                }
                if (event.which==3){
                    //fighting multiple click events
                    if (pn_arr[pn_arr.length-1]=="0") model_run_cmd(pn,"right-click");
                }
                console.log("The pointer is over "+hmm.attr("id")+", whichChoice="+hmm.attr("whichChoice")+" render="+hmm.attr("render")+" DEF="+hmm.attr("DEF"));
            }
        }
    });
}

var switch_click_time = 0;

function mouseleft(e){
    if (e.which==1){
        console.log("Mouseleft!");
        mouseended(e);
    }
}

function touchcanceled(e){
    console.log("Touchcanceled");
    mouseended(e);
}

var touched_element;

function touchstarted(event){
    stop_animation();
    /*
    var touch = event.touches[0];
    touched_element = document.elementFromPoint(touch.pageX,touch.pageY);
    */
    blockclick = false;
    dragging = false;
    moveTimeStamp = getTimeStamp();
    console.log("touchstarted()");
    move_history=[];
}

function touchmoved(event){
    /*
    var touches = event.touches[0];
    if (touched_element !== document.elementFromPoint(touch.pageX,touch.pageY)) {
        mouseended(event);
    }
    */
    //blockclick = true;
    if ((getTimeStamp()-moveTimeStamp)>100){
        blockclick = true;
    }
    dragging = true;
    move_history.push(getMoveState(event));
    console.log("touchmoved()");
}


var inertial_rot_axis_speed; //  = inertial_rot_axis_speed=[new x3dom.fields.SFVec3f(0,0,1), 0]
var min_move=20; // pixels
var lastRotatedTime;
var minRotationSpeed=0.0001; //rad/msec
var rotationTime = 2000.0; //msec

var moveReleaseTimeLimit = 300;//msec

function getMoveState(event){
    rt=document.getElementById('x3d_canvas').runtime;
    return {
        mousepos:  rt.mousePosition(event),
        timestamp: getTimeStamp(),
        matrix:    rt.viewMatrix()
    };
}

var dragging = false;
var move_history;

function mousestarted(event){
    stop_animation();
    dragging = true;
    move_history=[];
    move_history.push(getMoveState(event));
}

function mousemoved(event){
    if (dragging) {
        move_history.push(getMoveState(event));
    }
}

function mouseended(event){
        dragging = false;
        var last_state=getMoveState(event);

        if (move_history != undefined){

          console.log("mouse ended, history length="+move_history.length);
          // find history snapshot farher than minimal or local best or first
          var last_dist=0;
          var use_index=move_history.length-1;

          for (var i =move_history.length-1;i>=0;i--){
                  dist=Math.sqrt(Math.pow(last_state.mousepos[0]-move_history[i].mousepos[0],2) + Math.pow(last_state.mousepos[1]-move_history[i].mousepos[1],2))
                  if (dist > min_move) {
                          use_index = i;
                  } else if (dist < last_dist){
                          use_index = i + 1;
                  } else if (i==0) {
                          use_index = 0;
                  } else if ((getTimeStamp()-move_history[i].timestamp)>moveReleaseTimeLimit) {
                  } else {
                          last_dist = dist;
                          continue;
                  }
                  break;
          }

          //deltat
          dt = last_state.timestamp - move_history[use_index].timestamp;
          console.log("Using sample #"+i +" behind="+(move_history.length-i)+" dist="+dist+" dt="+(dt/1000)+"s");

          if (dt == 0) {
                  inertial_rot_axis_speed=[new x3dom.fields.SFVec3f(0,0,1),0];
          }else{

              delta_matrix = last_state.matrix.mult(move_history[use_index].matrix.inverse());

              var translation = new x3dom.fields.SFVec3f(0,0,0);
              var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
              var rotation = new x3dom.fields.Quaternion(0,0,1,0);
              var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);
              delta_matrix.getTransform(translation, rotation, scaleFactor, scaleOrientation);

              view_rot_axis_speed=rotation.toAxisAngle();
              view_rot_axis_speed[1] /= dt;

              // Orient first arrow according to rotation  (Z-component will be small)
              //var x_axis = new x3dom.fields.SFVec3f(1,0,0);
              //var x_arrow_q=x3dom.fields.Quaternion.rotateFromTo(new x3dom.fields.SFVec3f(1,0,0), view_rot_axis_speed[0]);
              //var x_arrow_aa=x_arrow_q.toAxisAngle();
              //document.getElementById("trans_X-ARROW").setAttribute("rotation",x_arrow_aa[0].toString()+" "+x_arrow_aa[1]);
              // Orient second arrow according to rotation  (Z-component will be small)

              var world_rot_axis=last_state.matrix.inverse().multMatrixVec(view_rot_axis_speed[0]);

              //var x1_arrow_aa=x3dom.fields.Quaternion.rotateFromTo(new x3dom.fields.SFVec3f(1,0,0), world_rot_axis).toAxisAngle();
              //document.getElementById("trans_X-ARROW").setAttribute("rotation",x1_arrow_aa[0].toString()+" "+x1_arrow_aa[1]);

              lastRotatedTime = getTimeStamp();
              inertial_rot_axis_speed = [world_rot_axis, view_rot_axis_speed[1]];
          }
          console.log("rotation axis:"+inertial_rot_axis_speed[0].toString()+", angular_velocity="+(1000*inertial_rot_axis_speed[1])+" rad/s");

          inertial_rotate();

        }

}

var animation_array;
var fraction = 100;
var halflife = 2000;

function inertial_rotate(){
    if (!dragging && inertial_rot_axis_speed && (inertial_rot_axis_speed[1]>=minRotationSpeed)) {

        rotationTime = halflife;
        tq = fraction;

        animation_array = [];
        dt = 0;//ms
        animation_en = true;
        animation_duration = 0;//==5000ms

        var am = document.getElementById('x3d_canvas').runtime.getCurrentTransform(document.getElementById("anima"));

        var ts0 = getTimeStamp();
        //console.log(ts0);

        while(animation_en){
            inertial_rot_axis_speed[1] *= Math.exp(-tq/rotationTime);
            //console.log("Rotation Speed "+inertial_rot_axis_speed[1]+" dt="+dt);
            q=x3dom.fields.Quaternion.axisAngle(inertial_rot_axis_speed[0],inertial_rot_axis_speed[1]*tq);
            rm = new x3dom.fields.SFMatrix4f();
            rm.setRotate(q);

            var translation = new x3dom.fields.SFVec3f(0,0,0);
            var scaleFactor = new x3dom.fields.SFVec3f(1,1,1);
            var rotation = new x3dom.fields.Quaternion(0,0,1,0);
            var scaleOrientation = new x3dom.fields.Quaternion(0,0,1,0);
            am.getTransform(translation, rotation, scaleFactor, scaleOrientation);
            aa= rotation.toAxisAngle();

            var tmp_key = dt;
            var tmp_keyvalue = aa[0].toString()+" "+aa[1];

            am = rm.mult(am);

            animation_array.push([tmp_key,tmp_keyvalue]);

            //if (dt==animation_duration) animation_en = false;
            if (inertial_rot_axis_speed[1]<=minRotationSpeed) {
                animation_en = false;
                animation_duration = dt;
                /*
                for(var i=0;i<animation_array.length;i++){
                    animation_array[i][0] /= animation_duration;
                }
                */
                //console.log("Animation duration will be "+(animation_duration/1000));
                //console.log(animation_array);
            }
            dt += tq;
            //animation_duration += tq;
        }

        var ts1 = getTimeStamp();

        //find index
        var keyStr = "";
        var keyValueStr = "";
        var calc_index = Math.ceil((ts1-ts0)/tq);

        animation_duration = animation_duration - calc_index*tq;

        for(var i=calc_index;i<animation_array.length;i++){
            keyStr += " "+(animation_array[i][0]/animation_duration);
            keyValueStr += " "+animation_array[i][1];
        }

        var ts = "<timeSensor DEF='time' cycleInterval='"+((animation_duration/1000))+"' loop='false' enabled='true' startTime='"+(getTimeStamp()/1000)+"'></timeSensor>\n";
        var oi = "<orientationInterpolator DEF='move' key='"+keyStr+"' keyValue='"+keyValueStr+"'></orientationInterpolator>\n";
        var r1 = "<Route fromNode='time' fromField ='fraction_changed' toNode='move' toField='set_fraction'></Route>\n";
        var r2 = "<Route fromNode='move' fromField ='value_changed' toNode='ball' toField='set_rotation'></Route>\n";

        var x3d_cnv_anim = $(ts+oi+r1+r2);

        $("#anima").append(x3d_cnv_anim);
        $("timeSensor").attr("enabled",true);
    }
}

function stop_animation(){
    $("timeSensor").remove();
    $("orientationInterpolator").remove();
    $("Route").remove();
}

function start_animation(){
    console.log("restart animation");
    var ts = "<timeSensor DEF='time' cycleInterval='50' loop='true'></timeSensor>\n";
    var oi = "<orientationInterpolator DEF='move' key='0 0.5 1' keyValue='0 0 1 0 0 0 1 3.14159 0 0 1 6.28317'></orientationInterpolator>\n";
    var r1 = "<Route fromNode='time' fromField ='fraction_changed' toNode='move' toField='set_fraction'></Route>\n";
    var r2 = "<Route fromNode='move' fromField ='value_changed' toNode='ball' toField='set_rotation'></Route>\n";
    var x3d_cnv_anim = $(ts+oi+r1+r2);
    $("#anima").append(x3d_cnv_anim);
}

function getTimeStamp(){
    var d = new Date();
    return d.getTime();
}

function update_info(name,state,cmd){
    $("#info").empty().css({display:"none"});
    switch(cmd){
        case "left-click":
            if ((state=="normal")){
                var pn = $("<span>").html(name);
                var open_btn = $("<a>",{
                    id:"info_open",
                    title:"open part in a new window",
                    class:"btn btn-default btn-sm nooutline"
                }).attr("nsn",name).html("<span class=\"glyphicon glyphicon-open\" aria-hidden=\"true\"></span>").css({
                    padding: "8px 11px 7px 11px",
                    margin: "0px 0px 0px 10px"
                });

                open_btn.attr("href","?"+inherited_parameters+"model="+path+"/"+name+".x3d");

                var wiki_btn = $("<a>",{
                    id:"info_wiki",
                    title:"look for part in Elphel wiki",
                    class:"btn btn-default btn-sm nooutline"
                }).attr("nsn",name).html("<span class=\"glyphicon glyphicon-book\" aria-hidden=\"true\"></span>").css({
                    padding: "8px 11px 7px 11px",
                    margin: "0px 0px 0px 10px"
                });

                wiki_btn.attr("href",elphel_wiki_prefix+"\""+name+"\"&fulltext=Search");

                var hide_btn = $("<button>",{
                    id:"info_hide",
                    title:"hide parts",
                    class:"btn btn-default btn-danger btn-sm nooutline"
                }).attr("nsn",name).html("<span class=\"glyphicon glyphicon-remove\" aria-hidden=\"true\"></span>").css({
                    padding: "8px 11px 7px 11px",
                    margin: "0px 0px 0px 10px"
                });

                hide_btn.click(function(){
                    model_run_cmd(name,"info-hide-click");
                });

                $("#info").append(pn).append($("<span>").append(open_btn));
                if (!nodocs) $("#info").append($("<span>").append(wiki_btn));
                $("#info").append($("<span>").append(hide_btn)).css({display:""});
            }
            break;
        case "click-ext":
            update_info(name,"normal","left-click");
            break;
        case "normalize0.9":
            update_info(name,"normal","left-click");
            break;
        default: return false;
    }
}

function model_run_cmd(name,cmd){
	//undo = $.data(document.body, "main");
	//undo = $("#x3d_canvas").clone();
    var state = "";
    if (name!="reset"){
        state = $("Switch[nsn="+name+"]").attr("state");
        update_info(name,state,cmd);
    }
    switch(cmd){
        case "right-click":
            //save to undo
            undo[undo.length]=name;
            //update status to "disabled"
            $("Switch[nsn="+name+"]").attr("state","disabled");
            //whichChoice -1
            $("Switch[nsn="+name+"]").attr("whichChoice",-1);
            //ext buttons - white
            $(".btn-part[nsn="+name+"]").css({background:"","font-weight":"normal"});
            $(".btn-part[nsn="+name+"]").removeClass("btn-success")
                                        .removeClass("btn-primary").css({opacity:"1.0"});
            if ($(".btn-part[nsn="+name+"]").attr("odd")=="true"){
                $(".btn-part[nsn="+name+"]").removeClass("btn-odd-success");
            }
            //int buttons - white
            $(".btn-subpart[nsn="+name+"]").removeClass("btn-success");

            //other buttons - untouched
            break;
        case "left-click":
            if (state=="normal"){
                //other buttons - deselect!

                //other states to normal
                //make others who are visible - almost transparent
                model_run_cmd(name,"normalize0.9");
                //update status to "selected"
                $("Switch[nsn="+name+"]").attr("state","selected");
                $("Switch[nsn="+name+"]").find("Material").attr("transparency",0.0);
                //ext button - blue
                $(".btn-part[nsn="+name+"]").css({background:"","font-weight":"bold"});
                $(".btn-part[nsn="+name+"]").addClass("btn-primary").removeClass("btn-success").css({opacity:"1.0"});
                if ($(".btn-part[nsn="+name+"]").attr("odd")=="true"){
                    $(".btn-part[nsn="+name+"]").removeClass("btn-odd-success");
                }
                //int buttons - green
                $(".btn-subpart[nsn="+name+"]").addClass("btn-success");
            }
            if ((state=="selected")||(state=="superselected")){
                model_run_cmd(name,"normalize");
            }
            break;
        case "click-int-all":
            if (state=="disabled"){
                //update status to "normal"
                $("Switch[nsn="+name+"]").attr("state","normal");
                //whichChoice 0
                $("Switch[nsn="+name+"]").attr("whichChoice",0);
                //ext button - green

                $(".btn-part[nsn="+name+"]").css({background:getColorByNSN(name),"font-weight":"normal"});
                $(".btn-part[nsn="+name+"]").addClass("btn-success");
                if ($(".btn-part[nsn="+name+"]").attr("odd")=="true"){
                    $(".btn-part[nsn="+name+"]").addClass("btn-odd-success");
                }
                //int buttons - green
                $(".btn-subpart[nsn="+name+"]").addClass("btn-success");
                //other buttons - untouched
            }else{
                //update status to "disabled"
                //whichChoice = -1
                //ext button - white
                //int buttons - white
                //other buttons - untouched
                model_run_cmd(name,"right-click");
            }
            break;
        case "click-ext":
            //disbled, whichChoice=-1?
            if (state=="disabled"){
                //update status to "selected"
                //whichChoice = 0
                //ext button - "blue"
                //int buttons - "green"
                //other buttons
                    //whichChoice = -1?
                        //do not touch
                    //else?
                        //selected?
                            //to normal == green
                model_run_cmd(name,"click-int-all");
            }
            if (state=="selected"){
                //others - switch to normal, make transparent
                $("Switch").each(function(){
                    $(this).find("Material").attr("transparency",1.0);
                    if ($(this).attr("state")=="selected") {
                        $(this).attr("state","normal");
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({background:getColorByNSN($(this).attr("nsn")),"font-weight":"normal"});
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").removeClass("btn-primary");
                        if ($(".btn-part[nsn="+$(this).attr("nsn")+"]").attr("odd")=="true"){
                            $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-odd-success");
                        }
                    }
                    if ($(this).attr("state")!="disabled") $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({opacity:"0.5"});
                });

                $("Switch[nsn="+name+"]").attr("state","superselected");
                $("Switch[nsn="+name+"]").find("Material").attr("transparency",0.0);

                $(".btn-part[nsn="+name+"]").css({background:"","font-weight":"bold"});
                $(".btn-part[nsn="+name+"]").removeClass("btn-success").addClass("btn-primary").css({opacity:"1.0"});
                if ($(".btn-part[nsn="+name+"]").attr("odd")=="true"){
                    $(".btn-part[nsn="+name+"]").removeClass("btn-odd-success");
                }
                    //selected?
                        // superselected
                        // update status to superselected
                        // all white? but not permanent? transparent?

                //superselected?
                        // update status to normal
                        // all normal?

                //normal?
                        // update status to selected
                        // all normal?
            }
            if (state=="normal"){
                model_run_cmd(name,"left-click");
            }
            if (state=="superselected"){
                $("Switch").each(function(){
                    $(this).find("Material").attr("transparency",0.1);
                    if (($(this).attr("state")=="selected")||($(this).attr("state")=="superselected")) {
                        $(this).attr("state","normal");
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({background:getColorByNSN($(this).attr("nsn")),"font-weight":"normal"});
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").removeClass("btn-primary");
                        if ($(".btn-part[nsn="+$(this).attr("nsn")+"]").attr("odd")=="true"){
                            $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-odd-success");
                        }
                    }
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({opacity:"1.0"});
                });
                model_run_cmd(name,"click-int-all");
            }
            break;
            case "info-hide-click":
                model_run_cmd(name,"normalize");
                model_run_cmd(name,"right-click");
            break;
        case "normalize":
            $("Switch").each(function(){
                $(this).find("Material").attr("transparency",0.1);
                if (($(this).attr("state")=="selected")||($(this).attr("state")=="superselected")){
                    $(this).attr("state","normal");
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({background:getColorByNSN($(this).attr("nsn")),"font-weight":"normal"});
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").removeClass("btn-primary");
                    if ($(".btn-part[nsn="+$(this).attr("nsn")+"]").attr("odd")=="true"){
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-odd-success");
                    }
                }
                $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({opacity:"1.0"});
            });
            break;
        case "normalize0.9":
            $("Switch").each(function(){
                $(this).find("Material").attr("transparency",0.9);
                if (($(this).attr("state")=="selected")||($(this).attr("state")=="superselected")){
                    $(this).attr("state","normal");
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({background:getColorByNSN($(this).attr("nsn")),"font-weight":"normal"});
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").removeClass("btn-primary");
                    if ($(".btn-part[nsn="+$(this).attr("nsn")+"]").attr("odd")=="true"){
                        $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-odd-success");
                    }
                }
                $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({opacity:"1.0"});
            });
            break;
        case "reset":
            $("Switch").each(function(){
                $(this).attr("whichChoice",0);
                $(this).find("Material").attr("transparency",0.1);
                $(this).attr("state","normal");
                $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({background:getColorByNSN($(this).attr("nsn")),"font-weight":"normal"});
                $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").removeClass("btn-primary");
                if ($(".btn-part[nsn="+$(this).attr("nsn")+"]").attr("odd")=="true"){
                    $(".btn-part[nsn="+$(this).attr("nsn")+"]").addClass("btn-odd-success");
                }
                $(".btn-part[nsn="+$(this).attr("nsn")+"]").css({opacity:"1.0"});
                $(".btn-subpart[nsn="+$(this).attr("nsn")+"]").addClass("btn-success").attr("selected",true);
            });
            break;
        default:
            return false;
    }
}

function btn_subpart_click(subpart,sublist){
    var index = subpart.attr("index");
    var selected = subpart.attr("selected");
    var nsn = subpart.attr("nsn");
    var some_subpart = document.getElementById(NSN+"__switch_"+nsn+":"+index);
    if (selected) {
        $(some_subpart).attr("whichChoice",-1);
        subpart.removeClass("btn-success");
    }else{
        $(some_subpart).attr("whichChoice", 0);
        subpart.addClass("btn-success");
    }
    subpart.attr("selected",!subpart.attr("selected"));
    sublist.attr("blockpropagation",true);
}

function btn_subpart_click_all(subpart,sublist){
    var index = subpart.attr("index");
    var selected = subpart.attr("selected");
    var nsn = subpart.attr("nsn");
    for(var i=0;i<=index;i++){
        var some_subpart = document.getElementById(NSN+"__switch_"+nsn+":"+i);
        if (selected) {
            $(some_subpart).attr("whichChoice",-1);
            subpart.removeClass("btn-success");
        }else{
            $(some_subpart).attr("whichChoice", 0);
            subpart.addClass("btn-success");
        }
    }
    subpart.attr("selected",!subpart.attr("selected"));
    sublist.attr("blockpropagation",true);
}

function btn_subpart_enableAll(){
    $(".btn-subpart").each(function(){
        var index = $(this).attr("index");
        var selected = $(this).attr("selected");
        var nsn = $(this).attr("nsn");
        var some_subpart = document.getElementById(NSN+"__switch_"+nsn+":"+index);
        $(some_subpart).attr("whichChoice","0").attr("selected",true);
    });
}

function parseURL() {
    var parameters=location.href.replace(/\?/ig,"&").split("&");
    for (var i=0;i<parameters.length;i++) parameters[i]=parameters[i].split("=");
    for (var i=1;i<parameters.length;i++) {
        switch (parameters[i][0]) {
        case "model": model = parameters[i][1];break;
        case "nobuttons": nobuttons = true;break;
        case "animate": animate = true;break;
        case "nocontrols": nocontrols = true;break;
        case "notitle": notitle = true;break;
        case "nodocs": nodocs = true;break;
        case "fraction": fraction = parseInt(parameters[i][1]);break;
        case "halflife": halflife = parseInt(parameters[i][1]);break;
        case "releasetimelimit": moveReleaseTimeLimit = parseInt(parameters[i][1]);break;
        case "screen_ratio": screen_ratio = parseFloat(parameters[i][1]);break;
        case "zoom": zoom = parseFloat(parameters[i][1]);break;
        //case "settings": settings_file = parameters[i][1];break;
        }
    }
    if (nobuttons) inherited_parameters += "nobuttons&";
    if (animate)   inherited_parameters += "animate&";

    var index = model.lastIndexOf("/");
    if (index>0){
        path = model.substr(0,index);
    }
    settings_file = model.slice(0,-3)+"xml";
    console.log("Opening model: "+model);
}

function getColorByNSN(nsn){
    var nsn_arr = nsn.split("-");
    var tmp_result = 0;
    if (nsn_arr[0]=="393"){
        tmp_result = 512;
    }else{
        tmp_result = 512;
    }
    tmp_result += nsn_arr[1]*2;

    var g = 50 + ((tmp_result>>6)&0x7)*30;
    var b = 50 + ((tmp_result>>3)&0x7)*5;
    var r = 50 + ((tmp_result>>0)&0x7)*30;

    return "rgba("+r+","+g+","+b+",1)";
}

// error message if x3dom library is not supported
function x3dom_error(){

  var webgl_error_background = $("<div>").css({
      position:"absolute",
      top:"0px",
      left:"0px",
      width:"100%",
      height:"100%",
      background:"black",
      "z-index":"999"
  });

  var webgl_error = $("<div>",{id:"webgl_error"}).css({
      position:"absolute",
      top:"0px",
      left:"0px",
      width:"100%",
      color:"white",
      "font-size":"1.4em",
      "font-weight":"bold",
      "text-align":"center",
      background:"black",
      "z-index":"1000"
  }).html("\
  This browser does not support WebGL. Please, check at <a style='color:rgba(100,200,255,1)' href='http://get.webgl.org/'>get.webgl.org</a><br/>\
  X3DOM Flash version is not available.<br/>\
  ");

  $("#main").append(webgl_error_background).append(webgl_error);
  webgl_error.css({
      top:($("#main").height()/2-webgl_error.height()/2)+"px"
  });

  //console.log($("#x3dom-x3d_canvas-object"));
  $("#x3dom-x3d_canvas-object").remove();

}

var X3DOM_INIT_DONE = false;

function x3dom_enter_frame(){

    //the only <strong>
    var progress_element = $.find("strong");
    var progress_counter = $(progress_element).html();
    progress_counter = progress_counter.split(" ");
    var cnt = parseInt(progress_counter[1]);

    var element = document.getElementById('x3d_canvas');

    if (!X3DOM_INIT_DONE){

      place_camera();

      if (cnt==0){

        element.runtime.examine();
        model_init();

        if (animate){
            start_animation();
        }

        X3DOM_INIT_DONE = true;
      }
    }

}