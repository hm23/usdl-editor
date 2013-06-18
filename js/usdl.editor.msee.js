/**
 * Initialize a Linked USDL description based on an MSEE SLM service description.
 * See http://www.msee-ip.eu/
 *
 * @param {String} slmName The name of the MSEE SLM input (project, bsm model or tim model)
 */
function initSlmDescription(slmName){
	var kb= $.rdf();
	var extensionId = chrome.i18n.getMessage("@@extension_id");
    kb.prefix('', '<chrome-extension://' + extensionId + '/index.html>')
      .prefix('foaf', 'http://xmlns.com/foaf/0.1/')
      .prefix('rdf', 'http://www.w3.org/1999/02/22-rdf-syntax-ns#')
      .prefix('rdfs', 'http://www.w3.org/2000/01/rdf-schema#')
      .prefix('msm', 'http://cms-wg.sti2.org/ns/minimal-service-model#')
      .prefix('owl', 'http://www.w3.org/2002/07/owl#')
      .prefix('dcterms', 'http://purl.org/dc/terms/')
      .prefix('usdl', 'http://www.linked-usdl.org/ns/usdl-core#')
      .prefix('legal', 'http://www.linked-usdl.org/ns/usdl-legal#')
      .prefix('price', 'http://www.linked-usdl.org/ns/usdl-pricing#')
      .prefix('sla', 'http://www.linked-usdl.org/ns/usdl-sla#')
      .prefix('sec', 'http://www.linked-usdl.org/ns/usdl-sec#')
      .prefix('blueprint', 'http://bizweb.sap.com/TR/blueprint#')
      .prefix('vcard', 'http://www.w3.org/2006/vcard/ns#')
      .prefix('xsd', 'http://www.w3.org/2001/XMLSchema#')
      .prefix('ctag', 'http://commontag.org/ns#')
      .prefix('org', 'http://www.w3.org/ns/org#')
      .prefix('skos', 'http://www.w3.org/2004/02/skos/core#')
      .prefix('time', 'http://www.w3.org/2006/time#')
      .prefix('gr', 'http://purl.org/goodrelations/v1#')
      .prefix('doap', 'http://usefulinc.com/ns/doap#')
      .base(findBase(kb));
  
    var creator = ':author';
	var d = new Date();
	var now = d.toISOString(); 
    kb.add(': a usdl:ServiceDescription')
	  .add(': dcterms:title "' + slmName +  '"@en')
	  .add(': rdfs:label "Service description imported from ' + slmName + '"')
	  .add(': dcterms:description "(Service description imported from ' + slmName + ')"@en')
//	  .add(': owl:versionInfo "0.3"')
	  .add(': dcterms:modified "' + now + '"^^xsd:datetime')
	  .add(': dcterms:created "' + now + '"^^xsd:datetime')
	  .add(': dcterms:creator ' + creator);
	
	kb.add(creator + ' a foaf:Person')
	  .add(creator + ' foaf:name ""');
	
	document.kb = kb;	
	$sa.store.registerModification('About');
}

/**
 * Import information from MSEE BSM service description into current kb.
 * See http://www.msee-ip.eu/
 *
 * @param {String} content The content of the bsm file
 */
function importBsmModel(content){
	var parsed = new DOMParser().parseFromString(content, "text/xml");

	// Add (probably only max one virtual) enterprises to kb
	// TODO organization == provider?
	var organizationElements = parsed.getElementsByTagName("organizations");
	for (var i = 0; i < organizationElements.length; i++) {
    	var organizationId = organizationElements[i].getAttribute("id");
        if (!isKnown("gr:BusinessEntity", organizationId)){
            var organizationSubject = getSubjectOfIdElement(organizationElements[i]);
        	var organizationTitle = organizationElements[i].getAttribute("name");
        	var organizationDescription = organizationElements[i].getAttribute("description");
        	
        	var addressSubject = ':' + organizationId + '-address';
        	
        	document.kb
	    		.add(organizationSubject + ' a gr:BusinessEntity')
	    		.add(organizationSubject + ' gr:legalName "' + organizationTitle + '"')
//	    		.add(organizationSubject + ' foaf:homepage "http://www.rivercity-service-online.com"')
//	    		.add(organizationSubject + ' usdl:legalForm "Ltd. Co."')
	    		.add(organizationSubject + ' dcterms:identifier "' + organizationId + '"')
	    		.add(organizationSubject + ' dcterms:description "' + organizationDescription + '"')
	    		.add(organizationSubject + ' vcard:adr ' + addressSubject);
        	
        	// Initialize empty vcard (TODO provider address to be retrieved from some SLM resource?)
			document.kb
				.add(addressSubject + ' a vcard:Work')
				.add(addressSubject + ' vcard:tel " "')
				.add(addressSubject + ' vcard:email " "')
				.add(addressSubject + ' vcard:locality " "')
				.add(addressSubject + ' vcard:street-address " "')
				.add(addressSubject + ' vcard:postal-code " "')
				.add(addressSubject + ' vcard:region " "')
				.add(addressSubject + ' vcard:country-name " "')
				.add(addressSubject + ' dcterms:description " "');
        } 
	}
	
	// Add (possibly multiple?) services to kb
	var serviceElements = parsed.getElementsByTagName("service");
	for (var i = 0; i < serviceElements.length; i++) {
    	var serviceId = serviceElements[i].getAttribute("id");
        if (!isKnown("usdl:Service", serviceId)){
            var serviceSubject = getSubjectOfIdElement(serviceElements[i]);
        	var serviceTitle = serviceElements[i].getAttribute("name");
        	var serviceDescription = serviceElements[i].getAttribute("description");
        	
        	// TODO mapping of allowed service nature values
        	var serviceNature = 'usdl:';
        	switch (serviceElements[i].getAttribute("nature")) {
        	case "Human": serviceNature += 'Human'; break;
        	case "Semi-Automated": serviceNature += 'Semi-Automated'; break;
        	default: serviceNature += 'Automated';
        	}
        	
        	document.kb
        		.add(serviceSubject  + ' a usdl:Service')
        		.add(serviceSubject + ' usdl:hasNature ' + serviceNature)
//       		.add(serviceSubject + ' dcterms:modified "2011-03-03"^^xsd:date')
//        		.add(serviceSubject + ' dcterms:issued "2011-03-03"^^xsd:date')
        		.add(serviceSubject + ' dcterms:title "' + serviceTitle + '"@en')
        		.add(serviceSubject + ' dcterms:identifier "' + serviceId + '"')
        		.add(serviceSubject + ' dcterms:description "' + serviceDescription + '"@en');
        	
        	// TODO Assuming that there is only one organization (enterprise or composed virtual enterprise) representing the provider...
        	if (organizationElements.length > 0)
	        	document.kb
	    			.add(serviceSubject + ' usdl:hasProvider ' + getSubjectOfIdElement(organizationElements[0]));
        }
	}

	$sa.store.registerModification('About');
	$sa.store.registerModification('Service');
	$sa.store.registerModification('Providers');
}

function isKnown(elementType, elementId) {
	var existingElements = document.kb.where('?s a "' + elementType + '"');
	if (existingElements.length)
		return existingElements.where('?t dcterms:identifier "' + elementId + '"').length;
    return false;
}

function getSubjectOfIdElement(element) {
	var elementId = element.getAttribute("id");
    return ':' + elementId;
}
