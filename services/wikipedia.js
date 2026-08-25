'use strict'
const wiki = require('wikijs').default;
const { jsonRequest } = require('./httpClient')

function callwikiSearch (req, res){
	let text = encodeURIComponent(req.body.text);
	let lang = req.body.lang;
	const url =  `https://${lang}.wikipedia.org/w/api.php?action=query&list=search&prop=info&inprop=url&utf8=&format=json&srlimit=20&srsearch=${text}`
	jsonRequest({
	  method: 'GET',
	  url
	}).then((response) => {
	  res.status(200).send(response.body)
	}).catch((error) => {
	  console.log(error);
	  res.status(200).send([])
	})
}

function callwiki (req, res){
	let text = req.body.text;
	let lang = req.body.lang;
	wiki({ apiUrl: 'https://'+lang+'.wikipedia.org/w/api.php' })
	.page(text)
	.then(page => page.content())
	.then(function(page) {
	 res.status(200).send(page)
  }, function(reason) {
	res.status(200).send([])
	});
}

module.exports = {
	callwikiSearch,
	callwiki
}
