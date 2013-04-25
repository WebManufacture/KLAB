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
            context.Response.Headers.Add("Access-Control-Allow-Methods", "POST,GET,OPTIONS");
            context.Response.Headers.Add("Access-Control-Request-Header", "X-Prototype-Version, x-requested-with");
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
