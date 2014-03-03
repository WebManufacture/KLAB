<%@ WebHandler Language="C#" Class="MRS.Web.HighliteHandler" %>

using System;
using System.Web;

namespace MRS.Web
{
    public class HighliteHandler : IHttpHandler
    {
        public CodeHighlite.codeTools CodeTools = new CodeHighlite.codeTools();
        public string serviceKey = "99250849f271108240fd67b7e9b8fd43";
        
        public void ProcessRequest(HttpContext context)
        {
            var lang = context.Request["lang"];
            CodeHighlite.lang language = (CodeHighlite.lang)Enum.Parse(typeof(CodeHighlite.lang), lang);
            var bytes = context.Request.InputStream.Length;
            var code = new byte[bytes];
            context.Request.InputStream.Read(code, 0, (int)bytes);
            try
            {
                var src = CodeTools.Highlight(serviceKey, language, false, false, false, false, "4", "VIEW", "COPY", "PRINT", ref code);
                context.Response.Write(src);
            }
            catch(Exception e)
            {
                context.Response.Write(e.Message);
            }
        }

        public bool IsReusable
        {
            get { return false; }
        }

    }
}