<%@ WebHandler Language="C#" Class="MRS.Web.UI.ContentHandler" %>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text;
using System.Text.RegularExpressions;
using System.Threading;
using System.Web;
using System.Web.UI;
using System.Xml.Linq;
using MRS.Core;
using MRS.Core.Parsers;
using MRS.Web;
using MRSCL.Core;

namespace MRS.Web.UI
{
    public class ContentHandler : IHttpHandler
    {


        public void ProcessRequest(HttpContext context)
        {
            var file = HttpUtility.UrlDecode(context.Request["file"]);
            try
            {
                var rootPath = Path.GetFullPath(context.Server.MapPath("~/"));
                var filepath = rootPath + file;
                FilesManager manager = FilesManager.GetManager(rootPath);
                context.Response.ContentType = "text/plain";
                context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                var action = context.Request.QueryString["action"];

                if (context.Request.HttpMethod == "POST")
                {
                    try
                    {
                        if (action == "partial")
                        {
                            var streamReader = new StreamReader(context.Request.InputStream, Encoding.UTF8);
                            var content = XElement.Parse(streamReader.ReadToEnd());
                            streamReader.Close();
                            var element = XElement.Load(filepath);
                            var elements = element.Descendants(HttpUtility.UrlDecode(context.Request.QueryString["element"]));
                            foreach (var item in elements)
                            {
                                item.SetValue(content);
                            }
                            element.Save(filepath);
                            return;
                        }
                        if (!File.Exists(filepath))
                        {
                            manager.CreateFileEntity(file);
                        }
                        context.Request.SaveAs(filepath, false);

                        context.Response.Write(FilesHelper.GenerateFileLinkHTML(manager, file));
                    }
                    catch (Exception e)
                    {
                        context.Response.StatusCode = 409;
                        context.Response.Write(ErrorManager.GetFormattedErrorMessage(e, false, true));
                    }
                    return;
                }
                if (context.Request.HttpMethod == "GET")
                {
                    switch (action)
                    {
                        case "get":
                            BaseContentParser s = new BaseContentParser(filepath);
                            context.Response.Write(s.Parse());
                            break;
                        case "text":
                            {
                                context.Response.ContentType = "text/" + Path.GetExtension(file).Replace(".", "");
                                BaseContentParser parser = new BaseContentParser(filepath);
                                context.Response.Write(parser.Parse());
                            }
                            break;

                        case "url":
                        case "urlproxy":
                            {
                                var url = HttpUtility.UrlDecode(file);
                                //context.Response.Redirect(url);
                                if (!url.StartsWith("http://"))
                                    url = "http://" + url;
                                var webRequest = WebRequest.Create(url);
                                var response = webRequest.GetResponse();
                                var stream = response.GetResponseStream();
                                
                                byte[] buffer = new byte[response.ContentLength];
                                stream.Read(buffer, 0, buffer.Length);
                                stream.Close();
                                
                                context.Response.BinaryWrite(buffer);
                            }
                            break;

                        case "proxy":
                            {
                                var url = HttpUtility.UrlDecode(file);
                                if (!url.StartsWith("http://"))
                                    url = "http://" + url;
                                var webRequest = WebRequest.Create(url);
                                var response = webRequest.GetResponse();
                                var charset = "UTF-8";
                                //var charsetIndex = response.ContentType.IndexOf("charset=");
                                //var charsetEnd = response.ContentType.IndexOf(";", charsetIndex);
                                //if (charsetIndex >= 0)
                                //{
                                //    charset = response.ContentType.Substring(charsetIndex + "charset=".Length, charsetEnd - charsetIndex - 1);
                                //}
                                //Encoding encode = Encoding.GetEncoding(charset);
                                StreamReader reader = new StreamReader(response.GetResponseStream(), true);
                                var site = reader.ReadToEnd();
                                //var buffer = Encoding.Convert(reader.CurrentEncoding, Encoding.UTF8, reader.CurrentEncoding.GetBytes(site));
                                reader.Close();
                                response.Close();

                                //site = Encoding.UTF8.GetString(buffer);
                                context.Response.ContentType = "text/html";
                                context.Response.Charset = "UTF-8";
                                var bodyStart = site.IndexOf("<body");
                                var bodyStop = site.IndexOf("</body>");
                                if (bodyStart > 0 && bodyStop > bodyStart)
                                {
                                    site = site.Substring(bodyStart, bodyStop - bodyStart + 7);
                                    //site = RemoveTagsFromHTML(site, "script");
                                    //site = RemoveTagsFromHTML(site, "style");
                                    //site = RemoveTagsFromHTML(site, "link");
                                    site = site.Replace("<link", "<div class='link'");
                                    site = site.Replace("</link>", "</div>");
                                    site = site.Replace("<style", "<div class='style'");
                                    site = site.Replace("</style>", "</div>");
                                    site = site.Replace("<script", "<div class='script'");
                                    site = site.Replace("</script>", "</div>");
                                    site = site.Replace("<SCRIPT", "<div class='script'");
                                    site = site.Replace("</SCRIPT>", "</div>");
                                    site = site.Replace("<img", "<div class='image'");
                                    site = site.Replace("</img>", "</div>");
                                    site = site.Replace("style=", "cssstyle=");
                                    context.Response.Write(site);
                                }


                                //site = RemoveTagsFromHTML(site, "link");
                                /*var headStart = site.IndexOf("<head");
                                var headStop = site.IndexOf("</head>");
                                if (headStart > 0 && headStop > headStart)
                                {
                                    context.Response.Write(site.Substring(headStart, headStop - headStart + 7));
                                }*/
                            }
                            break;

                        case "urlload":
                            {
                                var url = HttpUtility.UrlDecode(file);
                                if (!url.StartsWith("http://"))
                                    url = "http://" + url;
                                var webRequest = WebRequest.Create(url);
                                var fileName = webRequest.RequestUri.Segments[webRequest.RequestUri.Segments.Length - 1];
                                if (fileName.Contains("."))
                                {
                                    var response = webRequest.GetResponse();
                                    var stream = response.GetResponseStream();
                                    byte[] buffer = new byte[response.ContentLength];
                                    stream.Read(buffer, 0, buffer.Length);
                                    stream.Close();
                                    FileStream fileStream = File.Create(rootPath + fileName);
                                    fileStream.Write(buffer, 0, buffer.Length);
                                    fileStream.Close();
                                    var entity = manager.CreateFileEntity(fileName);
                                    context.Response.ContentType = "text/html";
                                    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                                    //context.Response.Write(FilesHelper.GenerateFileLinkHTML(entity));
                                }
                            }
                            break;



                        case "reload":
                            context.Response.ContentType = "text/html";
                            context.Response.Write(FilesHelper.GetTree(manager, ""));
                            break;


                        case "browse":
                            context.Response.ContentType = "text/html";
                            if (context.Request["filter"] != null)
                            {
                                context.Response.Write(FilesHelper.GetTree(manager, context.Request["filter"]));
                            }
                            else
                            {
                                context.Response.Write(FilesHelper.GetTree(manager, ""));
                            }
                            break;

                        case "images":
                            context.Response.ContentType = "text/html";
                            var files = Directory.GetFiles(rootPath + "/images");
                            foreach (var entity in files)
                            {
                                context.Response.Write(FilesHelper.GenerateFileLinkHTML(entity));
                            }
                            break;
                            

                        case "delete":
                            {
                                manager.DeleteFile(filepath);
                                context.Response.Write(file);
                            }
                            break;

                        case "new":
                            {
                                manager.CreateContentFile(filepath);
                                context.Response.Write(FilesHelper.GenerateFileLinkHTML(manager, file));
                            }
                            break;

                        case "filecopy":
                            {
                                try
                                {
                                    var newItem = manager.FileCopy(file, "_" + file);
                                    context.Response.Write(FilesHelper.GenerateFileLinkHTML(newItem));
                                }
                                catch (System.Exception)
                                {
                                    context.Response.Write("Error!");
                                }
                            }
                            break;
                        case "settag":
                            {
                                var name = HttpUtility.UrlDecode(context.Request["tag"]);
                                if (!string.IsNullOrEmpty(file))
                                {
                                    manager.SetTag(file, name);
                                }
                                else
                                {
                                    manager.CheckTag(name);
                                }
                                context.Response.Write(FilesHelper.GenerateFileLinkHTML(manager, file));

                            }
                            break;

                        case "newtag":
                            {
                                var tag = manager.CheckTag(file);
                                context.Response.Write(FilesHelper.GenerateTagLinkHTML(tag));

                            }
                            break;

                        case "resettag":
                            {
                                var name = HttpUtility.UrlDecode(context.Request["tag"]);
                                if (!string.IsNullOrEmpty(file))
                                {
                                    manager.ReSetTag(file, name);
                                }
                                else
                                {
                                    manager.RemoveTag(name);
                                }
                                context.Response.Write(FilesHelper.GenerateFileLinkHTML(manager, file));

                            }
                            break;
                    }
                }
                //Thread.Sleep(5000);

            }
            catch (System.Exception e)
            {
                throw e;
            }
        }

