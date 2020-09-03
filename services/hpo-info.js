'use strict'

var obj = require("./hpo.json");
const request = require("request")

function getHposInfo (req, res){
	let arrayHpos = req.query.symtomCodes
  var isarray = Array.isArray(arrayHpos)
  var listhposinfo = [];
 	var hasError = false;
  if(!isarray){
    listhposinfo.push(obj[arrayHpos]);
  }else if(isarray){
		var lengList = arrayHpos.length;
		var counthpos = 0;
    arrayHpos.forEach(function(hpo) {
			if(obj[hpo]==undefined || obj[hpo].comment==undefined || obj[hpo].def==undefined){
				request({
				url: 'https://scigraph-ontology.monarchinitiative.org/scigraph/dynamic/cliqueLeader/'+hpo+'.json',
				json: true
				}, function(error, response, body) {
					if(error){
						hasError = true;
						//return res.status(500).send({message: `Error monarch: ${error}`})
						listhposinfo.push({"id": hpo,
				    "name": "",
						"synonym": "",
				    "comment": "",
				    "xref": "",
				    "relatives": {
				      "parents": [],
				      "children": []
				    }});
						counthpos++;
					}else{
						if(body.nodes!=undefined){
							if(body.nodes.length>0){
								var comment = ''
								var synonym = ''
									if(body.nodes[0].meta.definition!=undefined){
										comment=body.nodes[0].meta.definition[0]
									}else{
										if(body.nodes[0].meta["http://www.w3.org/2000/01/rdf-schema#comment"]!=undefined){
											comment = body.nodes[0].meta["http://www.w3.org/2000/01/rdf-schema#comment"][0]
										}
									}
									if(body.nodes[0].meta.synonym!=undefined){
										synonym = body.nodes[0].meta.synonym;
									}
									listhposinfo.push({"id": hpo,
							    "name": body.nodes[0].lbl,
									"synonym": synonym,
							    "comment": comment,
							    "xref": "",
							    "relatives": {
							      "parents": [],
							      "children": []
							    }});
								counthpos++;
								if(counthpos==lengList){
									if(hasError){
										res.status(500).send({message: 'Error monarch'})
									}else{
										res.status(200).send(listhposinfo)
									}
								}
							}
						}else{
							listhposinfo.push({"id": hpo,
					    "name": "",
							"synonym": "",
					    "comment": "",
					    "xref": "",
					    "relatives": {
					      "parents": [],
					      "children": []
					    }});
							counthpos++;
						}
					}
					/*else{
						return res.status(500).send({message: `Error monarch: ${error}`})
					}*/

				});
				/*listhposinfo.push({"id": hpo,
		    "name": "",
				"synonym": "",
		    "comment": "",
		    "xref": "",
		    "relatives": {
		      "parents": [],
		      "children": []
		    }});*/
			}else{
				listhposinfo.push(obj[hpo]);
				counthpos++;
			}

    });
  }
	if(counthpos==lengList){
		if(hasError){
			res.status(500).send({message: 'Error monarch'})
		}else{
			res.status(200).send(listhposinfo)
		}
	}
}

module.exports = {
	getHposInfo
}
