define({ "api": [
  {
    "type": "get",
    "url": "https://health29.org/api/langs/",
    "title": "Get languages",
    "name": "getLangs",
    "description": "<p>This method return the languages available in health 29. you get a list of languages, and for each one you have the name and the code. We currently have 5 languages, but we will include more. The current languages are:</p> <ul> <li>English: en</li> <li>Spanish: es</li> <li>German: de</li> <li>Dutch: nl</li> <li>Portuguese: pt</li> </ul>",
    "group": "Languages",
    "version": "1.0.0",
    "examples": [
      {
        "title": "Example usage:",
        "content": "this.http.get('https://health29.org/api/langs)\n .subscribe( (res : any) => {\n   console.log('languages: '+ res.listLangs);\n  }, (err) => {\n   ...\n  }",
        "type": "js"
      }
    ],
    "success": {
      "examples": [
        {
          "title": "Success-Response:",
          "content": "HTTP/1.1 200 OK\n[\n  {\n    \"name\": \"English\",\n    \"code\": \"en\"\n  },\n  {\n    \"name\": \"Español,Castellano\",\n    \"code\": \"es\"\n  },\n  {\n    \"name\": \"Deutsch\",\n    \"code\": \"de\"\n  },\n  {\n    \"name\": \"Nederlands,Vlaams\",\n    \"code\": \"nl\"\n  },\n  {\n    \"name\": \"Português\",\n    \"code\": \"pt\"\n  }\n]",
          "type": "json"
        }
      ]
    },
    "filename": "controllers/all/lang.js",
    "groupTitle": "Languages"
  }
] });
