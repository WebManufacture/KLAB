 if (typeof (Dottoro) == "undefined") {
	var Dottoro = {}; // namespace
}

Dottoro.HighLighter = {}; // namespace

Dottoro.HighLighter.Style_Classes = [];
Dottoro.HighLighter.Style_Classes[0] = ["asp_def"];
Dottoro.HighLighter.Style_Classes[1] = ["css_def", "css_com", "css_invalid", "css_atrule", "css_atrule_unknown", "css_atrule_media", "css_atrule_media_unknown", "css_atrule_pageselector", "css_atrule_value", "css_atrule_value_unknown", "css_id", "css_class", "css_type", "css_type_unknown", "css_attr", "css_pseudo", "css_pseudo_unknown", "css_prop", "css_prop_unknown", "css_propvalue", "css_propvalue_unknown"];
Dottoro.HighLighter.Style_Classes[2] = ["html_def", "html_com", "html_doctype", "html_tagop", "html_attrop", "html_tag", "html_tag_unknown", "html_attr", "html_attr_unknown", "html_attrvalue", "html_attrvalue_unknown"];
Dottoro.HighLighter.Style_Classes[3] = ["java_def"];
Dottoro.HighLighter.Style_Classes[4] = ["jscript_def", "jscript_com", "jscript_invalid", "jscript_keyword", "jscript_number", "jscript_string", "jscript_regexp", "jscript_op", "jscript_coreobj", "jscript_globconst", "jscript_globmethod", "jscript_prop", "jscript_method"];
Dottoro.HighLighter.Style_Classes[5] = ["jsp_def"];
Dottoro.HighLighter.Style_Classes[6] = ["php_def", "php_outside", "php_openclose", "php_com", "php_invalid", "php_keyword", "php_number", "php_string", "php_predef", "php_op"];
Dottoro.HighLighter.Style_Classes[7] = ["vbscript_def", "vbscript_com", "vbscript_invalid", "vbscript_keyword", "vbscript_number", "vbscript_string", "vbscript_op", "vbscript_opword", "vbscript_opmultiline"];
Dottoro.HighLighter.Style_Classes[8] = ["xml_def", "xml_com", "xml_cdata", "xml_invalid", "xml_tagop", "xml_attrop", "xml_tag", "xml_dectag", "xml_doctype", "xml_attr", "xml_attrvalue"];

Dottoro.HighLighter.printFrame = null;

Dottoro.HighLighter.UnpackSpan = function (pattern, from) {
	var langIdx = pattern.charCodeAt (from) - 64;
	from++;

	var idx = 0;
	while (from < pattern.length) {
		var charCode = pattern.charCodeAt (from);
		if (charCode < 64 || charCode >= 192) {
			break;
		}
		idx <<= 7;
		idx += (charCode - 64);
		from++;
	}

	return ["<span class='" + Dottoro.HighLighter.Style_Classes[langIdx][idx] + "'>", from];
}

Dottoro.HighLighter.UnpackSource = function (source) {
	source = source.replace (/<a href="http:\/\/help\.dottoro\.com\//ig, "<a target=\"_blank\" href=\"http://help.dottoro.com/");
	var unpacked = "";
	var start = 0;
	while (start < source.length) {
		var end = source.indexOf ("<!--", start);
		if (end == -1) {
			unpacked += source.substring (start);
			break;
		}
		else {
			unpacked += source.substring (start, end);
		}

		start = end + 4;
		end = source.indexOf ("-->", start);
		if (end == -1) {
			break;	// error
		}

		var pattern = source.substring (start, end);
		var insert = "";
		var i = 0;
		while (i < pattern.length) {
			var ch = pattern.charAt (i);
			switch (ch) {
			case '0':
				insert += "</span>";
				i++;
				break;
			case 's':
				var span_idx_pair = Dottoro.HighLighter.UnpackSpan (pattern, i+1);
				insert += span_idx_pair[0];
				i = span_idx_pair[1];
				break;
			case 'S':
				var span_idx_pair = Dottoro.HighLighter.UnpackSpan (pattern, i+1);
				insert += "</span>" + span_idx_pair[0];
				i = span_idx_pair[1];
				break;
			default:	// error
				i = pattern.length;
				break;
			};
		}
		
		unpacked += insert;
		start = end + 3;
	}
	return unpacked;
}

