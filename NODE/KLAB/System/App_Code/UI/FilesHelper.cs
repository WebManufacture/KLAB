using System;
using System.IO;
using MRS.Core;
using MRS.Web.UI;

namespace MRS.Web.UI
{
    public static class FilesHelper
    {
        public static string GenerateFileLinkHTML(string file)
        {
            if (file.Contains("\\"))
            {
                file = Path.GetFileName(file);
            }
            var ext = Path.GetExtension(file);
            return string.Format("<file id='file{2}' name='{0}' class='File {1}'><name class='name'>{0}</name><tags class='tags'></tags></file>", file, ext, Guid.NewGuid().ToString("N"));
        }

        public static string GenerateFileLinkHTML(LinkItem file)
        {
            string[] values = new string[file.Links.Count];
            string links = "";
            for (int i = 0; i < values.Length; i++)
            {
                values[i] = file.Links[i].Value;
                if (file.Links[i].Value != "File")
                links += GenerateTagLinkHTML(file.Links[i]);
            }
            var tags = string.Join(" ", values);
            return string.Format("<file id='file{3}' name='{0}' class='{1}'><name class='name'>{0}</name><tags class='tags'>{2}</tags></file>", file.Value, tags, links, Guid.NewGuid().ToString("N"));
        }


        public static string GenerateFileLinkHTML(FilesManager manager, string file)
        {
            return GenerateFileLinkHTML(manager.FileTag[file]);
        }

        public static string GenerateTagLinkHTML(LinkItem tag)
        {
            return "<tag id='tag" + Guid.NewGuid().ToString("N") + "' class='tag' name='" + tag.Value + "'>" + tag.Value + "</tag>";
        }

        public static string GetTree(FilesManager manager, string filter)
        {
            string html = "";
            if (string.IsNullOrEmpty(filter))
            {
                foreach (var tag in manager.RootTag.Links)
                {
                    if (tag != manager.FileTag)
                        html += GenerateTagLinkHTML(tag);
                }
                foreach (var item in manager.FileTag.Links)
                {
                    if (item != manager.RootTag)
                        html += GenerateFileLinkHTML(item);
                }
            }
            else
            {
                var tag = manager.RootTag.GetLinkTo(filter);
                html += GenerateTagLinkHTML(tag);
                foreach (var item in manager.FileTag.Links)
                {
                    if (item.Links.Contains(tag) && item != manager.RootTag)
                        html += GenerateFileLinkHTML(item);
                }
            }
            return html;
        }

        public static string GetMobileTree(FilesManager manager)
        {
            string html = "";
            foreach (var tag in manager.RootTag.Links)
            {
                if (tag != manager.FileTag)
                {
                    html += "<a href='/mobile/files.aspx?tag=" + tag.Value + "' class='tag' name='" + tag.Value + "'>" + tag.Value + "</a>";
                }
            }

            foreach (var item in manager.FileTag.Links)
            {
                if (item != manager.RootTag)
                {
                    html += "<a href='/mobile/editor.aspx?file=" + item.Value + "'>" + GenerateFileLinkHTML(item) + "</a>";
                }
            }
            return html;
        }
    }
}