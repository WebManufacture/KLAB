using System;
using System.IO;
using System.Web;
using MRS.Web.UI;

namespace MRS.Core.Parsers
{
    public class BaseContentParser
    {
        public string Content;

        public BaseContentParser(string filePath)
        {
            StreamReader reader = new StreamReader(filePath);
            Content = reader.ReadToEnd();
            reader.Close();
        }

        public BaseContentParser()
        {

        }

        public virtual string Parse()
        {
            return Content;
        }
    }
}