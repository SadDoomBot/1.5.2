// ==UserScript==
// @name         ZXDL
// @namespace    http://zoox18.com/
// @version      1.5.2
// @description  View and download private videos from ZX18.
// @author       Narkuh
// @match        http*://*.zoox18.com/*
// @connect      pastebin.com
// @grant        GM_download
// @grant        GM_xmlhttpRequest
// @require      http://code.jquery.com/jquery-3.4.1.min.js
// @require      https://cdn.plyr.io/3.5.6/plyr.js
// ==/UserScript==

/***********************************************************************/
/* This program is free software. It comes without any warranty, to     /
/* the extent permitted by applicable law. You can redistribute it      /
/* and/or modify it under the terms of the Do What The Fuck You Want    /
/* To Public License, Version 2.                                        /
/* See http://www.wtfpl.net/ for more details.                          /
/***********************************************************************/

var id = window.location.pathname.split("/")[2];
var key0 = "";
var key1 = "";
var key2 = "";
var paths = [];












// Inject
var downloading = false;
var found = false;
var isPrivateWindow = false;

var vidUrl = '';
var uploader = 'Unknown';
var title = 'Unknown';
var linkCheckThisSession = false;
$('.navbar').after('<div class="container" id="rip-div" style="width: 560px;"></div>')
$('.top-menu > .pull-left').append('<li>ZXDL 1.5.2 <span><a data-toggle="modal" href="#zxdl-modal"><span class="caret"></span></span></a></li>');
$('body').append('<div class="modal fade in" id="zxdl-modal"><div class="modal-dialog zxdl-modal"> <div class="modal-content"> <div class="modal-header"> <button type="button" class="close" data-dismiss="modal" aria-hidden="true">×</button> <h4 class="modal-title">ZXDL</h4> </div> <div class="modal-body">Version 1.5.2 | by Lowfo and Narkuh<br><h2>Link Status</h2><p>Any links that return an <i class="fa fa-times"></i> must be updated!</p><span class="link-status"></span></div></div></div></div>');

// Remove annoyances
document.querySelectorAll('.img-private').forEach(elm => elm.style.filter = 'brightness(1)');
document.querySelectorAll('.label-private').forEach(elm => elm.style.filter = 'opacity(0.5)');

// Functions
function formatBytes(a,b=2) {
    if (0===a) return "0 bytes";
    const c=0>b?0:b,d = Math.floor(Math.log(a) / Math.log(1024));
    return parseFloat((a / Math.pow(1024, d)).toFixed(c)) + " " +["bytes","KB","MB","GB"][d];
}

function dl_progress(res) {
    if (res.lengthComputable === false) return;
    $('#dl-data').html(formatBytes(res.done) +' / '+ formatBytes(res.total));
    $('#dl-bar').attr("aria-valuenow", Math.floor(res.done / res.total * 100));
    $('#dl-bar').css("width", Math.floor(res.done / res.total * 100) + "%");
    $('#dl-bar').html(Math.floor(res.done / res.total * 100) + "%");
}

function dl_load(res) {
    if (res.lengthComputable === false) return;
    $('#dl-data').html("Complete!");
    $('#dl-bar').addClass("progress-bar-success");
}

function dl_error(res) {
    if (res.lengthComputable === false) return;
    $('#dl-data').html("Oops, there was an error. Refresh page to try again");
    $('#dl-bar').addClass("progress-bar-danger");
}

function chkPrnt(url, cb) {
    $.ajax({
        url: url,
        dataType: 'jsonp',
        type: 'GET',
        complete: function (xhr) {
            if (typeof cb === 'function') {
                cb.apply(this, [xhr.status]);
            }
        }
    });
}

function menuLinkCheck(){
    if (!linkCheckThisSession){
        linkCheckThisSession = true
        for (let i = 0; i < paths.length; i++) {
            let pstrip = paths[i].substring(0, paths[i].lastIndexOf("/"));
            $('#zxdl-modal .link-status').append('<div class="link-'+i+'">Link '+(i+1)+':</div>')
            chkPrnt(pstrip, function (status) {
                if (status === 200) {
                    $('#zxdl-modal .link-'+i).append(' <i class="fa fa-check"></i>')
                } else {
                    $('#zxdl-modal .link-'+i).append(' <i class="fa fa-times"></i>')
                }
            });
        }
    }
}

