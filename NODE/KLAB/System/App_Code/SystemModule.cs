using System;
using System.Web;

namespace MRS.Web
{
    public class SystemModule : IHttpHandler
    {
        public void ProcessRequest(HttpContext context)
        {
            if (context.Request.Path.EndsWith("/"))
                context.Server.TransferRequest("~/System.Index.htm");
            else
            {
            }
        }

        public bool IsReusable
        {
            get { return false; }
        }
    }
}