Dottoro.HighLighter.GetRootElement = function (element) {
	while (element && element.className.indexOf ("dottoro_highlight") < 0) {
		element = element.parentNode;
	}
	return element;
}

Dottoro.HighLighter.GetCodePreElement = function (element, isRoot) {
	var root = element;
	if (!isRoot) {
		root = Dottoro.HighLighter.GetRootElement (element);
	}
	if (!root) {
		return null;
	}

	var pres = root.getElementsByTagName ("pre");
	if (pres.length == 0) {
		return null;
	}
	if (pres.length == 2) {
		return pres[1];
	}
	return pres[0];
}

Dottoro.HighLighter.GetCodeText = function (element) {
	var pre = Dottoro.HighLighter.GetCodePreElement (element, false);
	if (!pre) {
		return "";
	}
	if (pre.innerText === undefined) {
		return pre.textContent;
	}
	return pre.innerText;	
}

Dottoro.HighLighter.OnViewPlainButton = function (button) {
	var src = Dottoro.HighLighter.GetCodeText (button);
	if (src == null) {
		return;
	}

	var wnd = window.open ('', 'plain','width=750, height=400, location=0, resizable=1, menubar=0, scrollbars=0,titlebar=0,directories=0,toolbar=0,channelmode=0,status=0');
	if (wnd.document.body) {
		var textarea = wnd.document.createElement ("textarea");
		textarea.wrap = "off";
		textarea.spellcheck = false;
		textarea.style.width = "100%";
		textarea.style.height = "100%";
		textarea.value = src;
		wnd.document.body.appendChild (textarea);
				// the textarea.focus is not enough in Internet Explorer, it selects the about:blank
		if (wnd.focus) {
			wnd.focus ();
		}
		textarea.focus ();
		textarea.select ();
	}
}

Dottoro.HighLighter.OnCopyButton = function (button) {
	var success = true;

	if (window.clipboardData) {
		var src = Dottoro.HighLighter.GetCodeText (button);
		window.clipboardData.setData ('text', src);
	}
	else {
		var pre = Dottoro.HighLighter.GetCodePreElement (button, false);
		if (pre) {
			var printContent = Dottoro.HighLighter.GetOuterHTML (pre);
			var iframe = Dottoro.HighLighter.CreateIframe (printContent);

			iframe.contentEditable = true;
			var doc = iframe.contentWindow.document;
			var rangeObj = doc.createRange ();
			rangeObj.selectNodeContents (doc.body);

			var selection = iframe.contentWindow.getSelection ();
			selection.addRange (rangeObj);

			try {
				doc.execCommand ("copy", false, null);
			} catch (e) {
				try {
					netscape.security.PrivilegeManager.enablePrivilege ("UniversalXPConnect");
					doc.execCommand ("copy", false, null);
				} catch (e) {
					success = false;
					alert ("Your browser doesn't allow clipboard access! Please copy the code manually.");
				}
			}
			document.body.removeChild (iframe);
		}
	}

	if (!success) {
		Dottoro.HighLighter.OnViewPlainButton (button);
	}
}

Dottoro.HighLighter.OnPrintButton = function (button) {
	var pre = Dottoro.HighLighter.GetCodePreElement (button, false);
	if (!pre) {
		return;
	}

	var printContent = Dottoro.HighLighter.GetOuterHTML (pre);

	if (window.opera) {
		Dottoro.HighLighter.CreatePrintWindow (printContent);
		return;
	}

	if (Dottoro.HighLighter.printFrame) {
		Dottoro.HighLighter.printFrame.contentWindow.document.body.innerHTML = printContent;
	}
	else {
		Dottoro.HighLighter.printFrame = Dottoro.HighLighter.CreateIframe (printContent);
	}

	Dottoro.HighLighter.printFrame.contentWindow.focus();
	Dottoro.HighLighter.printFrame.contentWindow.print();
}

