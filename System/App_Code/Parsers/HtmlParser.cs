using System.IO;
using System.Web;
using HtmlAgilityPack;
using MRS.Web.UI;

namespace MRS.Core.Parsers
{
    public class HtmlContentParser : BaseContentParser
    {
        public HtmlContentParser(string fileName): base(fileName)
        {
            
        }

        public override string Parse()
        {
            return Content;
        }
    }
}