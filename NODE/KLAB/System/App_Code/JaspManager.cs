using System;
using System.IO;
using System.Text;
using System.Web;
using Fizzler;
using Fizzler.Systems;
using Fizzler.Systems.HtmlAgilityPack;
using HtmlAgilityPack;
using MRS.Web.UI;

namespace MRS.Core.Parsers
{
    public class JaspManager
    {
        private static HtmlDocument tempDoc = new HtmlDocument();

        public static string ProcessMessage(HtmlDocument doc, string command)
        {
            string result = "";
            tempDoc.LoadHtml(command);
            var message = tempDoc.DocumentNode;
            foreach (var commandNode in message.ChildNodes)
            {
                if (commandNode.NodeType ==HtmlNodeType.Element)
                {
                    switch (commandNode.Name.ToLower())
                    {
                        case "get":
                            return Get(doc, commandNode);
                        case "set":
                            return Set(doc, commandNode);
                        case "append":
                            return Append(doc, commandNode);
                        case "remove":
                            return Remove(doc, commandNode);
                    }
                }
            }
            
            return "";
        }

        public static string Get(HtmlDocument document, HtmlNode message)
        {
            var value = "";
            var selector = message.GetAttributeValue("selector", message.InnerHtml);
            var type = message.GetAttributeValue("type", null);
            var subselect = message.GetAttributeValue("subselect", null);
            var nodes = document.DocumentNode.QuerySelectorAll(selector);
            foreach (var htmlNode in nodes)
            {
                switch (type){
                  case "attribute":
                  value += htmlNode.GetAttributeValue(subselect, "");
                  break;
                case "inner":
                  value += htmlNode.InnerHtml;
                  break;
                case "text":
                  value += htmlNode.InnerText;
                  break;
                case "value":
                  value += htmlNode.GetAttributeValue("value", "");
                  break;
                case "objects":
                  value += htmlNode.OuterHtml;
                  break;
                default:
                   value = "";
                   break;
                }
            }
            return value;
        }

        public static string Set(HtmlDocument document, HtmlNode message)
        {
            var selector = message.GetAttributeValue("selector", "");
            var type = message.GetAttributeValue("type", "");
            var subselect = message.GetAttributeValue("subselect", "");
            var nodes = document.DocumentNode.QuerySelectorAll(selector);
            foreach (var htmlNode in nodes)
            {
                switch (type)
                {
                    case "attribute":
                        htmlNode.SetAttributeValue(subselect, message.InnerHtml);
                        break;
                    case "inner":
                        htmlNode.InnerHtml = message.InnerHtml;
                        break;
                    case "text":
                        htmlNode.InnerHtml = message.InnerText;
                        break;
                    case "value":
                        htmlNode.SetAttributeValue("value", message.InnerHtml);
                        break;
                    case "append":
                        htmlNode.InnerHtml += message.InnerHtml;
                        break;
                    case "prepend":
                        htmlNode.InnerHtml = message.InnerHtml + htmlNode.InnerHtml;
                        break;
                    default:
                        break;
                }
            }
            return "";
        }

        public static string Append(HtmlDocument document, HtmlNode message)
        {
            var selector = message.GetAttributeValue("selector", "");
            if (selector == "")
            {
                document.DocumentNode.InnerHtml += message;
                return "";
            }
            var nodes = document.DocumentNode.QuerySelectorAll(selector);
            foreach (var htmlNode in nodes)
            {
                htmlNode.InnerHtml += message.InnerHtml;
            }
            return "";
        }

        public static string Remove(HtmlDocument document, HtmlNode message)
        {
            var selector = message.GetAttributeValue("selector", "");
            var nodes = document.DocumentNode.QuerySelectorAll(selector);
            foreach (var htmlNode in nodes)
            {
                htmlNode.ParentNode.RemoveChild(htmlNode);
            }
            return "";
        }
    }
}