<%@ WebHandler Language="C#" Class="MRS.Web.UI.ContentHandler" %>

using System;
using System.Collections.Generic;
using System.IO;
using System.Linq;
using System.Net;
using System.Text.RegularExpressions;
using System.Web;
using System.Web.UI;
using MRS.Core;
using MRS.Core.Parsers;

namespace MRS.Web.UI
{
    public class ContentHandler : IHttpHandler
    {
		public static Dictionary<string, FilesManager> filesManagers;

        public static Dictionary<string, FilesManager> FilesManagers
		{
			get{
				if ( filesManagers == null)
                    filesManagers = new Dictionary<string, FilesManager>();
				return filesManagers;
			}
		}

        public string GenerateFileLinkHTML(LinkItem file)
        {
            string[] values = new string[file.Links.Count];
            for (int i = 0; i < values.Length; i++)
            {
                values[i] = file.Links[i].Value;
            }
            var tags = string.Join(" ", values);
            return string.Format("<file id='file{2}' name='{0}' class='{1}'>{0}</file>", file.Value, tags,
                                 Guid.NewGuid().ToString("N"));
        }

        public string GenerateFileLinkHTML(FilesManager manager, string file)
        {
            return GenerateFileLinkHTML(manager.FileTag[file]);
        }

        public string GenerateTagLinkHTML(LinkItem tag)
        {
            return "<tag id='tag" + Guid.NewGuid().ToString("N") + "' class='tag' name='" + tag.Value + "'>" + tag.Value + "</tag>";
        }
	
        public void ProcessRequest(HttpContext context)
        {
            var path = HttpUtility.UrlDecode(context.Request["path"]);
            var directory = context.Server.MapPath(path) + "\\";
            FilesManager manager = null;
			if (FilesManagers.ContainsKey(path))
			{
				manager = FilesManagers[path];
			}
			else
			{
				if (!string.IsNullOrEmpty(path))
				{
                    manager = new FilesManager(directory);
                    FilesManagers.Add(path, manager); 
				}
			}
            context.Response.ContentType = "text/plain";
            if (context.Request.HttpMethod == "POST")
            {
                var fileName = "Content.htm";
                if (!string.IsNullOrEmpty(context.Request["name"]))
                {
                    fileName = context.Request["name"];
                }
                var filepath = context.Server.MapPath("~/UserFiles") + "\\" + fileName;
                context.Request.SaveAs(filepath, false);
                context.Response.Write(GenerateFileLinkHTML(manager, fileName));
                return;
            }
            if (context.Request.HttpMethod == "GET")
            {
                if (context.Request.QueryString["file"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["file"]);
                    context.Server.TransferRequest("~/" + path + "/" + name);
                    return;
                }

                if (context.Request.QueryString["text"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["text"]);
                    context.Response.ContentType = "text/html";
                    var file = manager.GetFile(name);
                    BaseContentParser parser = new BaseContentParser(directory + name);
                    switch (file.FileType)
                    {
                        case "html":
                        case "htm":
                            parser = new HtmlContentParser(directory + name);
                            break;
                        case "js":
                            parser = new JSContentParser(directory + name);
                            break;
                    }
                    context.Response.Write(parser.Parse());
                    return;
                }

                if (context.Request.QueryString["url"] != null)
                {
                    var url = HttpUtility.UrlDecode(context.Request["url"]);
                    if (!url.StartsWith("http://"))
                        url = "http://" + url;
                    var webRequest = WebRequest.Create(url);
                    var response = webRequest.GetResponse();
                    StreamReader reader = new StreamReader(response.GetResponseStream());
                    var site = reader.ReadToEnd();
                    reader.Close();
                    response.Close();
                    context.Response.ContentType = "text/html";
                    site = RemoveTagsFromHTML(site, "script");
                    var headStart = site.IndexOf("<head");
                    var headStop = site.IndexOf("</head>");
                    if (headStart > 0 && headStop > headStart)
                    {
                        context.Response.Write(site.Substring(headStart, headStop - headStart + 7));
                    }
                    var bodyStart = site.IndexOf("<body");
                    var bodyStop = site.IndexOf("</body>");
                    if (bodyStart > 0 && bodyStop > bodyStart)
                    {
                        context.Response.Write(site.Substring(bodyStart, bodyStop - bodyStart + 7));
                    }
                    return;
                }
                if (context.Request.QueryString["browse"] != null)
                {
                    context.Response.ContentType = "text/html";
                    foreach (var tag in manager.RootTag.Links)
                    {
                        if (tag != manager.FileTag)
                            context.Response.Write(GenerateTagLinkHTML(tag));
                    }

                    foreach (var item in manager.FileTag.Links)
                    {
                        if (item != manager.RootTag)
                            context.Response.Write(GenerateFileLinkHTML(item));
                    }
                    return;
                }
                if (context.Request.QueryString["new"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["new"]);
                    manager.CreateContentFile(context.Server.MapPath("~/UserFiles/" + name));
                    context.Response.Write(GenerateFileLinkHTML(manager, name));
                    return;
                }
                if (context.Request.QueryString["settag"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["settag"]);
                    var file = HttpUtility.UrlDecode(context.Request["file"]);
                    if (!string.IsNullOrEmpty(file))
                    {
                        manager.SetTag(file, name);
                    }
                    else
                    {
                        manager.CheckTag(name);
                    }
                    context.Response.Write(GenerateFileLinkHTML(manager, name));
                    return;
                }
                if (context.Request.QueryString["resettag"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["resettag"]);
                    var file = HttpUtility.UrlDecode(context.Request["file"]);
                    if (!string.IsNullOrEmpty(file))
                    {
                        manager.ReSetTag(file, name);
                    }
                    else
                    {
                        manager.RemoveTag(name);
                    }
                    context.Response.Write(GenerateFileLinkHTML(manager, name));
                    return;
                }
                if (context.Request.QueryString["delete"] != null)
                {
                    var name = HttpUtility.UrlDecode(context.Request["delete"]);
                    var filepath = context.Server.MapPath("~/UserFiles/" + name);
                    manager.DeleteFile(filepath);
                    context.Response.Write(name);
                    return;
                }
                return;
            }
        }

        private string RemoveTagsFromHTML(string value, string tag)
        {
            var startTag = "<" + tag;
            var endTag = "</" + tag + ">";
            var index = value.IndexOf(startTag, StringComparison.OrdinalIgnoreCase);
            while (index > 0)
            {
                var endIndex = value.IndexOf(endTag, index, StringComparison.OrdinalIgnoreCase);
                if (endIndex > 0)
                {
                    value = value.Remove(index, endIndex - index + endTag.Length);
                }
                index = value.IndexOf(startTag, StringComparison.OrdinalIgnoreCase);
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