function scan(url) {
    if (found == false){
        var v = document.createElement('VIDEO');
        v.addEventListener('loadeddata', function () { // If video found
            console.log('ZXDL: Video found! ' + url);
            found = true;
            vidUrl = url;

            if (isPrivateWindow){
                $('#rip-div').html('<h1>'+title+'</h1><p>Uploaded by <a href="https://zoox18.com/user/'+uploader+'">'+uploader+'</a></p><p style="font-size:12px">('+vidUrl+')</p><link rel="stylesheet" href="https://cdn.plyr.io/3.5.6/plyr.css" /><video style="width: 100%; height: 100%;" poster="https://www.zoox18.com/media/videos/tmb1/'+id+'/default.jpg" id="rippedvid" playsinline controls><source src="'+vidUrl+'" type="video/mp4" /></video><div><hr><button id="zxdl_favorite" class="btn btn-primary"><i class="glyphicon glyphicon-heart"></i> Favorite</button> <button id="zxdl_download" class="btn btn-primary"><i class="glyphicon glyphicon-download"></i> Download</button><p id="status"></p><div id="dl-progress" class="well" style="display: none"></div></div>');
                var controls = ['play-large', 'play', 'progress', 'current-time', 'mute', 'volume', 'settings', 'fullscreen'];
                var player = new Plyr('#rippedvid', { controls });

                $('#zxdl_favorite').click(function() { // Favorite button for private videos
                    $('#status').html('Please wait...');
                    var http = new XMLHttpRequest();
                    var url = 'https://www.zoox18.com/ajax/favorite_video';
                    var form = 'video_id='+ id;
                    http.open('POST', url, true);
                    http.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
                    http.onreadystatechange = function() {
                        if(http.readyState == 4 && http.status == 200) {
                            const response = http.responseText
                            if (response.includes('alert-danger')) {
                                $('#status').html('Couldn\'t favorite video. Are you logged in? Is this video already in your favorites?');
                            } else if (response.includes('alert-success')) {
                                $('#status').html('<span style="color:#77b300">Added to favorites!</span>');
                            } else {
                                $('#status').html('The site returned unknown data.');
                            }
                        }
                    }
                    http.send(form);
                });
            } else {
                // Replace download button on public videos
                $('div#share_video').append('<button id="zxdl_download" class="btn btn-primary m-l-5"><i class="glyphicon glyphicon-download"></i></button><p id="status"></p>');
                $('#response_message').after('<div id="dl-progress" class="well" style="display: none"></div>');
                $('button.btn.btn-default.dropdown-toggle').remove();
            }

            $('#zxdl_download').click(function() {
                if (downloading === false){
                    downloading = true;
                    $('#dl-progress').css('display','block');
                    $('#dl-progress').html('<h4>Progress</h4><span id="dl-data">Loading...</span> <div class="progress"><div id="dl-bar" class="progress-bar progress-bar-striped" role="progressbar" aria-valuenow="0" aria-valuemin="0" aria-valuemax="100" style="width: 0%"></div></div>');
                    GM_download({
                        url: url,
                        name: id + ".mp4",
                        onprogress: dl_progress,
                        onload: dl_load,
                        onerror: dl_error
                    });
                } else {
                    alert('You\'ve already initiated a download. Refresh the page to try again.');
                }
            });
        });
        v.src = url;
    }
}

function grabLinks() {
    return new Promise(resolve => {
        try {
            GM_xmlhttpRequest({
                method: "GET",
                url: "https://pastebin.com/raw/pnEwmQ2f",
                onload: function(response) {
                    var json = JSON.parse(response.responseText);
                    key0 = json.key0
                    key1 = json.key1
                    key2 = json.key2
                    paths = [atob(json.host0)+key0+'/media/videos/h264/'+id+'_SD.mp4', atob(json.host1)+key1+'/media/videos/h264/'+id+'_SD.mp4', atob(json.host2)+key2+'/media/videos/iphone/'+id+'.mp4', atob(json.host2)+key2+'/media/videos/h264/'+id+'_SD.mp4']
                    resolve()
                }
            });
        }
        catch (err) {
            alert("ZXDL: There was an error retrieving links for this session. Try refreshing the page, otherwise if you keep receiving this message, please contact us")
        }
    })
}

// On load
async function init() {
    if ($('#wrapper .container .row .col-xs-12').length > 0) { // If private video page active
        isPrivateWindow = true;
        uploader = $('.text-danger a').text();
        title = $("meta[property='og:title']").attr("content");
        if (window.location.pathname.split("/")[1] == "video") {
            $('.well.well-sm').remove(); // Remove notice
            $('.well.ad-body').remove(); // Remove sponsor block for non-ad-blockers
            $('#rip-div').html('<h1>Scanning for video '+id+'...</h1><p>This can take up to a minute.</p>');
            await grabLinks();
            paths.forEach(scan);
        }
    }
    else if($('#wrapper .container .row .col-md-8 .vcontainer ').length > 0) { // If public video page active
        await grabLinks();
        paths.forEach(scan);
    }
};

$( "a[href='#zxdl-modal']" ).click(function() {
    menuLinkCheck();
});

window.onload=init();