Dottoro.HighLighter.GetOuterHTML = function (node) {
	if (node.outerHTML !== undefined) {
		return node.outerHTML;
	}

	if (document.createRange) {
		var rangeObj = document.createRange ();
		rangeObj.selectNode (node);
		var documentFragment = rangeObj.cloneContents ();
		var tmpDiv = document.createElement ("div");
		tmpDiv.appendChild (documentFragment);
		return tmpDiv.innerHTML;
	}
	return "";
}


Dottoro.HighLighter.CollectStyles = function () {
	var styleDefs = "";

	var links = document.getElementsByTagName ('link');
	for (var i=0; i < links.length; i++) {
		if (links[i].rel.toLowerCase() == 'stylesheet') {
			styleDefs += '<link type="text/css" rel="stylesheet" href="' + links[i].href + '"></link>';
		}
	}

	var styles = document.getElementsByTagName ('style');
	for (var i=0; i < styles.length; i++) {
		var styleSheet = styles[i].styleSheet ? styles[i].styleSheet : styles[i].sheet;
		var textContent = "";
		if (styleSheet.cssText === undefined) {
			for (var j = 0; j < styleSheet.cssRules.length; j++) {
				textContent += styleSheet.cssRules[j].cssText;
			}
		}
		else {
			textContent += styleSheet.cssText;
		}
		styleDefs += '<style>' + textContent + '</style>';
	}

	return styleDefs;
}

Dottoro.HighLighter.CreateIframe = function (bodyContent) {
	var iframe = document.createElement ("iframe");
	iframe.style.position = "absolute";
	iframe.style.left = "-1000px";
	iframe.style.top = "-1000px";
	iframe.style.width = "0px";
	iframe.style.height = "0px";
	document.body.appendChild (iframe);

	var html = "";
	html += '<!DOCTYPE html><html><head>';
	html += Dottoro.HighLighter.CollectStyles ();
	html += '</head><body>';
	html +=	bodyContent;
	html +=	'</body></html>';

	var doc = iframe.contentWindow.document;
	doc.open ();
	doc.write (html);
	doc.close ();

	return iframe;
}

Dottoro.HighLighter.CreatePrintWindow = function (bodyContent) {
	var win = window.open ("");

	var html = "";
	html += '<!DOCTYPE html><html><head>';
	html += Dottoro.HighLighter.CollectStyles ();
	html += '</head><body onload="window.print (); window.opener = self; self.close ();">';
	html +=	bodyContent;
	html +=	'</body></html>';

	var doc = win.document;
	doc.open ();
	doc.write (html);
	doc.close ();

	return win;
}

Dottoro.HighLighter.UnpackCodes = function () {
	var anchors = document.getElementsByName ("dr_hl_compressed");
	for (var i = 0; i < anchors.length; i++) {
		var pre = Dottoro.HighLighter.GetCodePreElement (anchors[i], false);
		if (pre) {
				/* 
				   the innerHTML property works differently in IE than in other browsers:
				      - whitespaces at the beginning and end of innerHTML will be removed
				      - adjacent whitespaces will be collapsed into single spaces
				      - newline characters will be removed
				*/
			var packed = pre.innerHTML;
			pre.innerHTML = " ";
			if (pre.innerHTML.length == 0) {
					// whitespace and newline characters are left untouched within a pre element
				pre.innerHTML = "<pre>" + Dottoro.HighLighter.UnpackSource (packed) + "</pre>";
			}
			else {
				pre.innerHTML = Dottoro.HighLighter.UnpackSource (packed);
			}
		}
	}
}

if (window.addEventListener) {
	window.addEventListener ("load", Dottoro.HighLighter.UnpackCodes, false);
}
else {
	window.attachEvent ("onload", Dottoro.HighLighter.UnpackCodes);
}