        private string RemoveTagsFromHTML(string value, string tag)
        {
            var startTag = "<" + tag;
            var endTag = "</" + tag + ">";
            var index = value.IndexOf(startTag, StringComparison.OrdinalIgnoreCase);
            var removeFlag = false;
            while (index > 0)
            {
                removeFlag = false;
                var endIndex = value.IndexOf(endTag, index, StringComparison.OrdinalIgnoreCase);
                if (endIndex > 0)
                {
                    value = value.Remove(index, endIndex - index + endTag.Length);
                    removeFlag = true;
                }
                else
                {
                    endIndex = value.IndexOf(">", index, StringComparison.OrdinalIgnoreCase);
                    var newIndex = value.IndexOf("/>", index, StringComparison.OrdinalIgnoreCase);
                    if ((newIndex < endIndex && newIndex > index) || (endIndex < 0 && newIndex > index))
                    {
                        value = value.Remove(index, newIndex - index + 2);
                        removeFlag = true;
                    }
                    else
                    {
                        if (endIndex >= 0)
                        {
                            value = value.Remove(index, endIndex - index + 1);
                            removeFlag = true;
                        }
                    }
                }
                endIndex = index;
                index = value.IndexOf(startTag, StringComparison.OrdinalIgnoreCase);
                if (endIndex >= index && !removeFlag) return value;
            }
            return value;
        }

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}
