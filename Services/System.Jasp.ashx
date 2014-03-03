<%@ WebHandler Language="C#" Class="MRS.Web.JaspHandler" %>

using System;
using System.Collections.Generic;
using System.IO;
using System.Web;
using MRSCL.Core;
using Fizzler.Systems.HtmlAgilityPack;
using HtmlAgilityPack;

namespace MRS.Web
{
    public class JaspHandler : IHttpHandler
    {
        public static Dictionary<string, HtmlDocument> documents;

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/html";
            context.Response.Headers.Add("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
            context.Response.Headers.Add("Access-Control-Request-Header", "X-Prototype-Version, x-requested-with");
            //context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            try
            {
                var file = HttpUtility.UrlDecode(context.Request.QueryString["file"]);
                var path = HttpUtility.UrlDecode(context.Request.QueryString["path"] ?? "");
                path = Path.GetFullPath(context.Server.MapPath("~/" + path));
                if (string.IsNullOrEmpty(file))
                {
                    file = "System.htm";
                }
                if (!path.EndsWith("/")) path += "/";
                var filepath = path + file;

                HtmlDocument doc;
                if (documents == null)
                {
                    documents = new Dictionary<string, HtmlDocument>();
                }
		if (context.Request["param"] == "clearcache"){
            if (documents.ContainsKey(filepath))
		    {
                documents.Remove(filepath);
		    }
		}
        if (documents.ContainsKey(filepath))
                {
                    doc = documents[filepath];
                }
                else
                {
                    doc = new HtmlDocument();
                    try
                    {
                        doc.Load(filepath, true);
                    }
                    catch (FileNotFoundException e)
                    {
                        doc.LoadHtml("<jasp-root></jasp-root>");
                        doc.Save(filepath, System.Text.Encoding.UTF8);
                    }
                    documents[filepath] = doc;
                }
		var selector = HttpUtility.UrlDecode(context.Request.QueryString["selector"] ?? "");
                if (context.Request.RequestType == "GET")
                {
                    if (string.IsNullOrEmpty(selector))
                    {
                        context.Response.WriteFile(filepath);
                    }
                    else
                    {
                        if (selector.Contains("@"))
                        {
                            var sparts = selector.Split('@');
                            selector = sparts[0];
                            foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                            {
                                for (int i = 1; i < sparts.Length; i++)
                                {
                                    var attr = htmlNode.GetAttributeValue(sparts[i], "");
                                    context.Response.Write(string.Format("<attr name='{0}'>{1}</attr>", sparts[i], attr));
                                }
                            }

                            return;
                        }

                        if (selector.EndsWith("!"))
                        {
                            selector = selector.Remove(selector.Length - 1);
                            foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                            {
                                context.Response.Write(htmlNode.CloneNode(false).OuterHtml);
                            }

                            return;
                        }
                        if (selector.StartsWith("//"))
                        {
                            var nav = doc.CreateNavigator();
                            var xpathobj = nav.Evaluate(selector);
                            if (xpathobj != null)
                            {
                                context.Response.Write(xpathobj.ToString());
                            }

                            return;
                        }
                        foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                        {
                            context.Response.Write(htmlNode.OuterHtml);
                        }
                    }
                }
                if (context.Request.RequestType == "POST")
                {
                    StreamReader reader = new StreamReader(context.Request.InputStream, true);
                    var content = reader.ReadToEnd();
                    reader.Close();
                    var count = 0;
                    var type = HttpUtility.UrlDecode(context.Request.QueryString["type"] ?? "");
                    if (string.IsNullOrEmpty(selector))
                    {
                        switch (type)
                        {
                            case "set":
                                count++;
                                doc.DocumentNode.InnerHtml = content;
                                break;
                            case "append":
                            case "add":
                                count++;
                                doc.DocumentNode.InnerHtml += content;
                                break;
                            case "prepend":
                                count++;
                                doc.DocumentNode.InnerHtml = content + doc.DocumentNode.InnerHtml;
                                break;
                        }
                    }
                    else
                    {
                        if (selector.Contains("@"))
                        {
                            var sparts = selector.Split('@');
                            selector = sparts[0];
                            switch (type)
                            {
                                case "prepend":
                                case "set":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        for (int i = 1; i < sparts.Length; i++)
                                        {
                                            htmlNode.SetAttributeValue(sparts[i], content);
                                        }
                                    }
                                    break;
                                case "append":
                                case "add":
                                    double valueNum = -1;
                                    if (double.TryParse(content, out valueNum))
                                    {
                                        foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                        {
                                            count++;
                                            for (int i = 1; i < sparts.Length; i++)
                                            {
                                                double attrNumValue;
                                                var prevValue = htmlNode.GetAttributeValue(sparts[i], "");
                                                if (double.TryParse(prevValue, out attrNumValue))
                                                {
                                                    htmlNode.SetAttributeValue(sparts[i], (attrNumValue + valueNum).ToString());
                                                }
                                                else
                                                {
                                                    htmlNode.SetAttributeValue(sparts[i], prevValue + content);
                                                }
                                            }
                                        }
                                    }
                                    else
                                    {
                                        foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                        {
                                            count++;
                                            for (int i = 1; i < sparts.Length; i++)
                                            {
                                                htmlNode.SetAttributeValue(sparts[i], htmlNode.GetAttributeValue(sparts[i], "") + content);
                                            }
                                        }
                                    }
                                    break;
                                case "delete":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        for (int i = 1; i < sparts.Length; i++)
                                        {
                                            htmlNode.SetAttributeValue(sparts[i], null);
                                        }
                                    }
                                    break;
                            }
                        }
                        else
                        {
                            switch (type)
                            {
                                case "set":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        htmlNode.InnerHtml = content;
                                    }
                                    break;
                                case "append":
                                case "add":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        htmlNode.InnerHtml += content;
                                    }
                                    break;
                                case "prepend":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        htmlNode.InnerHtml = content + htmlNode.InnerHtml;
                                    }
                                    break;
                                case "addclass":
                                    var classes = content.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        var classVal = htmlNode.GetAttributeValue("class", "");
                                        if (!classVal.StartsWith(" "))
                                        {
                                            classVal = " " + classVal;
                                        }
                                        if (!classVal.EndsWith(" "))
                                        {
                                            classVal += " ";
                                        }
                                        for (int i = 0; i < classes.Length; i++)
                                        {
                                            var cls = classes[i].Trim(' ');
                                            if (!classVal.Contains(" " + cls + " "))
                                            {
                                                classVal += cls + " ";
                                            }
                                        }
                                        htmlNode.SetAttributeValue("class", classVal);
                                    }
                                    break;
                                case "delclass":
                                    var dclasses = content.Split(new char[] { '.' }, StringSplitOptions.RemoveEmptyEntries);
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        var classVal = htmlNode.GetAttributeValue("class", "");
                                        if (!classVal.StartsWith(" "))
                                        {
                                            classVal = " " + classVal;
                                        }
                                        if (!classVal.EndsWith(" "))
                                        {
                                            classVal += " ";
                                        }
                                        for (int i = 0; i < dclasses.Length; i++)
                                        {
                                            var cls = dclasses[i].Trim(' ');
                                            if (classVal.Contains(" " + cls + " "))
                                            {
                                                classVal = classVal.Replace(" " + cls + " ", " ");
                                            }
                                        }
                                        htmlNode.SetAttributeValue("class", classVal);
                                    }
                                    break;
                                case "delete":
                                    foreach (var htmlNode in doc.DocumentNode.QuerySelectorAll(selector))
                                    {
                                        count++;
                                        if (htmlNode.ParentNode != null)
                                            htmlNode.ParentNode.RemoveChild(htmlNode);
                                    }
                                    break;
                            }
                        }
                    }
                    context.Response.Write(count);
                    if (count > 0)
                    {
                        doc.Save(filepath);
                    }
                }
            }
            catch (Exception error)
            {
                context.Response.Write(ErrorManager.GetFormattedErrorMessage(error, true, true));
            }
        }

        public bool IsReusable
        {
            get
            {
                return true;
            }
        }

    }
}