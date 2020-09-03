<div style="margin-bottom: 1%">
	<img width="70px" src="https://f29.visualstudio.com/88bb841e-8756-480d-9840-a24ba6dd4cb4/_apis/git/repositories/f98e1a97-d64d-495b-bbfc-99eff2073cd4/items?path=%2Fsrc%2Fassets%2Fimg%2Flogo-Dx29.png&versionDescriptor%5BversionOptions%5D=0&versionDescriptor%5BversionType%5D=0&versionDescriptor%5Bversion%5D=develop&resolveLfs=true&%24format=octetStream&api-version=5.0">
</div>

[![Build Status](https://f29.visualstudio.com/Health29%20for%20Diagnosis/_apis/build/status/dx29%20-%20dev%20-%20server%20-%20CI?branchName=develop)](https://f29.visualstudio.com/Health29%20for%20Diagnosis/_build/latest?definitionId=44&amp;branchName=develop)   [![Deployment status](https://f29.vsrm.visualstudio.com/_apis/public/Release/badge/88bb841e-8756-480d-9840-a24ba6dd4cb4/14/15)](https://f29.visualstudio.com/Health29%20for%20Diagnosis/_release?_a=releases&view=mine&definitionId=14)

# Dx29 server

Dx29 is a platform built to assist medical professionals during the diagnosis process to make it quicker and more accurate when dealing with rare diseases.

No tool can replace the knowledge of a clinician or physician, so we have designed Dx29 to help those professionals tap into the global community of medical knowledge to facilitate decision-making and diagnoses that might otherwise remain a mystery. Based on the symptoms drawn from a patient’s medical history, and suggesting new symptoms to look for. Dx29 offers medical teams possible pathologies from a wide range of rare diseases that many doctors may not have first-hand experience with.

Dx29 extends this idea further by offering medical teams feedback from their patients as new symptoms arise and leveraging available genetic information to surface additional pathologies that may not appear through standards tests. By combining the fundamental basics of good health care with cutting-edge medical technology, Dx29 gives medical professionals the chance to offer their patients a level of care that might not otherwise be possible.

You can consult the documentation on the [architecture of the dx29 project](https://dx29.readthedocs.io/en/latest/).

This project contains the core of the dx29 platform, the webapp. In particular in this repository is the server code of the project.This project contains the methods to access the different services that the client will need (TODO: client URL github).

The project uses [gitflow workflow](https://nvie.com/posts/a-successful-git-branching-model/). 
According to this it has implemented a branch-based system to work with three different environments. Thus, there are two permanent branches in the project:
>- The develop branch to work on the development environment.
>- The master branch to work on the production environment

And for the test environment, release branches will be created.

<p>&nbsp;</p>

## Configuration: Pre-requisites

This project uses external services.

As a minimun, for local develop it is mandatory to configure the file config.js.sample. So, to be able to compile and execute this project you have to modify the extension of the config.js.sample file, removing ".sample" (you have to modify config.js.sample by config.js) and here complete the information of the secret keys of the services.

If you want to deploy on production environment you must configure in the [Azure App Service](https://docs.microsoft.com/en-US/azure/app-service/) in Configuration/Aplication settings the variables defined in config.js file.

### External services required

To execute the project it is necessary to implement or configure a list of external services according to what is explained in the [dx29 architecture document](https://dx29.readthedocs.io/en/latest/).

Thus, we will mainly need:

>- An [Azure Blob storage](https://docs.microsoft.com/en-US/azure/storage/blobs/storage-blobs-introduction) for patient information.
>- Two [Azure Cosmos DB](https://docs.microsoft.com/en-US/azure/cosmos-db/introduction): one for accounts information and the other one for data information. 
>- An [Azure Notification Hub](https://docs.microsoft.com/en-US/azure/notification-hubs/)
>- An [Azure Service Bus](https://docs.microsoft.com/en-US/azure/service-bus-messaging/service-bus-messaging-overview)
>- F29 apis (bio,ncr) -> TODO: URL to our opensource service
    

<p>&nbsp;</p>

## Installation

Run `npm install` to install the dependencies.
The project requires a  [current, active LTS, or maintenance LTS](https://nodejs.org/en/about/releases/) version of Node.js. In particular, we are using [v12.13.0](https://nodejs.org/download/release/v12.13.0/).

<p>&nbsp;</p>

## Deployment

Run `npm run serve` and the server will be deployed on `http://localhost:<port>/` (port is configured in config.js file).

<p>&nbsp;</p>

## Other project links needed for deploy dx29 platform

You can consult the documentation on the [architecture of the dx29 project](https://dx29.readthedocs.io/en/latest/).

>- TODO: client URL github
>- TODO: F29 services github

<p>&nbsp;</p>
<p>&nbsp;</p>


<div style="border-top: 1px solid;
	padding-top: 1%;
    padding-right: 1%;
    padding-bottom: 0.1%;">
	<div align="right">
		<img width="150px" src="https://f29.visualstudio.com/88bb841e-8756-480d-9840-a24ba6dd4cb4/_apis/git/repositories/f98e1a97-d64d-495b-bbfc-99eff2073cd4/items?path=%2Fsrc%2Fassets%2Fimg%2Flogo-foundation-twentynine-footer.png&versionDescriptor%5BversionOptions%5D=0&versionDescriptor%5BversionType%5D=0&versionDescriptor%5Bversion%5D=develop&resolveLfs=true&%24format=octetStream&api-version=5.0">
	</div>
	<div align="right" style="padding-top: 0.5%">
		<p align="right">	
			Copyright © 2020
			<a style="color:#009DA0" href="https://www.foundation29.org/" target="_blank"> Foundation29</a>
		</p>
	</div>
<div>
