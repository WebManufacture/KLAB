using System.IO;
using System.Web;
using MRS.Web.UI;

namespace MRS.Core.Parsers
{
    public class JSContentParser : BaseContentParser
    {
        protected string html;
        public char[] separators;

        public JSContentParser(string fileName)
            : base(fileName)
        {
            html = "";
        }


        public override string Parse()
        {
            return Content;
        }


        public void CalculataParts(string[] parts)
        {

        }
    }


}