<%@ WebHandler Language="C#" Class="MRS.Web.UI.ImagesHandler" %>

using System;
using System.Collections.Generic;
using System.Drawing;
using System.Drawing.Imaging;
using System.IO;
using System.Linq;
using System.Web;

namespace MRS.Web.UI
{
    public class ImagesHandler : IHttpHandler
    {
        public const string defaultFile = "~/UserFiles/Content.htm";

        public void ProcessRequest(HttpContext context)
        {
            context.Response.ContentType = "text/plain";
            if (context.Request["crop"] != null)
            {
                var name =  HttpUtility.UrlDecode(context.Request.QueryString["crop"]);
                name = context.Server.MapPath(name);
                if (File.Exists(name))
                {
                    var left = int.Parse(context.Request.QueryString["left"]);
                    var top = int.Parse(context.Request.QueryString["top"]);
                    var width = int.Parse(context.Request.QueryString["width"]);
                    var height = int.Parse(context.Request.QueryString["height"]);
                    var DestRect = new Rectangle(0, 0, width, height);
                    Bitmap image = new Bitmap(name);
                    if (left > image.Width)
                    {
                        left = left - (int)(left / image.Width) * image.Width;
                    }
                    if (top > image.Height)
                    {
                        top = top - (int)(top / image.Height) * image.Height;
                    }
                    if (left + width > image.Width)
                    {
                        width = image.Width - left;
                    }
                    if (top + height > image.Height)
                    {
                        height = image.Height - top;
                    } 
                    var SourceRect = new Rectangle(left, top, width, height);
                    Bitmap newImage = new Bitmap(width, height);
                    Graphics g = Graphics.FromImage(newImage);
                    g.DrawImage(image, DestRect, SourceRect, GraphicsUnit.Pixel);
                    var newName = "/CropedImage-" + Guid.NewGuid().ToString("N") + ".jpg";
                    newImage.Save(context.Server.MapPath("~" + newName), ImageFormat.Png);
                    context.Response.Write(newName);
                }
                return;
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
