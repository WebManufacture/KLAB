<%@ WebHandler Language="C#" Class="MRS.Web.UI.SimpleHandler" %>

using System;
using System.IO;
using System.Net;
using System.Text;
using System.Web;
using System.Xml.Linq;

namespace MRS.Web.UI
{
    public class SimpleHandler : IHttpHandler
    {
        public string GetFileContent(string filePath)
        {
            StreamReader reader = null;
            try
            {
                reader = new StreamReader(filePath, Encoding.UTF8);
                return reader.ReadToEnd();
            }
            catch (Exception e)
            {
                return "File read error! - " + filePath;
            }
            finally
            {
                if (reader != null) reader.Close();
            }
        }

        public string GetExtension(string file)
        {
            if (File.Exists(file))
            {
                return (Path.GetExtension(file) ?? "").Replace(".", "");
            }
            return "";
        }

        public string GenerateFileLink(string file)
        {
            var tag = GetExtension(file);
            file = Path.GetFileName(file);
            return string.Format("<file id='file{2}' name='{0}' class='file File {1}' ext='{3}'><name class='name'>{0}</name></file>", file, tag, Guid.NewGuid().ToString("N"), tag);
        }

        public string GenerateTagLinkHTML(string tag)
        {
            return "<tag id='tag" + Guid.NewGuid().ToString("N") + "' class='tag' name='" + tag + "'>" + tag + "</tag>";
        }

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
            context.Response.Headers.Add("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
            context.Response.Headers.Add("Access-Control-Request-Header", "X-Prototype-Version, x-requested-with");
            try
            {
                var file = HttpUtility.UrlDecode(context.Request.QueryString["file"]);
                var path = HttpUtility.UrlDecode(context.Request.QueryString["path"] ?? "");
                if (path != "") path += "/";
                var action = context.Request.QueryString["action"] ?? "";
                path = Path.GetFullPath(context.Server.MapPath("~/" + path));
                var filepath = path + file;

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
						if (context.Request.ContentType.ToLower().Contains("charset=utf-8")){
							var streamReader = new StreamReader(context.Request.InputStream, Encoding.UTF8);
                            var content = streamReader.ReadToEnd();
                            streamReader.Close();					
							var writer = new StreamWriter(filepath, false, Encoding.UTF8);
							writer.Write(content);
							writer.Close();
						}
						else{
                        	context.Request.SaveAs(filepath, false);
                        }
						context.Response.Write(GenerateFileLink(file));
                    }
                    catch (Exception e)
                    {
                        context.Response.Write("<error>" + e.Message + "</error>");
                    }
                    return;
                }
                if (context.Request.HttpMethod == "GET")
                {
                    switch (action)
                    {
                        case "get":
                            context.Response.ContentType = "text/" + GetExtension(filepath);
                            context.Response.Write(GetFileContent(filepath));
                            break;
                        case "text":
                            {
                                context.Response.Write(GetFileContent(filepath));
                            }
                            break;
                        case "browse":
                            {
                                var Files = Directory.GetFiles(path);
                                foreach (var fileEntry in Files)
                                {
                                    context.Response.Write(GenerateFileLink(fileEntry));
                                }
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
                                    FileStream fileStream = File.Create(filepath);
                                    fileStream.Write(buffer, 0, buffer.Length);
                                    fileStream.Close();
                                    context.Response.ContentType = "text/html";
                                    context.Response.Headers.Add("Access-Control-Allow-Origin", "*");
                                    context.Response.Write(GenerateFileLink(file));
                                }
                            }
                            break;

                        case "delete":
                            {
                                File.Delete(filepath);
                                context.Response.Write(file);
                            }
                            break;

                        case "new":
                            {
                                var stream = File.Create(filepath);
                                stream.Close();
                                context.Response.Write(GenerateFileLink(file));
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

        public bool IsReusable
        {
            get
            {
                return false;
            }
        }
    }
}