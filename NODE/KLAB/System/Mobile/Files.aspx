<%@ Page Language="C#" %>
<%@ Import Namespace="MRS.Web" %>
<%@ Import Namespace="MRS.Web.UI" %>

<!DOCTYPE html!>

<script runat="server">
    protected override void OnLoad(EventArgs e)
    {
        base.OnLoad(e);
        var requestPath = Request["path"];
        if (requestPath == null) requestPath = "";
        var manager = FilesManager.GetManager(Server.MapPath("~/" + requestPath));
        filesList.InnerHtml = FilesHelper.GetMobileTree(manager);
    }
</script>

<html xmlns="http://www.w3.org/1999/xhtml">
<head runat="server">
    <title></title>
    <link href="../System/System.Files.css" rel="stylesheet" type="text/css"/>
</head>
<body>
    <form id="HtmlForm" runat="server">
        <div id="files-block">
            <div runat="server" id="filesList" class="tree-container">
            
            </div>
        </div>
    </form>
</body>
</html>
