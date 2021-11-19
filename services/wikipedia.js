'use strict'
const wiki = require('wikijs').default;
const request = require("request");

function callwikiSearch (req, res){
	let text = encodeURIComponent(req.body.text);
	let lang = req.body.lang;
	const url =  `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&srlimit=20&srsearch=${text}`
	var options = {
	  'method': 'GET',
	  'url': url
	};
	request(options, function (error, response) {
	  if (error){
			console.log(error);
			res.status(200).send([])
		}else{
			res.status(200).send(response.body)
		}
	});
}

function callwiki (req, res){
	let text = req.body.text;
	let lang = req.body.lang;
	wiki({ apiUrl: 'https://'+lang+'.wikipedia.org/w/api.php' })
	.page(text)
	.then(page => page.content())
	.then(function(page) {
   // cumplimiento
	 res.status(200).send(page)
  }, function(reason) {
  // rechazo
	res.status(200).send([])
	});
}

module.exports = {
	callwikiSearch,
	callwiki
}
