using System.Collections.Generic;
using System.Web;

namespace MRS.Web.UI
{

    public struct COMETMessage
    {
        public string Body;

        public COMETMessage(string message)
        {
            Body = message;
        }

        public string Message
        {
            get
            {
                return "Content-type: text/html\r\n\r\n" + Body + "--{ENDMESSAGE};";
            }
        }
    }
    public class COMETManager
    {
        public static List<COMETMessage> MessageQuery
        {
            get
            {
                return HttpContext.Current.Session["Messages"] as List<COMETMessage>;
            }
        }

        public static void AddMessage(string message)
        {
            COMETMessage cometMessage = new COMETMessage(message);
            MessageQuery.Add(cometMessage);
        }
    }
}