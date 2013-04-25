using System;
using System.Web;
using MRS.Web.UI;

namespace MRS.Web
{

    public partial class Global : System.Web.HttpApplication
    {
        public override void Init()
        {
            base.Init();
        }

        public void Application_Start(object sender, EventArgs e)
        {
           // FilesManager.Initialize(Server.MapPath("~/UserFiles/"));
        }
    }
}
