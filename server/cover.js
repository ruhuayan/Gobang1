var request    = require('request');
var cheerio    = require('cheerio');
var _          = require('underscore');
var cloudscraper = require('cloudscraper');

module.exports = {
	get: function(album, callback) {

		var msg={text:""}, url = 'https://www.amazon.com/s?field-keywords=' + album;

		cloudscraper.get(url, function(error, response, html) {                //console.log("body", html.indexOf())
	        if(error){
                    msg.text = error;
                    callback(msg, 0);
	        }else{    
                    var $ = cheerio.load(html);
                    $('script').remove();                                            // console.log($.html())  
                    var containers = $('.s-item-container').html();                   //console.log(url , $('.s-item-container').find('li').slice(0,1));
                    var imgPath = ($('img .cfMarker'));                    
                    //if(coverImage.src.indexOf(song))

                    if(imgPath !== ""){
                        msg.text = imgPath;
                            callback(msg, 0);
                    }
                    else{
                        msg.text = "not found";
                        callback(msg, 0);
                    }
                }
            });
	}
};


