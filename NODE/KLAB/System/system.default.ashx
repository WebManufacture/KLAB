 <%@ WebHandler Language="C#" Class="MRS.Web.UI.AjaxDefaultHandler" %>

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Web;

namespace MRS.Web.UI
{
    public class AjaxDefaultHandler : IHttpHandler
    {

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            
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
