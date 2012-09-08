(function ($) {
	

	/**
	 * jQuery client-side XSLT plugins.
	 * 
	 * @author <a href="mailto:jb@eaio.com">Johann Burkard</a>
	 * @version $Id: jquery.xslt.js,v 1.10 2008/08/29 21:34:24 Johann Exp $
	 */
	/*
	 * xslt.js
	 *
	 * Copyright (c) 2005-2008 Johann Burkard (<mailto:jb@eaio.com>)
	 * <http://eaio.com>
	 * 
	 * Permission is hereby granted, free of charge, to any person obtaining a
	 * copy of this software and associated documentation files (the "Software"),
	 * to deal in the Software without restriction, including without limitation
	 * the rights to use, copy, modify, merge, publish, distribute, sublicense,
	 * and/or sell copies of the Software, and to permit persons to whom the
	 * Software is furnished to do so, subject to the following conditions:
	 * 
	 * The above copyright notice and this permission notice shall be included
	 * in all copies or substantial portions of the Software.
	 * 
	 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS
	 * OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
	 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN
	 * NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM,
	 * DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR
	 * OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE
	 * USE OR OTHER DEALINGS IN THE SOFTWARE.
	 * 
	 */

	/**
	 * Constructor for client-side XSLT transformations.
	 * 
	 * @author <a href="mailto:jb@eaio.com">Johann Burkard</a>
	 * @version $Id: xslt.js,v 1.7 2008/08/29 21:22:55 Johann Exp $
	 * @constructor
	 */
	var Transformation = function () {

	    var xml;

	    var xmlDoc;

	    var xslt;

	    var xsltDoc;

	    var callback = function() {};

	    /**
	     * Sort of like a fix for Opera who doesn't always get readyStates right.
	     */
	    var transformed = false;

	    /**
	     * Returns the URL of the XML document.
	     * 
	     * @return the URL of the XML document
	     * @type String
	     */
	    this.getXml = function() {
	        return xml;
	    }

	    /**
	     * Returns the XML document.
	     * 
	     * @return the XML document
	     */
	    this.getXmlDocument = function() {
	        return xmlDoc
	    }

	    /**
	     * Sets the URL of the XML document.
	     * 
	     * @param x the URL of the XML document
	     * @return this
	     * @type Transformation
	     */
	    this.setXml = function(x) {
	        xml = x;
	        return this;
	    }

	    /**
	     * Returns the URL of the XSLT document.
	     * 
	     * @return the URL of the XSLT document
	     * @type String
	     */
	    this.getXslt = function() {
	        return xslt;
	    }

	    /**
	     * Returns the XSLT document.
	     * 
	     * @return the XSLT document
	     */
	    this.getXsltDocument = function() {
	        return xsltDoc;
	    }

	    /**
	     * Sets the URL of the XSLT document.
	     * 
	     * @param x the URL of the XML document
	     * @return this
	     * @type Transformation
	     */
	    this.setXslt = function(x) {
	        xslt = x;
	        return this;
	    }

	    /**
	     * Returns the callback function.
	     * 
	     * @return the callback function
	     */
	    this.getCallback = function() {
	        return callback;
	    }

	    /**
	     * Sets the callback function
	     * 
	     * @param c the callback function
	     * @return this
	     * @type Transformation
	     */
	    this.setCallback = function(c) {
	        callback = c;
	        return this;
	    }

	    /**
	     *
	     * This method may only be called after {@link #setXml} and {@link #setXslt} have
	     * been called.
	     * <p>
	     * 
	     * @return the result of the transformation
	     */
	    this.transform = function() {
	        if (!browserSupportsXSLT()) {
	           return;
	        }
	        var str = /^\s*</;
	        var t = this,
				res;
	        if (document.recalc) {
	            var change = function() {
	                var c = 'complete';
	                if (xm.readyState == c && xs.readyState == c) {
	                    window.setTimeout(function() {
	                        xmlDoc = xm.XMLDocument;
	                        xsltDoc = xs.XMLDocument;
	                        callback(t);
	                        res = xm.transformNode(xs.XMLDocument);
	                    }, 50);
	                }
	            };

	            var xm = document.createElement('xml');
	            xm.onreadystatechange = change;
	            xm[str.test(xml) ? "innerHTML" : "src"] = xml;

	            var xs = document.createElement('xml');
	            xs.onreadystatechange = change;
	            xs[str.test(xslt) ? "innerHTML" : "src"] = xslt;

	            with (document.body) {
	                insertBefore(xm);
	                insertBefore(xs);
	            };
	        }
	        else {
	            var transformed = false;

	            var xm = {
	                readyState: 4
	            };
	            var xs = {
	                readyState: 4
	            };
	            var change = function() {
	                if (xm.readyState == 4 && xs.readyState == 4 && !transformed) {
	                    xmlDoc = xm.responseXML;
	                    xsltDoc = xs.responseXML;
	                    var resultDoc;
	                    var processor = new XSLTProcessor();

	                    if (typeof processor.transformDocument == 'function') {
	                        // obsolete Mozilla interface
	                        resultDoc = document.implementation.createDocument("", "", null);
	                        processor.transformDocument(xm.responseXML, xs.responseXML, resultDoc, null);
	                        var out = new XMLSerializer().serializeToString(resultDoc);
	                        callback(t);
							res = out;
	                    }
	                    else {
	                        processor.importStylesheet(xs.responseXML);
	                        resultDoc = processor.transformToFragment(xm.responseXML, document);
	                        callback(t);
							res = resultDoc;
	                    }

	                    transformed = true;
	                }
	            };

	            if (str.test(xml)) {
	                xm.responseXML = new DOMParser().parseFromString(xml, "text/xml");
	            }
	            else {
	                xm = new XMLHttpRequest();
	                xm.onreadystatechange = change;
	                xm.open("GET", xml);
	                xm.send(null);
	            }

	            if (str.test(xslt)) {
	                xs.responseXML = new DOMParser().parseFromString(xslt, "text/xml");
	                change();
	            }
	            else {
	                xs = new XMLHttpRequest();
	                xs.onreadystatechange = change;
	                xs.open("GET", xslt);
	                xs.send(null);
	            }
	        }
			return res;
	    }

	}

	/**
	 * Returns whether the browser supports XSLT.
	 * 
	 * @return the browser supports XSLT
	 * @type boolean
	 */
	var browserSupportsXSLT = function () {
	    var support = false;
	    if (document.recalc) { // IE 5+
	        support = true;
	    }
	    else if (window.XMLHttpRequest != undefined && window.XSLTProcessor != undefined) { // Mozilla 0.9.4+, Opera 9+
	       var processor = new XSLTProcessor();
	       if (typeof processor.transformDocument == 'function') {
	           support = window.XMLSerializer != undefined;
	       }
	       else {
	           support = true;
	       }
	    }
	    return support;
	}
	
	
	Vtree.plugins.xmlSource = {
		nodeStore:{
			defaults:{
				xslt:''+
					'<' + '?xml version="1.0" encoding="utf-8" ?>' + 
					'<xsl:stylesheet version="1.0" xmlns:xsl="http://www.w3.org/1999/XSL/Transform" >' + 
					'<xsl:output encoding="utf-8"  indent="no" omit-xml-declaration="yes" method="text" />' + 
					''+
					'<xsl:strip-space elements="*" />'+
					'<xsl:template match="/">' + 
					'	<xsl:apply-templates select="tree"/>' + 
					'</xsl:template>'+
					''+
					'<xsl:template match="tree">' + 
					'	{"tree":{'+
					'		"id": "<xsl:value-of select="@id"/>",'+
					' 		"nodes": <xsl:apply-templates select="nodes"/> }'+
					'	}'+
					'</xsl:template>' +
					''+
					'<xsl:template match="nodes">' + 
					' [<xsl:apply-templates select="node"/>]'+
					'</xsl:template>' +
					''+
					'<xsl:template match="node">' + 
					'	{"id": "<xsl:value-of select="id"/>",'+
					'	"title": "<xsl:value-of select="label|title"/>",'+
					'	"description": "<xsl:value-of select="description"/>",'+
					'	"hasChildren": <xsl:value-of select="hasChildren"/>,'+
					'	"iconPath": "<xsl:value-of select="icon"/>",'+
					'	"nodes":[<xsl:apply-templates select="node"/>]'+
					'	}<xsl:if test="position()!=last()">,</xsl:if>'+
					'</xsl:template>' + 
					'</xsl:stylesheet>'
			},
			_fn:{
				getDataSource: function(attribute){
					var res = new Transformation().setXml(this.tree.dataSource)
					        .setXslt(this.xslt).transform();

					this.tree.dataSource = JSON.parse(res.textContent);
					return this._call_prev();
				},
			}
		}		
	}
	
})(jQuery);