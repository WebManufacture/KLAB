using System;
using System.Collections.Generic;
using System.Linq;

namespace MRS.Core
{
    public enum LinkType
    {
        simple = 0,
        parent = 1,
        child = 2,
        friend = 3
    }

    public class LinkItem
    {
        public string Value;
        public List<LinkItem> Links;

        public LinkItem this[int index]
        {
            get
            {
                return Links[index];
            }
        }

        public LinkItem this[string index]
        {
            get
            {
                return GetLinkTo(index);
            }
        }

        public LinkItem(string item)
        {
            Value = item;
            Links = new List<LinkItem>();
        }

        public void LinkTo(LinkItem item)
        {
            Links.Add(item);
            item.Links.Add(this);
        }



        public void Delete()
        {
            foreach (var link in Links)
            {
                link.Links.Remove(this);
            }
            Links.Clear();
            Links = null;
        }


        public void RemoveLink(LinkItem item)
        {
            item.Links.Remove(this);
            Links.Remove(item);
        }


        public bool HasLinkTo(string value)
        {
            return Links.Any(item => item.Value == value);
        }

        public LinkItem GetLinkTo(string value)
        {
            return Links.FirstOrDefault(item => item.Value == value);
        }
               
        public IEnumerable<LinkItem> GetLinksTo(string value)
        {
            return Links.Where(item => item.Value == value);
        }

        public LinkItem Clone()
        {
            return Clone(Value);
        }

        public LinkItem Clone(string value)
        {
            LinkItem newItem = new LinkItem(value);
            foreach (var link in Links)
            {
                newItem.LinkTo(link);
            }
            return newItem;
        }

    }
}