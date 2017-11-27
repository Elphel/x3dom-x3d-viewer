//Requires:
//  <script src="jquery-2.1.4.min.js"></script>
//  <script src="bootstrap/js/bootstrap.min.js"></script>
function init_help(element){
    var help_str = "\
<table>\
<tr>\
    <td>Display area:<td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; left-click:</b></td>\
    <td valign='top'>select/deselect part and its copies</td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; left-click + move:</b></td>\
    <td valign='top'>rotate</td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; right-click:</b></td>\
    <td valign='top'>hide part and its copies. <b>undo</b>-button to unhide</td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; right-click + move:</b></td>\
    <td valign='top'>zoom</td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; middle-click + move:</b></td>\
    <td valign='top'>drag</td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; dbl-left-click:</b></td>\
    <td valign='top'>hide part and its copies, <span style='color:rgba(255,100,100,1)'><b>interferes with center of rotation</b></span></td>\
</tr>\
<tr>\
    <td valign='top'>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; dbl-middle-click:</b></td>\
    <td valign='top'>set center of rotation</td>\
</tr>\
<tr>\
    <td>Side buttons (if enabled):</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; <span style='padding:1px 5px;background:green;border-radius:2px 0px 0px 2px;'>abc</span><span style='padding:1px 5px;background:white;border-radius:0px 2px 2px 0px;color:black;'>&#x25BE;</span>&nbsp;<b>:</b></td>\
    <td><b>abc</b> = Part Number</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; <span style='padding:1px 5px;background:green;border-radius:2px 0px 0px 2px;'>abc</span> left-click:</b></td>\
    <td>select / single / hide / delesect</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; dropdown</b> <span style='padding:1px 5px;background:green;border-radius:2px;'>all</span> <b>:</b></td>\
    <td>hide/show part and its copies</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; dropdown</b> <span style='padding:1px 5px;background:green;border-radius:2px;'>1</span> <b>:</b></td>\
    <td>hide/show single part or copy</td>\
</tr>\
<tr>\
    <td>X3DOM controls help:</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; <a href='http://www.x3dom.org/documentation/interaction/' style='color:white'><img src='http://www.x3dom.org/wp-content/themes/x3domnew/x3dom_logo.png' style='background:rgba(250,250,250,0.8);height:25px;padding:3px'/> www.x3dom.org</a></td>\
</tr>\
<tr>\
    <td>Source code:</td>\
</tr>\
<tr>\
    <td>&nbsp;&nbsp;&nbsp;&nbsp;<b>&#8226; <a href='https://github.com/Elphel/freecad_x3d' style='color:white'><img src='http://blog.elphel.com/wp-content/themes/pixelgreen/images/blog-logo.png' style='height:25px;'/> Elphel <img src='https://github.com/fluidicon.png' style='height:25px;'/> github.com</a></td>\
</tr>\
</table>\
";

    var hlp = $("<div>").addClass("btn btn-primary nooutline btn-sm btn-my").html("?");
    hlp.css({
        position:"absolute",
        right: "3px",
        top: "3px",
        background:"rgba(100,100,100,0.7)",
        border: "1px solid gray",
        padding: "0px 6px 0px 6px"
    });
    
    var hlp_text = $("<div>",{id:"help-text"}).css({
        position:"absolute",
        top:"2px",
        right:"2px",
        "border-radius":"2px",
        border: "1px solid gray",
        color:"white",
        "font-size":"1.2em",
        padding:"10px 10px 10px 10px",
        background:"rgba(50,50,50,0.9)",
        display:"none",
        "z-index":"100"
    });
    
    hlp_text.html(help_str);
    hlp.click(function(){hlp_text.css({display:""});});
    hlp_text.click(function(){$(this).css({display:"none"});});
    element.append(hlp).append(hlp_text);
}