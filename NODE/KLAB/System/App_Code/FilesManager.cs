using System;
using System.Collections.Generic;
using System.IO;
using System.Text;
using System.Timers;
using System.Xml.Linq;
using MRS.Core;

namespace MRS.Web
{
    public class FileLinkItem : LinkItem
    {
        public FileLinkItem(string fileName)
            : base(fileName)
        {
        }

        public string FileType
        {
            get { return Path.GetExtension(this.Value).TrimStart('.'); }
        }
    }

    public class FilesManager
    {
        protected static FilesManager filesManager;
        
        public static FilesManager GetManager(string RootPath)
        {
            if (filesManager == null)
            {
                filesManager = new FilesManager(RootPath + "\\");
            }
            return filesManager;
        }

        protected Timer timer;
        
		protected string treePath;
		public LinkItem FileTag;
        public LinkItem RootTag;


        public LinkItem this[string index]
        {
            get
            {
                return FileTag[index];
            }
        }

        public FilesManager(string path)
        {
			treePath = path;
            FileTag = new LinkItem("File");
            RootTag = new LinkItem("Tag");
            FileTag.LinkTo(RootTag);

            
            //timer = new Timer(1000);
            //timer.Elapsed += timer_Elapsed;
            //timer.Start();
        }

        public void SaveDescriptionFile()
        {
            XDocument tree = null;
            tree = new XDocument();
            var files = new XElement("Files");
            tree.Add(files);
            foreach (var file in FileTag.Links)
            {
                if (file.Value == "Tag") continue;
                XElement fileElement = new XElement("file");
                fileElement.SetAttributeValue("Name", file.Value);
                foreach (var tag in file.Links)
                {
                    var tagElement = new XElement("tag");
                    tagElement.SetAttributeValue("Name", tag.Value);
                    tagElement.SetValue(tag.Value);
                    fileElement.Add(tagElement);
                }
                files.Add(fileElement);
            }
            try
            {
                tree.Save(treePath + "tree.xml");
            }
            catch (Exception e)
            {
                
            }
        }



       public FileLinkItem CreateContentFile(string filePath)
        {
            var filestream = new StreamWriter (filePath, false, Encoding.UTF8);
            filestream.Write(" ");
            filestream.Close();
            var entity = CreateFileEntity(Path.GetFileName(filePath));
            SaveDescriptionFile();
           return entity;
        }

       public LinkItem FileCopy(string oldName, string newName)
       {
           File.Copy(treePath + oldName, treePath + newName);
           var oldFile = this[oldName];
           var newItem = oldFile.Clone(newName);
           SaveDescriptionFile();
           return newItem;
       }

        public FileLinkItem CreateFileEntity(string fileName)
        {
            FileLinkItem file = new FileLinkItem(fileName);
            FileTag.LinkTo(file);
            if (file.FileType == "jpg" || file.FileType == "jpeg" || file.FileType == "gif" || file.FileType == "png" || file.FileType == "psd")
            {
                SetTag(file, "Image");
            }
            SetTag(file, file.FileType);
            return file;
        }


        public LinkItem GetTag(string name)
        {
            var tag = RootTag[name];
            if (tag == null)
            {
                tag = new LinkItem(name);
                RootTag.LinkTo(tag);
            }
            return tag;
        }



        public void SetTag(LinkItem file, LinkItem tag)
        {
            file.LinkTo(tag);
            SaveDescriptionFile();
        }

        public void SetTag(string file, string tag)
        {
            var item = FileTag[file];
            if (file == null) return;
            SetTag(item, GetTag(tag));
        }

        public void SetTag(LinkItem file, string tag)
        {
            SetTag(file, GetTag(tag));
        }

        public LinkItem CheckTag(string name)
        {
            return GetTag(name);
        }


        public void RemoveTag(string name)
        {
            var item = RootTag[name];
            if (item == null) return;
            item.Delete();
            SaveDescriptionFile();
        }

        public void ReSetTag(string file, LinkItem tag)
        {
            var item = FileTag[file];
            if (item == null) return;
            item.RemoveLink(tag);
            SaveDescriptionFile();
        }

        public void ReSetTag(string file, string tag)
        {
            var item = FileTag[file];
            if (item == null) return;
            var tagLink = RootTag[tag];
            if (tagLink == null) return;
            item.RemoveLink(tagLink);
            if (tagLink.Links.Count <= 0)
            {
                tagLink.Delete();
            }
            SaveDescriptionFile();
        }

        public void DeleteFile(string path)
        {
            var file = FileTag[Path.GetFileName(path)];
            if (file != null)
            {
                file.Delete();
            }
            if (File.Exists(path))
            {
                File.Delete(path);
            }
            SaveDescriptionFile();
        }

        public FileLinkItem GetFile(string name)
        {
            return FileTag[name] as FileLinkItem;
        }
    }
}